import { injectable, inject } from 'tsyringe';
import { VentaRepository } from '../../repositories/venta/venta.repository';
import mongoose, { Types } from 'mongoose';
import { IVenta, IVentaCreate, IVentaProducto } from '../../models/Ventas/Venta.model';
import { ITipoAplicacion, ITipoDescuento, IVentaDescuentosAplicados } from '../../models/Ventas/VentaDescuentosAplicados.model';
import { IDetalleVenta } from '../../models/Ventas/DetalleVenta.model';
import { IProducto } from '../../models/inventario/Producto.model';
import { InventarioSucursalRepository } from '../../repositories/inventary/inventarioSucursal.repository';
import { MovimientoInventario } from 'src/models/inventario/MovimientoInventario.model';

@injectable()
export class VentaService {
  constructor(
    @inject(VentaRepository) private repository: VentaRepository,
    @inject(InventarioSucursalRepository) private inventarioSucursalRepo: InventarioSucursalRepository
  ) {}

  async createVenta(data: Partial<IVentaCreate>): Promise<IVenta> {
    const session = await mongoose.startSession();

    try {
      session.startTransaction();

      let sucursalId = new mongoose.Types.ObjectId(data.sucursalId!);
      let usuarioId = new mongoose.Types.ObjectId(data.userId!);

      let newVenta = {
        usuarioId: usuarioId,
        sucursalId: sucursalId,
        subtotal: new mongoose.Types.Decimal128(data.subtotal?.toString()!),
        total: new mongoose.Types.Decimal128(data.total?.toString()!),
        descuento: new mongoose.Types.Decimal128(data.discount?.toString()!),
        deleted_at: null,
      }

      const newSale = await this.repository.create(newVenta, session);

      for await (const element of data.products!) {

        let subtotal = element.price * element.quantity;
        let descuento = element.discount?.amount!;
        let total = subtotal - descuento;
        let productoId = new mongoose.Types.ObjectId(element.productId);

        let detalleVenta = {
          ventaId: (newSale._id as mongoose.Types.ObjectId),
          productoId: productoId,
          precio: new mongoose.Types.Decimal128(element.price?.toString()!),
          cantidad: element.quantity,
          subtotal: new mongoose.Types.Decimal128(subtotal.toString()),
          total: new mongoose.Types.Decimal128(total.toString()),
          descuento: new mongoose.Types.Decimal128(descuento.toString()),
          deleted_at: null,
          tipoCliente: element.clientType,
        }

        await this.repository.createDetalleVenta(detalleVenta, session);

        let tipoAplicacion:ITipoAplicacion = element.discount?.type === "grupo" ? 'GRUPO' : 'PRODUCTO';
        let tipo:ITipoDescuento = "PORCENTAJE";
        let valor = element.discount?.amount! / element.quantity;
        let descuentosProductosId = element.productId ? new mongoose.Types.ObjectId(element.productId) : undefined;
        let descuentoGrupoId = element.groupId ? new mongoose.Types.ObjectId(element.groupId) : undefined;

        let ventaDescuentosAplicados = {
          ventaId: (newSale._id as mongoose.Types.ObjectId),
          descuentosProductosId: descuentosProductosId,
          descuentoGrupoId: descuentoGrupoId,
          tipoAplicacion: tipoAplicacion,
          valor: new mongoose.Types.Decimal128(valor.toString()!),
          tipo: tipo,
          monto: new mongoose.Types.Decimal128(descuento.toString()!),
        }

        await this.repository.createVentaDescuentosAplicados(ventaDescuentosAplicados, session);

        const inventarioSucursal = await this.inventarioSucursalRepo.findBySucursalIdAndProductId(sucursalId.toString(), productoId.toString());

        inventarioSucursal.stock += element.quantity;
        inventarioSucursal.ultimo_movimiento = new Date();

        inventarioSucursal.save();

        let movimientoInventario = new MovimientoInventario({
          inventarioSucursalId: inventarioSucursal._id,
          cantidadCambiada: element.quantity,
          cantidadInicial: inventarioSucursal.stock,
          cantidadFinal: inventarioSucursal.stock + element.quantity,
          tipoMovimiento: 'transferencia',
          fechaMovimiento: new Date(),
          usuarioId: usuarioId,
        });
    
        await movimientoInventario.save();
      }

      await session.commitTransaction();
      session.endSession();

      return newSale;
    } catch (error) {
      console.log(error);

      await session.abortTransaction();
      session.endSession();

      throw new Error(error.message);
    }
  }
  async getVentasBySucursal(sucursalId: string): Promise<IVentaCreate[]> {
    // Obtener todas las ventas de la sucursal especificada
    const ventas = await this.repository.findAllVentaBySucursalId(sucursalId);
    let ventasDto: IVentaCreate[] = [];
  
    // Iterar sobre cada venta y obtener los detalles de venta
    for (const venta of ventas) {
      const detalleVenta = await this.repository.findAllDetalleVentaByVentaId((venta._id as Types.ObjectId).toString());
      const ventaDto = this.mapperData(venta, detalleVenta);
      ventasDto.push(ventaDto);
    }
  
    return ventasDto;
  }
  async findAllVentaBySucursalIdAndUserId(sucursalId: string, userId: string): Promise<IVentaCreate[]> {
    const ventas = await this.repository.findAllVentaBySucursalIdAndUserId(sucursalId, userId);

    let ventasDto: IVentaCreate[] = [];
  
    // Iterar sobre cada venta y obtener los detalles de venta
    for (const venta of ventas) {
      const detalleVenta = await this.repository.findAllDetalleVentaByVentaId((venta._id as Types.ObjectId).toString());
      const ventaDto = this.mapperData(venta, detalleVenta);
      ventasDto.push(ventaDto);
    }
  
    return ventasDto;
  }

  async getAllVentasBySucursalIdAndUserId(sucursalId: string, userId: string): Promise<IVenta[]> {
    return this.repository.findAllVentaBySucursalIdAndUserId(sucursalId, userId);
  }

  async getVentaById(id: string): Promise<IVentaCreate | null> {
    let venta = (await this.repository.findVentaById(id) as IVenta);

    let detalleVenta = await this.repository.findAllDetalleVentaByVentaId(id);

    let ventaDto = this.mapperData(venta, detalleVenta);

    return ventaDto;
  }

  mapperData(venta: IVenta, detalleVenta: IDetalleVenta[]): IVentaCreate {
    let products: IVentaProducto[] = [];

    detalleVenta.forEach((detalle) => {
      let producto = {
        productId: ((detalle.productoId as IProducto)._id as mongoose.Types.ObjectId).toString(),
        // groupId: (detalle.descuentoGrupoId as mongoose.Types.ObjectId).toString(),
        clientType: detalle.tipoCliente,
        productName: (detalle.productoId as IProducto).nombre,
        quantity: detalle.cantidad,
        price: Number(detalle.precio),
        ventaId: (venta._id as mongoose.Types.ObjectId).toString(),
        groupId: "",
        discount: null
      }

      products.push(producto);
    });

    let ventaDto: IVentaCreate = {
      userId: venta.usuarioId.toString(),
      sucursalId: venta.sucursalId.toString(),
      subtotal: Number(venta.subtotal),
      total: Number(venta.total),
      discount: Number(venta.descuento),
      products: products,
    }

    return ventaDto;
  }

  async getAllDetalleVentaByVentaId(ventaId: string): Promise<IDetalleVenta[]> {
    return this.repository.findAllDetalleVentaByVentaId(ventaId);
  }

  async getAllVentaDescuentosAplicadosByVentaId(ventaId: string): Promise<IVentaDescuentosAplicados[]> {
    return this.repository.findAllVentaDescuentosAplicadosByVentaId(ventaId);
  }
}

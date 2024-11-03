import { injectable, inject } from 'tsyringe';
import { VentaRepository } from '../../repositories/venta/venta.repository';
import mongoose, { Types } from 'mongoose';
import { IVenta, IVentaCreate, IVentaDescuento, IVentaProducto } from '../../models/Ventas/Venta.model';
import { ITipoAplicacion, ITipoDescuento, IVentaDescuentosAplicados } from '../../models/Ventas/VentaDescuentosAplicados.model';
import { IDetalleVenta } from '../../models/Ventas/DetalleVenta.model';
import { IProducto } from '../../models/inventario/Producto.model';
import { InventarioSucursalRepository } from '../../repositories/inventary/inventarioSucursal.repository';
import { MovimientoInventario } from '../../models/inventario/MovimientoInventario.model';
import { IInventarioSucursal } from '../../models/inventario/InventarioSucursal.model';
import { notifyWhatsappReorderThreshold } from '../utils/twilioMessageServices';
import { IUser } from '../../models/usuarios/User.model';
import { CustomJwtPayload } from '../../utils/jwt';
import { ISucursal } from '../../models/sucursales/Sucursal.model';

@injectable()
export class VentaService {
  constructor(
    @inject(VentaRepository) private repository: VentaRepository,
    @inject(InventarioSucursalRepository) private inventarioSucursalRepo: InventarioSucursalRepository
  ) {}

  async createVenta(data: Partial<IVentaCreate>, user: CustomJwtPayload): Promise<Partial<IVentaCreate>> {
    const session = await mongoose.startSession();

    try {
      session.startTransaction();

      let sucursalId = new mongoose.Types.ObjectId(data.sucursalId!);
      let usuarioId = new mongoose.Types.ObjectId(data.userId!);

      let listInventarioSucursal:IInventarioSucursal[] = []

      let newVenta = {
        usuarioId: usuarioId,
        sucursalId: sucursalId,
        subtotal: new mongoose.Types.Decimal128(data.subtotal?.toString()!),
        total: new mongoose.Types.Decimal128(data.total?.toString()!),
        descuento: new mongoose.Types.Decimal128(data.discount?.toString()! || "0"),
        deleted_at: null,
        fechaRegistro: new Date(),
      }

      const newSale = await this.repository.create(newVenta, session);

      for await (const element of data.products!) {

        let subtotal = element.price * element.quantity;
        let descuento = element.discount?.amount! || 0;
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

        let newdDetalleVenta = await this.repository.createDetalleVenta(detalleVenta, session);

        let tipoAplicacion:ITipoAplicacion = element.discount?.type === "grupo" ? 'GRUPO' : 'PRODUCTO';
        let tipo:ITipoDescuento = "PORCENTAJE";
        let valor = element.discount?.amount! / element.quantity;
        let descuentosProductosId = element.productId ? new mongoose.Types.ObjectId(element.productId) : undefined;
        let descuentoGrupoId = element.groupId ? new mongoose.Types.ObjectId(element.groupId) : undefined;

        let ventaDescuentosAplicados = {
          detalleVentaId: (newdDetalleVenta._id as mongoose.Types.ObjectId),
          descuentosProductosId: descuentosProductosId,
          descuentoGrupoId: descuentoGrupoId,
          tipoAplicacion: tipoAplicacion,
          valor: new mongoose.Types.Decimal128(valor.toString()!),
          tipo: tipo,
          monto: new mongoose.Types.Decimal128(descuento.toString()!),
        }

        await this.repository.createVentaDescuentosAplicados(ventaDescuentosAplicados, session);

        const inventarioSucursal = await this.inventarioSucursalRepo.findBySucursalIdAndProductId(sucursalId.toString(), productoId.toString());

        inventarioSucursal.stock -= element.quantity;
        inventarioSucursal.ultimo_movimiento = new Date();

        if (inventarioSucursal.stock <= inventarioSucursal.puntoReCompra) {
          listInventarioSucursal.push(inventarioSucursal);
        }

        inventarioSucursal.save({ session });

        let movimientoInventario = new MovimientoInventario({
          inventarioSucursalId: inventarioSucursal._id,
          cantidadCambiada: element.quantity,
          cantidadInicial: inventarioSucursal.stock,
          cantidadFinal: inventarioSucursal.stock - element.quantity,
          tipoMovimiento: 'venta',
          fechaMovimiento: new Date(),
          usuarioId: usuarioId,
        });
    
        await movimientoInventario.save({ session });
      }

      let productListReOrder = listInventarioSucursal
        .filter((item) => item.stock < item.puntoReCompra)
        .map((item) => ({
          name: (item.productoId as IProducto).nombre,
          currentQuantity: item.stock,
          reorderPoint: item.puntoReCompra,
        }));

      notifyWhatsappReorderThreshold(user.username, (listInventarioSucursal[0].sucursalId as ISucursal).nombre, productListReOrder);

      await session.commitTransaction();
      session.endSession();

      return data;
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
      const ventaDto = (await this.mapperData(venta, detalleVenta) as IVentaCreate);
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
      const ventaDto = (await this.mapperData(venta, detalleVenta) as IVentaCreate);
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

    let ventaDto:IVentaCreate = (await this.mapperData(venta, detalleVenta) as IVentaCreate);

    return ventaDto;
  }

 async mapperData(venta: IVenta, detalleVenta: IDetalleVenta[]): Promise<IVentaCreate | null> {
    let products: IVentaProducto[] = [];

    for await (const detalle of detalleVenta) {
      let descuentoAplicado = await this.repository.findVentaDescuentosAplicadosByDetalleVentaId((detalle._id as mongoose.Types.ObjectId).toString());

      let descuento:IVentaDescuento = {
        id: "",
        name: "",
        amount: Number(descuentoAplicado.valor),
        percentage: 100,
        type: "producto",
      }

      let producto = {
        productId: ((detalle.productoId as IProducto)._id as mongoose.Types.ObjectId).toString(),
        clientType: detalle.tipoCliente,
        productName: (detalle.productoId as IProducto).nombre,
        quantity: detalle.cantidad,
        price: Number(detalle.precio),
        ventaId: (venta._id as mongoose.Types.ObjectId).toString(),
        groupId: "",
        discount: descuento
      }
   
      products.push(producto);
    }

    let ventaDto: IVentaCreate = {
      userId: (venta.usuarioId as IUser).username,
      sucursalId: venta.sucursalId.toString(),
      subtotal: Number(venta.subtotal),
      total: Number(venta.total),
      discount: Number(venta.descuento),
      fechaRegistro: venta.fechaRegistro,
      products: products,
    }

    return ventaDto;
  }

  async getAllDetalleVentaByVentaId(ventaId: string): Promise<IDetalleVenta[]> {
    return this.repository.findAllDetalleVentaByVentaId(ventaId);
  }
}

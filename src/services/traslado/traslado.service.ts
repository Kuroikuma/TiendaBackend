import { injectable, inject } from 'tsyringe';
import { ISucursal } from '../../models/sucursales/Sucursal.model';
import { SucursalRepository } from '../../repositories/sucursal/sucursal.repository';
import {
  IBranchProducts,
  IProducto,
} from 'src/models/inventario/Producto.model';
import { ITrasladoEnvio } from 'src/models/traslados/Traslado.model';
import { json } from 'body-parser';
import { IDetalleTrasladoEnvio } from 'src/models/traslados/DetalleTraslado.model';
import { InventoryManagementService } from './InventoryManagement.service';
import mongoose, { ObjectId, Types } from 'mongoose';

@injectable()
export class SucursalService {
  constructor(
    @inject(SucursalRepository) private repository: SucursalRepository,
    @inject(InventoryManagementService)
    private inventoryManagementService: InventoryManagementService
  ) {}

  async postCreateEnvioProducto(model: Partial<ITrasladoEnvio>): Promise<null> {
    let listDetalleTraslado: IDetalleTrasladoEnvio[] = JSON.parse(
      JSON.stringify(model.listDetalleTrasladoStr)
    );
    model.listDetalleTraslado = listDetalleTraslado;

    this.inventoryManagementService.init(
      model.sucursalOrigenId!,
      model.sucursalDestinoId!,
      model.usuarioIdEnvia!
    );

    let listInventarioSucursalIds = model.listDetalleTraslado.map((detalle) =>
      (detalle.inventarioSucursalId as Types.ObjectId).toString()
    );

    this.inventoryManagementService.initManage(
      model.sucursalOrigenId!,
      model.sucursalDestinoId!,
      listInventarioSucursalIds
    );

    const session = await mongoose.startSession();

    try {
      session.startTransaction();

      var traslado = await this.inventoryManagementService.generatePedidoHerramienta();
      var listItemDePedidos =
        await this.inventoryManagementService.generateItemDePedidoByPedido(
          (traslado._id as mongoose.Types.ObjectId).toString(),
          model.listDetalleTraslado,
          model.archivosAdjuntos as string[],
          false,
          session
        );
        
      await this.inventoryManagementService.subtractCantidadByDetalleTraslado(listItemDePedidos);

    } catch (error) {
      console.log(error);

      await session.abortTransaction();
      session.endSession();

      throw new Error('Error al crear producto');
    }

    return null;
  }
}

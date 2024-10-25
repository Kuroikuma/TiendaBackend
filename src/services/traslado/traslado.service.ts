import { injectable, inject } from 'tsyringe';
import { ITraslado, ITrasladoEnvio } from 'src/models/traslados/Traslado.model';
import { IDetalleTrasladoEnvio } from 'src/models/traslados/DetalleTraslado.model';
import { InventoryManagementService } from './InventoryManagement.service';
import mongoose, { Types } from 'mongoose';

@injectable()
export class TrasladoService {
  constructor(
    @inject(InventoryManagementService) private inventoryManagementService: InventoryManagementService
  ) {}

  async postCreateEnvioProducto(model: Partial<ITrasladoEnvio>): Promise<ITraslado> {
    let listDetalleTraslado: IDetalleTrasladoEnvio[] = model.listDetalleTraslado!;
    
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

      var traslado = await this.inventoryManagementService.generatePedidoHerramienta(session);

     
      
      var listItemDePedidos =
        await this.inventoryManagementService.generateItemDePedidoByPedido(
          (traslado._id as mongoose.Types.ObjectId).toString(),
          model.listDetalleTraslado,
          model.archivosAdjuntos as string[],
          false,
          session
        );

      await this.inventoryManagementService.subtractCantidadByDetalleTraslado(listItemDePedidos);

      //  Haciendo el envio del pedido
       
       let sendTrasladoProducto = {
           firmaEnvio: model.firmaEnvio == "undefined" ? "" : model.firmaEnvio!,
           comentarioEnvio : model.comentarioEnvio!,
           trasladoId : (traslado._id as mongoose.Types.ObjectId),
           traslado : traslado,
       };

       await this.inventoryManagementService.sendPedidoHerramienta(sendTrasladoProducto, session);

       await session.commitTransaction();
       session.endSession();

       console.log("llega2");
       

      return traslado;

    } catch (error) {
      console.log(error);

      await session.abortTransaction();
      session.endSession();

      throw new Error('Error al crear producto');
    }
  }
}

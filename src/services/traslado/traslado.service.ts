import { injectable, inject } from 'tsyringe';
import {
  ITraslado,
  ITrasladoEnvio,
  ITrasladoRecepcion,
} from '../../models/traslados/Traslado.model';
import {
  IDetalleTraslado,
  IDetalleTrasladoEnvio,
} from '../../models/traslados/DetalleTraslado.model';
import { InventoryManagementService } from './InventoryManagement.service';
import mongoose, { Types } from 'mongoose';
import { TrasladoRepository } from '../../repositories/traslado/traslado.repository';
import { InventarioSucursalRepository } from '../../repositories/inventary/inventarioSucursal.repository';

@injectable()
export class TrasladoService {
  constructor(
    @inject(InventoryManagementService)
    private inventoryManagementService: InventoryManagementService,
    @inject(TrasladoRepository) private trasladoRepository: TrasladoRepository,
    @inject(InventarioSucursalRepository)
    private inventarioSucursalRepo: InventarioSucursalRepository
  ) {}

  async postCreateEnvioProducto(
    model: Partial<ITrasladoEnvio>
  ): Promise<ITraslado> {
    let listDetalleTraslado: IDetalleTrasladoEnvio[] =
      model.listDetalleTraslado!;

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

      var traslado =
        await this.inventoryManagementService.generatePedidoHerramienta(
          session
        );

      var listItemDePedidos =
        await this.inventoryManagementService.generateItemDePedidoByPedido(
          (traslado._id as mongoose.Types.ObjectId).toString(),
          model.listDetalleTraslado,
          model.archivosAdjuntos as string[],
          false,
          session
        );

      await this.inventoryManagementService.subtractCantidadByDetalleTraslado(
        listItemDePedidos
      );

      //  Haciendo el envio del pedido

      let sendTrasladoProducto = {
        firmaEnvio: model.firmaEnvio == 'undefined' ? '' : model.firmaEnvio!,
        comentarioEnvio: model.comentarioEnvio!,
        trasladoId: traslado._id as mongoose.Types.ObjectId,
        traslado: traslado,
      };

      await this.inventoryManagementService.sendPedidoHerramienta(
        sendTrasladoProducto,
        session
      );

      await session.commitTransaction();
      session.endSession();

      return traslado;
    } catch (error) {
      console.log(error);

      await session.abortTransaction();
      session.endSession();

      throw new Error('Error al enviar el pedido');
    }
  }

  async postRecibirPedido(model: Partial<ITrasladoRecepcion>) {
    const session = await mongoose.startSession();

    try {
      session.startTransaction();

      var pedido = (await this.trasladoRepository.findById(
        model.trasladoId!
      )) as ITraslado;
      var listItemDePedidos =
        await this.trasladoRepository.findAllItemDePedidoByPedido(
          model.trasladoId!
        );
      var trabajadorId = model.usuarioIdRecibe!;

      this.inventoryManagementService.initRecibir(
        (pedido?.sucursalOrigenId as Types.ObjectId).toString(),
        (pedido?.sucursalDestinoId as Types.ObjectId).toString(),
        model.trasladoId!
      );

      // Actualizando el pedido
      pedido.estatusTraslado = 'Terminado';
      pedido.fechaRecepcion = new Date();
      pedido.comentarioRecepcion = model.comentarioRecepcion!;
      pedido.usuarioIdRecibe = new mongoose.Types.ObjectId(trabajadorId);

      if (
        model.listDetalleTraslado?.filter((detalle) => detalle.recibido)
          .length !== listItemDePedidos.length
      ) {
        pedido.estatusTraslado = 'Terminado incompleto';
      }

      pedido.firmaRecepcion = model.firmaRecepcion!;
      for await (const element of model.listDetalleTraslado!) {
        console.log(element.inventarioSucursalId);
        
        let responseAdd = await this.inventoryManagementService.addCantidad(
          element,
          (pedido.sucursalDestinoId as mongoose.Types.ObjectId).toString(),
          element.archivosAdjuntos as string[],
          true,
          session
        );

        var item2 = listItemDePedidos.find(
          (x) =>
            (x.inventarioSucursalId as mongoose.Types.ObjectId).toString() ===
            element.inventarioSucursalId.toString()
        ) as IDetalleTraslado;

        if (item2.cantidad > element.cantidad) {
          pedido.estatusTraslado = 'TerminadoIncompleto';
        }

        await this.trasladoRepository.saveAllDetalleTraslado(
          responseAdd.listDetalleTrasladoAgregados,
          session
        );
        await this.trasladoRepository.updateAllDetalleTraslado(
          responseAdd.listDetalleTrasladoActualizado,
          session
        );
        await this.inventarioSucursalRepo.saveAllInventarioSucursal(
          responseAdd.listInventarioSucursalAgregados,
          session
        );
        await this.inventarioSucursalRepo.updateAllInventarioSucursal(
          responseAdd.listInventarioSucursalActualizado,
          session
        );
        await pedido.save();
      }

      await session.commitTransaction();
      session.endSession();

      return pedido;
    } catch (error) {
      console.log(error);

      await session.abortTransaction();
      session.endSession();

      throw new Error('Error al enviar el pedido');
    }
  }
}

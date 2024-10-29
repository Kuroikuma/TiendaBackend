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
import fileUploadService from '../fileUploadService';
import { IFilesUpload } from '../../gen/files';
import shortid from 'shortid';

@injectable()
export class TrasladoService {
  constructor(
    @inject(InventoryManagementService) private inventoryManagementService: InventoryManagementService,
    @inject(TrasladoRepository) private trasladoRepository: TrasladoRepository,
    @inject(InventarioSucursalRepository) private inventarioSucursalRepo: InventarioSucursalRepository
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

        let dataFiles: IFilesUpload[] = model.archivosAdjuntos?.map((file) => {
          return { base64: file, name: shortid.generate() } as IFilesUpload;
        }) as IFilesUpload[];
    
        const archivosAdjuntos = await fileUploadService.uploadFiles(dataFiles);

      traslado.archivosAdjuntos = archivosAdjuntos;

      var listItemDePedidos =
        await this.inventoryManagementService.generateItemDePedidoByPedido(
          (traslado._id as mongoose.Types.ObjectId).toString(),
          model.listDetalleTraslado,
          false,
          session
        );

      await this.inventoryManagementService.subtractCantidadByDetalleTraslado(
        listItemDePedidos
      );

      //  Haciendo el envio del pedido

      const firmaEnvio = await fileUploadService.uploadFile(model.firmaEnvio!, shortid.generate());

      let sendTrasladoProducto = {
        firmaEnvio: model.firmaEnvio == 'undefined' ? '' : firmaEnvio,
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

      throw new Error(error.message);
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

      let dataFiles: IFilesUpload[] = model.archivosAdjuntosRecibido?.map((file) => {
        return { base64: file, name: shortid.generate() } as IFilesUpload;
      }) as IFilesUpload[];
  
      const archivosAdjuntos = await fileUploadService.uploadFiles(dataFiles);

      pedido.archivosAdjuntosRecibido = archivosAdjuntos;

      if (
        model.listDetalleTraslado?.filter((detalle) => detalle.recibido)
          .length !== listItemDePedidos.length
      ) {
        pedido.estatusTraslado = 'Terminado incompleto';
      }

      const firmaRecepcion = await fileUploadService.uploadFile(model.firmaRecepcion!, shortid.generate());

      pedido.firmaRecepcion = firmaRecepcion;
      for await (const element of model.listDetalleTraslado!) {
        let responseAdd = await this.inventoryManagementService.addCantidad(
          element,
          (pedido.sucursalDestinoId as mongoose.Types.ObjectId).toString(),
          element.archivosAdjuntosRecibido as string[],
          true,
          session
        );

        var item2 = listItemDePedidos.find(
          (x) =>
            (x.inventarioSucursalId as mongoose.Types.ObjectId).toString() ===
            element.inventarioSucursalId.toString()
        ) as IDetalleTraslado;

        if (item2.cantidad > element.cantidad) {
          pedido.estatusTraslado = 'Terminado incompleto';
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
      }

      await pedido.save();

      await session.commitTransaction();
      session.endSession();

      return pedido;
    } catch (error) {
      console.log(error);

      await session.abortTransaction();
      session.endSession();

      throw new Error(error.message);
    }
  }

  async findPedidoEnviadosBySucursal(sucursalId: string) {
    try {
      const listItemDePedidos =
        await this.trasladoRepository.findPedidoEnviadosBySucursal(sucursalId);

      return listItemDePedidos;
    } catch (error) {
      console.error('Error al obtener los pedidos enviados:', error);
      throw new Error('Error al obtener los pedidos enviados');
    }
  }

  async findPedidoRecibidosBySucursal(sucursalId: string) {
    try {
      const listItemDePedidos =
        await this.trasladoRepository.findPedidoRecibidosBySucursal(sucursalId);

      return listItemDePedidos;
    } catch (error) {
      console.error('Error al obtener los pedidos recibidos:', error);
      throw new Error('Error al obtener los pedidos recibidos');
    }
  }

  async findPedidoPorRecibirBySucursal(sucursalId: string) {
    try {
      const listItemDePedidos =
        await this.trasladoRepository.findPedidoPorRecibirBySucursal(
          sucursalId
        );

      return listItemDePedidos;
    } catch (error) {
      console.error('Error al obtener los pedidos por recibir:', error);
      throw new Error('Error al obtener los pedidos por recibir');
    }
  }

  async findPedidoEnProcesoBySucursal(sucursalId: string) {
    try {
      const listItemDePedidos =
        await this.trasladoRepository.findPedidoEnProcesoBySucursal(sucursalId);

      return listItemDePedidos;
    } catch (error) {
      console.error('Error al obtener los pedidos en proceso:', error);
      throw new Error('Error al obtener los pedidos en proceso');
    }
  }

  async findAllItemDePedidoByPedidoDto(pedidoId: string) {
    try {
      const listItemDePedidos =
        await this.trasladoRepository.findAllItemDePedidoByPedidoDto(pedidoId);

      return listItemDePedidos;
    } catch (error) {
      console.error('Error al obtener los item de pedido:', error);
      throw new Error('Error al obtener los item de pedido');
    }
  }

  async findPedidoById(pedidoId: string) {
    try {
      const pedido = await this.trasladoRepository.findById(pedidoId);

      return pedido;
    } catch (error) {
      console.error('Error al obtener el pedido:', error);
      throw new Error('Error al obtener el pedido');
    }
  }
}

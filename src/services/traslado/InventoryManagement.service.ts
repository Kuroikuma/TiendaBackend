import mongoose, { ObjectId } from 'mongoose';
import { IDetalleTraslado, IDetalleTrasladoEnvio } from '../../models/traslados/DetalleTraslado.model';
import { IInventarioSucursal } from 'src/models/inventario/InventarioSucursal.model';
import { InventarioSucursalRepository } from 'src/repositories/inventary/inventarioSucursal.repository';
import { ITraslado, Traslado } from 'src/models/traslados/Traslado.model';
import { SucursalRepository } from 'src/repositories/sucursal/sucursal.repository';
import { TrasladoRepository } from '../../repositories/traslado/traslado.repository';
import { inject, injectable } from 'tsyringe';

interface IManageHerramientaModel {
  init(sucursalEnviaId: string, sucursalRecibeId: string, usuarioIdEnvia:string): void;
  initManage(sucursalEnviaId: string, sucursalRecibeId: string, listInventarioSucursalId: string[]): Promise<void>;
  generatePedidoHerramienta();
  sendPedidoHerramienta(model: ITraslado): Promise<void>;
  subtractCantidadByDetalleTraslado(listItems: IDetalleTraslado[]): Promise<void>;
}

@injectable()
export class InventoryManagementService implements IManageHerramientaModel {
  private sucursalEnviaId: mongoose.Types.ObjectId;
  private sucursalRecibeId: mongoose.Types.ObjectId;
  private usuarioEnviaId: mongoose.Types.ObjectId;
  private usuarioRecibeId: ObjectId
  private _listInventarioSucursal:IInventarioSucursal[]

  constructor(
    @inject(InventarioSucursalRepository) private inventarioSucursalRepo: InventarioSucursalRepository,
    @inject(SucursalRepository) private sucursalRepository: SucursalRepository,
    @inject(TrasladoRepository) private trasladoRepository: TrasladoRepository,
  ) {
  }

  init(sucursalEnviaId: string, sucursalRecibeId: string, usuarioIdEnvia:string): void {
    this.sucursalEnviaId = new mongoose.Types.ObjectId(sucursalEnviaId);
    this.sucursalRecibeId = new mongoose.Types.ObjectId(sucursalRecibeId);
    this.usuarioEnviaId = new mongoose.Types.ObjectId(usuarioIdEnvia);
    // this.usuarioRecibeId = usuarioIdRecibe;
  }

  async initManage(sucursalEnviaId: string, sucursalRecibeId: string, listInventarioSucursalId: string[]): Promise<void> {
    this.sucursalEnviaId = new mongoose.Types.ObjectId(sucursalEnviaId);
    this.sucursalRecibeId = new mongoose.Types.ObjectId(sucursalRecibeId);

    this._listInventarioSucursal = await this.inventarioSucursalRepo.getListProductByInventarioSucursalIds(sucursalEnviaId,listInventarioSucursalId);
  }

  async generatePedidoHerramienta(){
    const ultimoPedido = await this.trasladoRepository.getLastTrasladoBySucursalId(this.sucursalRecibeId.toString())
    const idRegistro = this.usuarioEnviaId; // Aquí debes obtener el id del trabajador desde el contexto o sesión

    const newConsecutivo = ultimoPedido?.consecutivo ? ultimoPedido.consecutivo + 1 : 1;

    const newPedido = new Traslado({
      estatusPedido: 'Solicitado',
      fechaRegistro: new Date(),
      tipoPedido: 0,
      estado: true,
      numeroConsecutivo: newConsecutivo,
      sucursalDestinoId:this.sucursalRecibeId,
      sucursalOrigenId:this.sucursalEnviaId,
    });

    await newPedido.save();
    return newPedido;
  }

  async sendPedidoHerramienta(model: ITraslado): Promise<void> {
    let traslado = model;

    if (!traslado && model._id) {
      traslado = await this.trasladoRepository.findById(model._id.toString()) as ITraslado;
    }

    if (!traslado) throw new Error('Pedido no encontrado');

    traslado.estatusTraslado = 'En Proceso';
    traslado.fechaEnvio = new Date();
    traslado.usuarioIdEnvia = this.usuarioEnviaId as mongoose.Types.ObjectId;

    // Firma
    if (model.firmaEnvio) {
      traslado.firmaEnvio = model.firmaEnvio;
    }

    traslado.comentarioEnvio = model.comentarioEnvio;

    await this.trasladoRepository.update((traslado._id as mongoose.Types.ObjectId).toString(), traslado);
  }

  public async generateItemDePedidoByPedido(
    trasladoId: string,
    listDetalleTraslado: IDetalleTrasladoEnvio[],
    listFiles: string[],
    isNoSave = false,
    session: mongoose.mongo.ClientSession
  ): Promise<IDetalleTraslado[]> {
    const listItems: IDetalleTraslado[] = [];

    for (const producto of listDetalleTraslado) {

      let trasladoIdParsed = new mongoose.Types.ObjectId(trasladoId);

      // Crear el objeto ItemDePedido
      const detalleTraslado: IDetalleTraslado = {
        cantidad: producto.cantidad,
        trasladoId: trasladoIdParsed,
        inventarioSucursalId: producto.inventarioSucursalId,
        archivosAdjuntos: listFiles,
        deleted_at: null,
        comentarioEnvio: producto.comentarioEnvio,
      };

      listItems.push(detalleTraslado);
    }

    // Guardar en la base de datos si `isNoSave` es falso
    if (!isNoSave) {
      await this.trasladoRepository.saveAllDetalleTraslado(listItems, session);
    }

    return listItems;
  }

  async subtractCantidadByDetalleTraslado(listItems: IDetalleTraslado[]): Promise<void> {

    for (const item of listItems) {
      await this.subtractCantidad(item.cantidad, item.inventarioSucursalId as mongoose.Types.ObjectId)
    }
  }

  private async subtractCantidad(cantidad: number, inventarioSucursalId: mongoose.Types.ObjectId): Promise<IInventarioSucursal | null> {
    const inventarioSucursal = await this.inventarioSucursalRepo.findById(inventarioSucursalId.toString()) as IInventarioSucursal

    if (!inventarioSucursal) throw new Error('Herramienta no encontrada en la bodega');
    if (cantidad > inventarioSucursal.stock) throw new Error('Cantidad a sustraer es mayor a la disponible.');

    inventarioSucursal.stock -= cantidad;
    if (inventarioSucursal.stock === 0) inventarioSucursal.deleted_at = new Date();

    inventarioSucursal.ultimo_movimiento = new Date();

    return this.inventarioSucursalRepo.update(inventarioSucursal.id, inventarioSucursal);
  }

  // public async addCantidad(
  //   model: IHerramientaToPedidoRecibir,
  //   bodegaId: string,
  //   listFiles: IFormFile[],
  //   isNoSave = false
  // ): Promise<IResponseToAddCantidad> {
  //   // Inicialización del response
  //   const response: IResponseToAddCantidad = {
  //     listResumenCantidadBodega: [],
  //     listItemDePedidoAgregados: [],
  //     listItemDePedidoActualizado: [],
  //     listBodegaActivoDesgloseAgregados: [],
  //     listActivoDesglose: [],
  //   };

  //   // Validación inicial
  //   const bodegaActivoDesgloseEnvia = await this.bodegaRepository.findById(
  //     model.BodegaActivoDesgloseId
  //   );

  //   if (!bodegaActivoDesgloseEnvia) {
  //     throw new Error('BodegaActivoDesglose no encontrado');
  //   }

  //   const activoDesglose = bodegaActivoDesgloseEnvia.activoDesglose;
  //   const bodegaActivoDesgloseRecibe = await this.bodegaRepository.findRecibeActivoDesglose(
  //     activoDesglose.id
  //   );

  //   const itemDePedido = await this.pedidoRepository.findItemByDesgloseId(
  //     model.BodegaActivoDesgloseId
  //   );

  //   if (!itemDePedido) {
  //     throw new Error('Item de pedido no encontrado');
  //   }

  //   // Actualización de datos
  //   if (model.Recibido) {
  //     response.listResumenCantidadBodega.push(
  //       this.generateResumenCantidadBodega(
  //         model.BodegaActivoDesgloseId,
  //         model.Cantidad
  //       )
  //     );
  //   }

  //   itemDePedido.recibido = model.Recibido;
  //   itemDePedido.comentarioRecibido = model.ComentarioRecibido;

  //   // Procesar archivos asociados
  //   const listFileByItem = this.fileStorageService.filterFilesById(
  //     listFiles,
  //     model.BodegaActivoDesgloseId
  //   );

  //   const stringFiles = await this.fileStorageService.uploadFiles(
  //     listFileByItem,
  //     'ItemDePedido'
  //   );

  //   if (stringFiles) {
  //     itemDePedido.stringFiles += ' --Recepcion-- ' + stringFiles.join('---');
  //   }

  //   // Manejo de cantidades menores
  //   if (itemDePedido.cantidad > model.Cantidad) {
  //     itemDePedido.recibido = false;
  //     itemDePedido.cantidad -= model.Cantidad;
  //     activoDesglose.estadoEquipo = StatusItemEnum.Incompleto;

  //     const herramientaModel = this.createHerramientaToPedido(model);
  //     const newItemsDePedido = await this.pedidoRepository.generateNewPedido(
  //       itemDePedido.pedidoId,
  //       herramientaModel
  //     );

  //     newItemsDePedido.forEach((item) => (item.recibido = true));
  //     response.listItemDePedidoAgregados.push(...newItemsDePedido);
  //   }

  //   // Actualización de cantidades en bodega
  //   if (model.Recibido && activoDesglose.permiteCantidad) {
  //     if (bodegaActivoDesgloseRecibe) {
  //       bodegaActivoDesgloseRecibe.cantidad += model.Cantidad;
  //       bodegaActivoDesgloseRecibe.fechaUltimoMovimiento = new Date();
  //     } else {
  //       const newBodegaActivoDesglose = this.createBodegaActivoDesglose(
  //         model.Cantidad,
  //         activoDesglose.id,
  //         bodegaId
  //       );
  //       response.listBodegaActivoDesgloseAgregados.push(newBodegaActivoDesglose);
  //     }
  //   }

  //   response.listItemDePedidoActualizado.push(itemDePedido);
  //   response.listActivoDesglose.push(activoDesglose);

  //   return response;
  // }
}

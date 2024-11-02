import mongoose, { ObjectId } from 'mongoose';
import {
  IDetalleTraslado,
  IDetalleTrasladoCreate,
  IDetalleTrasladoEnvio,
  IDetalleTrasladoRecepcion,
} from '../../models/traslados/DetalleTraslado.model';
import { InventarioSucursalRepository } from '../../repositories/inventary/inventarioSucursal.repository';
import {
  IResponseToAddCantidad,
  ISendTrasladoProducto,
  ITraslado,
  Traslado,
} from '../../models/traslados/Traslado.model';
import { SucursalRepository } from '../../repositories/sucursal/sucursal.repository';
import { TrasladoRepository } from '../../repositories/traslado/traslado.repository';
import { inject, injectable } from 'tsyringe';
import {
  IInventarioSucursal,
  InventarioSucursal,
} from '../../models/inventario/InventarioSucursal.model';
import fileUploadService from '../utils/fileUploadService';
import { IFilesUpload } from '../../gen/files';
import { MovimientoInventario } from '../../models/inventario/MovimientoInventario.model';
const accountSid = 'AC765fa1004417bf97128e3ca10824aacd';
const authToken = 'f590cfbf94ad7e8c92d2b8538adccfee';
const client = require('twilio')(accountSid, authToken);
const shortid = require('shortid');


interface IManageHerramientaModel {
  init(
    sucursalEnviaId: string,
    sucursalRecibeId: string,
    usuarioIdEnvia: string
  ): void;
  initManage(
    sucursalEnviaId: string,
    sucursalRecibeId: string,
    listInventarioSucursalId: string[]
  ): Promise<void>;
  generatePedidoHerramienta(session: mongoose.mongo.ClientSession);
  sendPedidoHerramienta(
    model: ISendTrasladoProducto,
    session: mongoose.mongo.ClientSession
  ): Promise<void>;
  subtractCantidadByDetalleTraslado(
    listItems: IDetalleTraslado[]
  ): Promise<void>;
}

@injectable()
export class InventoryManagementService implements IManageHerramientaModel {
  private sucursalEnviaId: mongoose.Types.ObjectId;
  private sucursalRecibeId: mongoose.Types.ObjectId;
  private usuarioEnviaId: mongoose.Types.ObjectId;
  private usuarioRecibeId: ObjectId;
  private _listInventarioSucursal: IInventarioSucursal[];
  private _detalleTralado: IDetalleTraslado[];

  constructor(
    @inject(InventarioSucursalRepository)
    private inventarioSucursalRepo: InventarioSucursalRepository,
    @inject(SucursalRepository) private sucursalRepository: SucursalRepository,
    @inject(TrasladoRepository) private trasladoRepository: TrasladoRepository
  ) {}

  init(
    sucursalEnviaId: string,
    sucursalRecibeId: string,
    usuarioIdEnvia: string
  ): void {
    this.sucursalEnviaId = new mongoose.Types.ObjectId(sucursalEnviaId);
    this.sucursalRecibeId = new mongoose.Types.ObjectId(sucursalRecibeId);
    this.usuarioEnviaId = new mongoose.Types.ObjectId(usuarioIdEnvia);
    // this.usuarioRecibeId = usuarioIdRecibe;
  }

  async initRecibir(
    sucursalEnviaId: string,
    sucursalRecibeId: string,
    pedidoId: string
  ): Promise<void> {
    this.sucursalEnviaId = new mongoose.Types.ObjectId(sucursalEnviaId);
    this.sucursalRecibeId = new mongoose.Types.ObjectId(sucursalRecibeId);

    let listItemDePedidos =
      await this.trasladoRepository.findAllItemDePedidoByPedido(pedidoId);

    this._detalleTralado = listItemDePedidos;
  }

  async initManage(
    sucursalEnviaId: string,
    sucursalRecibeId: string,
    listInventarioSucursalId: string[]
  ): Promise<void> {
    this.sucursalEnviaId = new mongoose.Types.ObjectId(sucursalEnviaId);
    this.sucursalRecibeId = new mongoose.Types.ObjectId(sucursalRecibeId);

    this._listInventarioSucursal =
      await this.inventarioSucursalRepo.getListProductByInventarioSucursalIds(
        sucursalEnviaId,
        listInventarioSucursalId
      );
  }

  async generatePedidoHerramienta(session: mongoose.mongo.ClientSession) {
    const ultimoPedido =
      await this.trasladoRepository.getLastTrasladoBySucursalId(
        this.sucursalEnviaId.toString()
      );
    const idRegistro = this.usuarioEnviaId; // Aquí debes obtener el id del trabajador desde el contexto o sesión

    const newConsecutivo = ultimoPedido?.consecutivo
      ? ultimoPedido.consecutivo + 1
      : 1;

    const newPedido = new Traslado({
      estatusTraslado: 'Solicitado',
      fechaRegistro: new Date(),
      tipoPedido: 0,
      estado: true,
      consecutivo: newConsecutivo,
      nombre: `Pedido #${newConsecutivo}`,
      sucursalDestinoId: this.sucursalRecibeId,
      sucursalOrigenId: this.sucursalEnviaId,
    });

    (await newPedido.save({ session })).populate(["sucursalOrigenId", "sucursalDestinoId", "usuarioIdEnvia", "usuarioIdRecibe"]);

    // client.messages
    //   .create({
    //     from: 'whatsapp:+14155238886',
    //     contentSid: 'HX77ae3198ad4f995cb2c7bf1d7bead3a9',
    //     contentVariables:
    //       '{"1":"Junior Hurtado","2":"Audifonos","3":"Juigalpa", "4":"10", "5":"20"}',
    //     to: 'whatsapp:+50558851605',
    //   })
    //   .then((message) => {
    //     console.log(`Mensaje enviado con SID: ${message.sid}`);
    //   })
    //   .catch((error) => {
    //     console.error('Error al enviar el mensaje:', error);
    //   });

    return newPedido;
  }

  async sendPedidoHerramienta(
    model: ISendTrasladoProducto,
    session: mongoose.mongo.ClientSession
  ): Promise<void> {
    let traslado = model.traslado;
    let trasladoId = (traslado._id as mongoose.Types.ObjectId).toString();

    if (!traslado && trasladoId) {
      traslado = (await this.trasladoRepository.findById(
        trasladoId
      )) as ITraslado;
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
    traslado.archivosAdjuntos = model.traslado.archivosAdjuntos;

    await this.trasladoRepository.update(trasladoId, traslado, session);
  }

  public async generateItemDePedidoByPedido(
    trasladoId: string,
    listDetalleTraslado: IDetalleTrasladoEnvio[] | IDetalleTrasladoRecepcion[] | IDetalleTraslado[],
    isNoSave = false,
    session: mongoose.mongo.ClientSession
  ): Promise<IDetalleTrasladoCreate[]> {
    let listItems: IDetalleTrasladoCreate[] = [];

    for (const producto of listDetalleTraslado) {
      let trasladoIdParsed = new mongoose.Types.ObjectId(trasladoId);

      let archivosAdjuntosStr: string[] = (isNoSave ? producto.archivosAdjuntosRecibido : (producto as IDetalleTrasladoEnvio).archivosAdjuntos as string[]) || [];

      let dataFiles: IFilesUpload[] = archivosAdjuntosStr.map((file) => {
        return { base64: file, name: shortid.generate() } as IFilesUpload;
      }) as IFilesUpload[];

      const archivosAdjuntos = await fileUploadService.uploadFiles(dataFiles);

      // Crear el objeto ItemDePedido
      const detalleTraslado: IDetalleTrasladoCreate = {
        cantidad: producto.cantidad,
        trasladoId: trasladoIdParsed,
        inventarioSucursalId: producto.inventarioSucursalId,
        archivosAdjuntos: (isNoSave ? (producto as IDetalleTrasladoEnvio).archivosAdjuntos : archivosAdjuntos as string[]) || [],
        archivosAdjuntosRecibido: (isNoSave ?  archivosAdjuntos : (producto as IDetalleTrasladoRecepcion).archivosAdjuntosRecibido  as string[]) || [],
        deleted_at: null,
        comentarioEnvio: (producto as IDetalleTrasladoEnvio).comentarioEnvio,
        comentarioRecepcion: (producto as IDetalleTrasladoRecepcion).comentarioRecibido || "",
      };

      listItems.push(detalleTraslado);
    }

    // Guardar en la base de datos si `isNoSave` es falso
    if (!isNoSave) {
     let newItems = await this.trasladoRepository.saveAllDetalleTraslado(listItems, session);
     listItems = newItems;
    }

    return listItems;
  }

  async subtractCantidadByDetalleTraslado(
    listItems: IDetalleTrasladoCreate[]
  ): Promise<void> {
    for (const item of listItems) {
      await this.subtractCantidad(
        item.cantidad,
        item.inventarioSucursalId._id as mongoose.Types.ObjectId
      );
    }
  }

  private async subtractCantidad(
    cantidad: number,
    inventarioSucursalId: mongoose.Types.ObjectId
  ): Promise<IInventarioSucursal | null> {
    const inventarioSucursal = (await this.inventarioSucursalRepo.findById(
      inventarioSucursalId.toString()
    )) as IInventarioSucursal;

    if (!inventarioSucursal)
      throw new Error('Herramienta no encontrada en la bodega');

    if (cantidad > inventarioSucursal.stock)
      throw new Error('Cantidad a sustraer es mayor a la disponible.');

    let movimientoInventario = new MovimientoInventario({
      inventarioSucursalId: inventarioSucursal._id,
      cantidadCambiada: cantidad,
      cantidadInicial: inventarioSucursal.stock,
      cantidadFinal: inventarioSucursal.stock - cantidad,
      tipoMovimiento: 'transferencia',
      fechaMovimiento: new Date(),
      usuarioId: this.usuarioEnviaId,
    });

    await movimientoInventario.save();

    inventarioSucursal.stock -= cantidad;
    
    if (inventarioSucursal.stock === 0)
      inventarioSucursal.deleted_at = new Date();

    inventarioSucursal.ultimo_movimiento = new Date();

    return this.inventarioSucursalRepo.update(
      inventarioSucursal.id,
      inventarioSucursal
    );
  }

  public async addCantidad(
    model: IDetalleTrasladoRecepcion,
    bodegaId: string,
    listFiles: string[],
    isNoSave = false,
    session: mongoose.mongo.ClientSession,
    usuarioIdRecibe: string
  ): Promise<IResponseToAddCantidad> {
    // Inicialización del response
    const response: IResponseToAddCantidad = {
      listHistorialInventario: [],
      listDetalleTrasladoAgregados: [],
      listDetalleTrasladoActualizado: [],
      listInventarioSucursalAgregados: [],
      listInventarioSucursalActualizado: [],
    };

    // Validación inicial
    const inventarioSucursalEnvia = await this.inventarioSucursalRepo.findById(
      model.inventarioSucursalId.toString()
    );
    const inventarioSucursalRecibe =
      await this.inventarioSucursalRepo.findBySucursalIdAndProductId(
        bodegaId,
        inventarioSucursalEnvia?.productoId.toString() as string
      );

    if (!inventarioSucursalEnvia) {
      throw new Error(
        'No se encontro en el inventario de la sucursal el producto.'
      );
    }

    const itemDePedido = this._detalleTralado.find(
      (a) =>
        (a.inventarioSucursalId as mongoose.Types.ObjectId).toString() ===
        model.inventarioSucursalId.toString()
    ) as IDetalleTraslado;

    if (!itemDePedido) {
      throw new Error('Item de pedido no encontrado');
    }

    itemDePedido.recibido = model.recibido;
    itemDePedido.comentarioRecepcion = model.comentarioRecibido;
    itemDePedido.estadoProducto = model.estadoProducto;

    if (itemDePedido.archivosAdjuntos === null) {
      itemDePedido.archivosAdjuntos = [];
    }

    //manejo de cantidad 0
    if (model.cantidad == 0) {
      itemDePedido.recibido = false;
    }

    // Manejo de cantidades menores
    if ((itemDePedido.cantidad > model.cantidad) && model.cantidad > 0) {
      itemDePedido.recibido = false;
      itemDePedido.cantidad -= model.cantidad;

      const herramientaModel: IDetalleTrasladoEnvio = {
        cantidad: model.cantidad,
        inventarioSucursalId: itemDePedido.inventarioSucursalId,
        archivosAdjuntosRecibido: listFiles,
        precio: model.precio,
        comentarioRecibido: model.comentarioRecibido,
      };

      let list: IDetalleTrasladoEnvio[] = [];
      list.push(herramientaModel);

      let newItemsDePedido = await this.generateItemDePedidoByPedido(
        (itemDePedido.trasladoId as mongoose.Types.ObjectId).toString(),
        list,
        true,
        session
      );

      itemDePedido.archivosAdjuntosRecibido = newItemsDePedido[0].archivosAdjuntosRecibido as string[];

      newItemsDePedido.forEach((item) => (item.recibido = true));
      newItemsDePedido.forEach((item) => (item.estadoProducto = "En Buen Estado"));
      response.listDetalleTrasladoAgregados.push(...newItemsDePedido);
    } else {

      let dataFiles: IFilesUpload[] = listFiles.map((file) => {
        return { base64: file, name: shortid.generate() } as IFilesUpload;
      }) as IFilesUpload[];

      const archivosAdjuntos = await fileUploadService.uploadFiles(dataFiles);

      if (listFiles.length > 0) {
        itemDePedido.archivosAdjuntosRecibido = archivosAdjuntos;
      }
    }

    // Actualización de cantidades en bodega
    if (model.recibido && model.cantidad > 0) {
      if (inventarioSucursalRecibe) {

        let movimientoInventario = new MovimientoInventario({
          inventarioSucursalId: inventarioSucursalRecibe._id,
          cantidadCambiada: model.cantidad,
          cantidadInicial: inventarioSucursalRecibe.stock,
          cantidadFinal: inventarioSucursalRecibe.stock + model.cantidad,
          tipoMovimiento: 'transferencia',
          fechaMovimiento: new Date(),
          usuarioId: usuarioIdRecibe,
        });
    
        await movimientoInventario.save();

        inventarioSucursalRecibe.stock += model.cantidad;
        inventarioSucursalRecibe.ultimo_movimiento = new Date();

        response.listInventarioSucursalActualizado.push(
          inventarioSucursalRecibe
        );
      } else if (model.cantidad > 0) {
        const inventarioSucursalRecibe = new InventarioSucursal({
          stock: model.cantidad,
          sucursalId: new mongoose.Types.ObjectId(bodegaId),
          productoId: inventarioSucursalEnvia.productoId,
          ultimo_movimiento: new Date(),
          deleted_at: null,
          precio: model.precio,
          puntoReCompra: model.puntoReCompra,
        });

        response.listInventarioSucursalAgregados.push(inventarioSucursalRecibe);
      }
    }

    response.listDetalleTrasladoActualizado.push(itemDePedido);

    return response;
  }
}

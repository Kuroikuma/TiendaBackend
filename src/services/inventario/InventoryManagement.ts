// import { Request, Response } from 'express';
// import mongoose, { Document, Model, ObjectId } from 'mongoose';
// import { BlobStorageService } from './services/BlobStorageService'; // Servicio de almacenamiento
// import { BodegaRepository } from './repositories/BodegaRepository'; // Repositorio de bodegas
// import { HerramientaRepository } from './repositories/HerramientaRepository'; // Repositorio de herramientas
// import { PedidoRepository } from './repositories/PedidoRepository'; // Repositorio de pedidos
// import { TrabajadorRepository } from './repositories/TrabajadorRepository'; // Repositorio de trabajadores
// import { DetalleTraslado, IDetalleTraslado } from '../../models/traslados/DetalleTraslado.model';
// import { IInventarioSucursal } from 'src/models/inventario/InventarioSucursal.model';
// import { InventarioSucursalRepository } from 'src/repositories/inventary/inventarioSucursal.repository';
// import { ITraslado, Traslado } from 'src/models/traslados/Traslado.model';
// import { SucursalRepository } from 'src/repositories/sucursal/sucursal.repository';
// import { TrasladoRepository } from '../traslado/traslado.repository';

// interface IManageHerramientaModel {
//   init(sucursalEnviaId: string, sucursalRecibeId: string): void;
//   initManage(sucursalEnviaId: string, sucursalRecibeId: string, listInventarioSucursalId: string[]): Promise<void>;
//   generatePedidoHerramienta();
//   sendPedidoHerramienta(model: SendPedidoHerramienta): Promise<void>;
//   subtractCantidadByDetalleTraslado(listItems: IDetalleTraslado[]): Promise<void>;
// }

// export class InventoryManagement implements IManageHerramientaModel {
//   private sucursalEnviaId: mongoose.Types.ObjectId;
//   private sucursalRecibeId: mongoose.Types.ObjectId;

//   private bodegaRepo: BodegaRepository;
//   private herramientaRepo: HerramientaRepository;
//   private pedidoRepo: PedidoRepository;
//   private trabajadorRepo: TrabajadorRepository;
//   private blobStorageService: BlobStorageService;
//   private inventarioSucursalRepo: InventarioSucursalRepository;
//   private sucursalRepository: SucursalRepository;
//   private trasladoRepository: TrasladoRepository;

//   constructor(
//     bodegaRepo: BodegaRepository,
//     herramientaRepo: HerramientaRepository,
//     pedidoRepo: PedidoRepository,
//     trabajadorRepo: TrabajadorRepository,
//     blobStorageService: BlobStorageService,
//     inventarioSucursalRepo: InventarioSucursalRepository,
//     sucursalRepository: SucursalRepository,
//     trasladoRepository: TrasladoRepository
//   ) {
//     this.bodegaRepo = bodegaRepo;
//     this.herramientaRepo = herramientaRepo;
//     this.pedidoRepo = pedidoRepo;
//     this.trabajadorRepo = trabajadorRepo;
//     this.blobStorageService = blobStorageService;
//     this.inventarioSucursalRepo = inventarioSucursalRepo;
//     this.sucursalRepository = sucursalRepository;
//     this.trasladoRepository = trasladoRepository;
//   }

//   init(bodegaIdEnvia: string, bodegaIdRecibe: string): void {
//     this.sucursalEnviaId = new mongoose.Types.ObjectId(bodegaIdEnvia);
//     this.sucursalRecibeId = new mongoose.Types.ObjectId(bodegaIdRecibe);
//   }

//   async initManage(bodegaIdEnvia: string, bodegaIdRecibe: string, listInventarioSucursalId: string[]): Promise<void> {
//     this.sucursalEnviaId = new mongoose.Types.ObjectId(bodegaIdEnvia);
//     this.sucursalRecibeId = new mongoose.Types.ObjectId(bodegaIdRecibe);

//     const listBodegaEnviaActivoDesglose = await this.herramientaRepo.getHerramientasByBodegaIdAndDesgloseIds(
//       this.sucursalEnviaId,
//       listInventarioSucursalId
//     );

//     const listBodegaRecibeActivoDesglose = await this.herramientaRepo.getHerramientasByBodegaId(this.sucursalRecibeId);
//   }

//   async generatePedidoHerramienta(){
//     const ultimoPedido = await this.pedidoRepo.getLastPedidoByBodegaId(this.sucursalRecibeId);
//     const bodegaEnvia = await this.sucursalRepository.findById(this.sucursalEnviaId.toString());
//     const bodegaRecibe = await this.sucursalRepository.findById(this.sucursalRecibeId.toString());
//     const idRegistro = 'someTrabajadorId'; // Aquí debes obtener el id del trabajador desde el contexto o sesión

//     const newConsecutivo = ultimoPedido?.numeroConsecutivo ? ultimoPedido.numeroConsecutivo + 1 : 1;

//     const newPedido = new Traslado({
//       estatusPedido: 'Solicitado',
//       fechaRegistro: new Date(),
//       tipoPedido: 0,
//       estado: true,
//       numeroConsecutivo: newConsecutivo,
//       sucursalDestinoId:this.sucursalRecibeId,
//       sucursalOrigenId:this.sucursalEnviaId,
//     });

//     await newPedido.save();
//     return newPedido;
//   }

//   async sendPedidoHerramienta(model: ITraslado): Promise<void> {
//     let traslado = model;

//     if (!traslado && model._id) {
//       traslado = await this.trasladoRepository.findById(model._id.toString()) as ITraslado;
//     }

//     if (!traslado) throw new Error('Pedido no encontrado');

//     const trabajadorId = 'someTrabajadorId'; // Obtener desde sesión o contexto
//     traslado.estatusTraslado = 'En Proceso';
//     traslado.fechaEnvio = new Date();

//     // Firma
//     if (model.firmaEnvio) {
//       traslado.firmaEnvio = model.firmaEnvio;
//     }

//     traslado.comentarioEnvio = model.comentarioEnvio;

//     await traslado.save();
//   }

//   public async generateItemDePedidoByPedido(
//     trasladoId: string,
//     listDetalleTraslado: IDetalleTraslado[],
//     listFiles: string[],
//     isNoSave = false
//   ): Promise<IDetalleTraslado[]> {
//     const listItems: IDetalleTraslado[] = [];

//     for (const herramienta of listDetalleTraslado) {

//       let trasladoIdParsed = new mongoose.Types.ObjectId(trasladoId);

//       // Crear el objeto ItemDePedido
//       const detallePedido: IDetalleTraslado = {
//         cantidad: herramienta.cantidad,
//         estado: true,
//         trasladoId: trasladoIdParsed,
//         inventarioSucursalId: herramienta.inventarioSucursalId,
//         archivosAdjuntos: listFiles,
//         productoId: herramienta.productoId,
//         deleted_at: null,
//         comentarioRecepcion: herramienta.comentarioRecepcion,
//         comentarioEnvio: herramienta.comentarioEnvio,
//         regresado: herramienta.regresado,
//         recibido: herramienta.recibido,
//       };

//       listItems.push(detallePedido);
//     }

//     // Guardar en la base de datos si `isNoSave` es falso
//     if (!isNoSave) {
//       await this.pedidoRepository.addItems(listItems);
//     }

//     return listItems;
//   }

//   async subtractCantidadByDetalleTraslado(listItems: IDetalleTraslado[]): Promise<void> {
//     const updatedItems:IInventarioSucursal[] = [];

//     for (const item of listItems) {
//       const updatedBodegaActivoDesglose = await this.subtractCantidad(item.cantidad, item.inventarioSucursalId as mongoose.Types.ObjectId);
//       updatedItems.push(updatedBodegaActivoDesglose);
//     }

//     await this.bodegaRepo.updateMany(updatedItems);
//   }

//   private async subtractCantidad(cantidad: number, inventarioSucursalId: mongoose.Types.ObjectId): Promise<IInventarioSucursal> {
//     const bodegaActivoDesglose = await this.inventarioSucursalRepo.findById(inventarioSucursalId.toString()) as IInventarioSucursal

//     if (!bodegaActivoDesglose) throw new Error('Herramienta no encontrada en la bodega');
//     if (cantidad > bodegaActivoDesglose.stock) throw new Error('Cantidad a sustraer es mayor a la disponible.');

//     bodegaActivoDesglose.stock -= cantidad;
//     if (bodegaActivoDesglose.stock === 0) bodegaActivoDesglose.deleted_at = new Date();

//     bodegaActivoDesglose.ultimo_movimiento = new Date();

//     await bodegaActivoDesglose.save();
//     return bodegaActivoDesglose;
//   }

//   public async addCantidad(
//     model: IHerramientaToPedidoRecibir,
//     bodegaId: string,
//     listFiles: IFormFile[],
//     isNoSave = false
//   ): Promise<IResponseToAddCantidad> {
//     // Inicialización del response
//     const response: IResponseToAddCantidad = {
//       listResumenCantidadBodega: [],
//       listItemDePedidoAgregados: [],
//       listItemDePedidoActualizado: [],
//       listBodegaActivoDesgloseAgregados: [],
//       listActivoDesglose: [],
//     };

//     // Validación inicial
//     const bodegaActivoDesgloseEnvia = await this.bodegaRepository.findById(
//       model.BodegaActivoDesgloseId
//     );

//     if (!bodegaActivoDesgloseEnvia) {
//       throw new Error('BodegaActivoDesglose no encontrado');
//     }

//     const activoDesglose = bodegaActivoDesgloseEnvia.activoDesglose;
//     const bodegaActivoDesgloseRecibe = await this.bodegaRepository.findRecibeActivoDesglose(
//       activoDesglose.id
//     );

//     const itemDePedido = await this.pedidoRepository.findItemByDesgloseId(
//       model.BodegaActivoDesgloseId
//     );

//     if (!itemDePedido) {
//       throw new Error('Item de pedido no encontrado');
//     }

//     // Actualización de datos
//     if (model.Recibido) {
//       response.listResumenCantidadBodega.push(
//         this.generateResumenCantidadBodega(
//           model.BodegaActivoDesgloseId,
//           model.Cantidad
//         )
//       );
//     }

//     itemDePedido.recibido = model.Recibido;
//     itemDePedido.comentarioRecibido = model.ComentarioRecibido;

//     // Procesar archivos asociados
//     const listFileByItem = this.fileStorageService.filterFilesById(
//       listFiles,
//       model.BodegaActivoDesgloseId
//     );

//     const stringFiles = await this.fileStorageService.uploadFiles(
//       listFileByItem,
//       'ItemDePedido'
//     );

//     if (stringFiles) {
//       itemDePedido.stringFiles += ' --Recepcion-- ' + stringFiles.join('---');
//     }

//     // Manejo de cantidades menores
//     if (itemDePedido.cantidad > model.Cantidad) {
//       itemDePedido.recibido = false;
//       itemDePedido.cantidad -= model.Cantidad;
//       activoDesglose.estadoEquipo = StatusItemEnum.Incompleto;

//       const herramientaModel = this.createHerramientaToPedido(model);
//       const newItemsDePedido = await this.pedidoRepository.generateNewPedido(
//         itemDePedido.pedidoId,
//         herramientaModel
//       );

//       newItemsDePedido.forEach((item) => (item.recibido = true));
//       response.listItemDePedidoAgregados.push(...newItemsDePedido);
//     }

//     // Actualización de cantidades en bodega
//     if (model.Recibido && activoDesglose.permiteCantidad) {
//       if (bodegaActivoDesgloseRecibe) {
//         bodegaActivoDesgloseRecibe.cantidad += model.Cantidad;
//         bodegaActivoDesgloseRecibe.fechaUltimoMovimiento = new Date();
//       } else {
//         const newBodegaActivoDesglose = this.createBodegaActivoDesglose(
//           model.Cantidad,
//           activoDesglose.id,
//           bodegaId
//         );
//         response.listBodegaActivoDesgloseAgregados.push(newBodegaActivoDesglose);
//       }
//     }

//     response.listItemDePedidoActualizado.push(itemDePedido);
//     response.listActivoDesglose.push(activoDesglose);

//     return response;
//   }
// }

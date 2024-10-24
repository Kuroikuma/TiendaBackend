// import { Request, Response } from 'express';
// import mongoose, { Document, Model } from 'mongoose';
// import { BlobStorageService } from './services/BlobStorageService'; // Servicio de almacenamiento
// import { BodegaRepository } from './repositories/BodegaRepository'; // Repositorio de bodegas
// import { HerramientaRepository } from './repositories/HerramientaRepository'; // Repositorio de herramientas
// import { PedidoRepository } from './repositories/PedidoRepository'; // Repositorio de pedidos
// import { TrabajadorRepository } from './repositories/TrabajadorRepository'; // Repositorio de trabajadores
// import { DetalleTraslado, IDetalleTraslado } from '../../models/traslados/DetalleTraslado.model';
// import { IInventarioSucursal } from 'src/models/inventario/InventarioSucursal.model';
// import { InventarioSucursalRepository } from 'src/repositories/inventary/inventarioSucursal.repository';

// interface IManageHerramientaModel {
//   init(sucursalEnviaId: string, sucursalRecibeId: string): void;
//   initManage(sucursalEnviaId: string, sucursalRecibeId: string, listBodegaActivoDesgloseId: string[]): Promise<void>;
//   generatePedidoHerramienta(): Promise<PedidoDocument>;
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

//   constructor(
//     bodegaRepo: BodegaRepository,
//     herramientaRepo: HerramientaRepository,
//     pedidoRepo: PedidoRepository,
//     trabajadorRepo: TrabajadorRepository,
//     blobStorageService: BlobStorageService,
//     inventarioSucursalRepo: InventarioSucursalRepository
//   ) {
//     this.bodegaRepo = bodegaRepo;
//     this.herramientaRepo = herramientaRepo;
//     this.pedidoRepo = pedidoRepo;
//     this.trabajadorRepo = trabajadorRepo;
//     this.blobStorageService = blobStorageService;
//     this.inventarioSucursalRepo = inventarioSucursalRepo;
//   }

//   init(bodegaIdEnvia: string, bodegaIdRecibe: string): void {
//     this.sucursalEnviaId = new mongoose.Types.ObjectId(bodegaIdEnvia);
//     this.sucursalRecibeId = new mongoose.Types.ObjectId(bodegaIdRecibe);
//   }

//   async initManage(bodegaIdEnvia: string, bodegaIdRecibe: string, listBodegaActivoDesgloseId: string[]): Promise<void> {
//     this.sucursalEnviaId = new mongoose.Types.ObjectId(bodegaIdEnvia);
//     this.sucursalRecibeId = new mongoose.Types.ObjectId(bodegaIdRecibe);

//     const listBodegaEnviaActivoDesglose = await this.herramientaRepo.getHerramientasByBodegaIdAndDesgloseIds(
//       this.sucursalEnviaId,
//       listBodegaActivoDesgloseId
//     );

//     const listBodegaRecibeActivoDesglose = await this.herramientaRepo.getHerramientasByBodegaId(this.sucursalRecibeId);
//   }

//   async generatePedidoHerramienta(): Promise<PedidoDocument> {
//     const ultimoPedido = await this.pedidoRepo.getLastPedidoByBodegaId(this.sucursalRecibeId);
//     const bodegaEnvia = await this.bodegaRepo.getBodegaById(this.sucursalEnviaId);
//     const bodegaRecibe = await this.bodegaRepo.getBodegaById(this.sucursalRecibeId);
//     const idRegistro = 'someTrabajadorId'; // Aquí debes obtener el id del trabajador desde el contexto o sesión

//     const newConsecutivo = ultimoPedido?.numeroConsecutivo ? ultimoPedido.numeroConsecutivo + 1 : 1;

//     const newPedido = new PedidoModel({
//       estatusPedido: 'Solicitado',
//       fechaRegistro: new Date(),
//       tipoPedido: 0,
//       idRegistro: idRegistro,
//       estado: true,
//       numeroConsecutivo: newConsecutivo
//     });

//     newPedido.mapperBodegas(bodegaEnvia, bodegaRecibe);

//     await newPedido.save();
//     return newPedido;
//   }

//   async sendPedidoHerramienta(model: SendPedidoHerramienta): Promise<void> {
//     let pedido = model.pedido;

//     if (!pedido && model.pedidoId) {
//       pedido = await this.pedidoRepo.getPedidoById(model.pedidoId);
//     }

//     if (!pedido) throw new Error('Pedido no encontrado');

//     const trabajadorId = 'someTrabajadorId'; // Obtener desde sesión o contexto
//     pedido.estatusPedido = 'En Proceso';
//     pedido.fechaEnvio = new Date();
//     pedido.idEnvia = trabajadorId;

//     // Firma
//     if (model.firmaEnvio) {
//       const empresa = await this.trabajadorRepo.getEmpresaByTrabajadorId(trabajadorId);
//       const contenedor = `${empresa.codigoERP}Empresa`;
//       pedido.firmaEnvio = await this.blobStorageService.uploadFileByBase64(model.firmaEnvio, contenedor);
//     }

//     pedido.nombreTransportista = model.transportistaExternoNombre;

//     if (model.transportistaInternoId) {
//       const trabajador = await this.trabajadorRepo.getTrabajadorById(model.transportistaInternoId);
//       pedido.transportistaInternoId = trabajador._id;
//       pedido.nombreTransportista = trabajador.nombreCompleto;
//     }

//     pedido.comentarioEnvio = model.comentarioEnvio;

//     await pedido.save();
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
// }

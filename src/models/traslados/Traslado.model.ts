import mongoose, { Schema, Document, ObjectId } from 'mongoose';
import { ISucursal } from '../sucursales/Sucursal.model';
import { IUser } from '../usuarios/User.model';
import { IDetalleTraslado, IDetalleTrasladoCreate, IDetalleTrasladoEnvio, IDetalleTrasladoRecepcion } from './DetalleTraslado.model';
import { IHistorialInventario } from '../inventario/HistorialInventario.model';
import { IInventarioSucursal } from '../inventario/InventarioSucursal.model';

type IEstatusPedido = 'Solicitado' | 'En Proceso' | 'Terminado' | 'Terminado incompleto';

export interface ITraslado extends Document {
  nombre: string;
  fechaRegistro: Date;
  fechaEnvio: Date;
  fechaRecepcion: Date | null;
  sucursalOrigenId: mongoose.Types.ObjectId | ISucursal;
  sucursalDestinoId: mongoose.Types.ObjectId | ISucursal;
  usuarioIdEnvia: mongoose.Types.ObjectId | IUser;
  usuarioIdRecibe: mongoose.Types.ObjectId | IUser | null;
  estado: string;
  comentarioEnvio: string;
  consecutivo?: number;
  comentarioRecepcion: string | null;
  estatusTraslado?: IEstatusPedido;
  archivosAdjuntos: string[] | null;
  firmaEnvio: string;
  firmaRecepcion: string;
  deleted_at: Date | null;
}

export interface ITrasladoEnvio {
  sucursalOrigenId: string;
  sucursalDestinoId: string;
  listDetalleTraslado: IDetalleTrasladoEnvio[];
  archivosAdjuntos: string[] | null;
  firmaEnvio: string;
  comentarioEnvio: string;
  usuarioIdEnvia: string;
}

export interface ITrasladoRecepcion {
  trasladoId: string;
  estatusTraslado?: IEstatusPedido;
  listDetalleTraslado: IDetalleTrasladoRecepcion[];
  archivosAdjuntos: string[];

  // Datos para enviar el pedido
  firmaRecepcion: string;
  comentarioRecepcion: string;
  usuarioIdRecibe: string;
}

// const trasladoRecepcion: ITrasladoRecepcion = {
//   trasladoId: "671c6cce94fd39f7e59b5304",
//   listDetalleTraslado: [
//     {
//       inventarioSucursalId: "671c723694fd39f7e59b5312",
//       cantidad: 4,
//       archivosAdjuntos: ["foto1.jpg", "foto2.jpg"],
//       comentarioRecibido: "Comentario Recibido",
//       recibido: true,
//       estadoEquipo: "Bien",
//     },
//     {
//       inventarioSucursalId: "671c723694fd39f7e59b5313",
//       cantidad: 2,
//       archivosAdjuntos: ["foto1.jpg", "foto2.jpg"],
//       comentarioRecibido: "Comentario Recibido",
//       recibido: true,
//       estadoEquipo: "Bien",
//     },
//     {
//       inventarioSucursalId: "671c723694fd39f7e59b5314",
//       cantidad: 0,
//       archivosAdjuntos: ["foto1.jpg", "foto2.jpg"],
//       comentarioRecibido: "Comentario Recibido",
//       recibido: false,
//       estadoEquipo: "Bien",
//     },
//   ],
//   archivosAdjuntos: ["foto1.jpg", "foto2.jpg"],
//   firmaRecepcion: "firmaRecepcion",
//   comentarioRecepcion: "Comentario Recepcion",
//   usuarioIdRecibe: "67062bd1437ff3ebf183194c",
// };

export interface ISendTrasladoProducto {
  firmaEnvio: string;
  comentarioEnvio: string;
  trasladoId: mongoose.Types.ObjectId;
  traslado: ITraslado;
}

export interface IResponseToAddCantidad{
  listHistorialInventario: IHistorialInventario[];
  listDetalleTrasladoAgregados: IDetalleTrasladoCreate[];
  listDetalleTrasladoActualizado: IDetalleTraslado[];
  listInventarioSucursalAgregados: IInventarioSucursal[];
  listInventarioSucursalActualizado: IInventarioSucursal[];
}


const trasladoSchema: Schema = new Schema(
  {
    nombre: { type: String },
    fechaRegistro: { type: Date, required: true },
    fechaEnvio: { type: Date },
    fechaRecepcion: { type: Date, default: null },
    sucursalOrigenId: {
      type: Schema.Types.ObjectId,
      ref: 'Sucursal',
      required: true,
    },
    sucursalDestinoId: {
      type: Schema.Types.ObjectId,
      ref: 'Sucursal',
      required: true,
    },
    usuarioIdEnvia: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    usuarioIdRecibe: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    estado: { type: String, required: true },
    comentarioEnvio: { type: String, default: '' },
    consecutivo: { type: Number },
    comentarioRecepcion: { type: String, default: null },
    estatusTraslado: { type: String },
    archivosAdjuntos: { type: Array<string>, default: null },
    firmaEnvio: { type: String, default: '' },
    firmaRecepcion: { type: String, default: '' },
    deleted_at: { type: Date, default: null },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'update_at' },
  }
);

export const Traslado = mongoose.model<ITraslado>('Traslado', trasladoSchema);

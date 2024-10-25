import mongoose, { Schema, Document, ObjectId } from 'mongoose';
import { ISucursal } from '../sucursales/Sucursal.model';
import { IUser } from '../usuarios/User.model';
import { IDetalleTrasladoEnvio } from './DetalleTraslado.model';

export interface ITraslado extends Document {
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
  estatusTraslado?: string;
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

export interface ISendTrasladoProducto {
  firmaEnvio: string;
  comentarioEnvio: string;
  trasladoId: mongoose.Types.ObjectId;
  traslado: ITraslado;
}


const trasladoSchema: Schema = new Schema(
  {
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

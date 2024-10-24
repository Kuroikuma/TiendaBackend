import mongoose, { Schema, Document } from 'mongoose';
import { ISucursal } from '../sucursales/Sucursal.model';
import { IUser } from '../usuarios/User.model';

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
  consecutivo: number;
  comentarioRecepcion: string | null;
  estatusTraslado: string;
  archivosAdjuntos: string[] | null;
  deleted_at: Date | null;
}

const trasladoSchema: Schema = new Schema(
  {
    fechaRegistro: { type: Date, required: true },
    fechaEnvio: { type: Date, required: true },
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
      required: true,
    },
    usuarioIdRecibe: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    estado: { type: String, required: true },
    comentarioEnvio: { type: String, default: '' },
    consecutivo: { type: Number, required: true },
    comentarioRecepcion: { type: String, default: null },
    estatusTraslado: { type: String, required: true },
    archivosAdjuntos: { type: Array<string>, default: null },
    deleted_at: { type: Date, default: null },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'update_at' },
  }
);

export const Traslado = mongoose.model<ITraslado>('Traslado', trasladoSchema);

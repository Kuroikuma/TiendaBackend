import mongoose, { Schema, Document } from 'mongoose';
import { IProducto } from './Producto.model';
import { ISucursal } from '../sucursales/Sucursal.model';
import { IUser } from '../usuarios/User.model';

export interface IHistorialInventario extends Document {
  productoId: mongoose.Types.ObjectId | IProducto;
  sucursalId: mongoose.Types.ObjectId | ISucursal;
  cantidadCambiada: number;
  tipoMovimiento: 'entrada' | 'salida' | 'ajuste';
  fechaMovimiento: Date;
  usuarioId: mongoose.Types.ObjectId | IUser;
  deleted_at: Date | null;
}

const historialInventarioSchema: Schema = new Schema(
  {
    productoId: {
      type: Schema.Types.ObjectId,
      ref: 'Producto',
      required: true,
    },
    sucursalId: {
      type: Schema.Types.ObjectId,
      ref: 'Sucursal',
      required: true,
    },
    cantidadCambiada: { type: Number, required: true },
    tipoMovimiento: {
      type: String,
      enum: ['entrada', 'salida', 'ajuste'],
      required: true,
    },
    fechaMovimiento: { type: Date, required: true },
    usuarioId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    deleted_at: { type: Date, default: null },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'update_at' },
  }
);

export const HistorialInventario = mongoose.model<IHistorialInventario>(
  'HistorialInventario',
  historialInventarioSchema
);

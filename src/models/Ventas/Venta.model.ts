import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from '../usuarios/User.model';
import { ISucursal } from '../sucursales/Sucursal.model';

export interface IVenta extends Document {
  usuarioId: mongoose.Types.ObjectId | IUser;
  sucursalId: mongoose.Types.ObjectId | ISucursal;
  tipoCliente: 'Regular' | 'Proveedor';
  subtotal: mongoose.Types.Decimal128;
  total: mongoose.Types.Decimal128;
  descuento: mongoose.Types.Decimal128;
  deleted_at: Date | null;
}

const ventaSchema: Schema = new Schema(
  {
    usuarioId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    sucursalId: {
      type: Schema.Types.ObjectId,
      ref: 'Sucursal',
      required: true,
    },
    tipoCliente: {
      type: String,
      enum: ['Regular', 'Proveedor'],
      required: true,
    },
    subtotal: { type: Schema.Types.Decimal128, required: true },
    total: { type: Schema.Types.Decimal128, required: true },
    descuento: { type: Schema.Types.Decimal128, default: 0 },
    deleted_at: { type: Date, default: null },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'update_at' },
  }
);

export const Venta = mongoose.model<IVenta>('Venta', ventaSchema);
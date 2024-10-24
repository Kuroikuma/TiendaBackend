import mongoose, { Schema, Document } from 'mongoose';
import { IMoneda } from '../moneda/Moneda.model';

export interface IProducto extends Document {
  nombre: string;
  descripcion: string;
  precio: mongoose.Types.Decimal128;
  monedaId: mongoose.Types.ObjectId | IMoneda;
  deleted_at: Date | null;
}

export interface IBranchProducts {
  nombre: string;
  descripcion: string;
  precio: mongoose.Types.Decimal128;
  monedaId: mongoose.Types.ObjectId | IMoneda;
  deleted_at: Date | null;
  stock: number;
  id: mongoose.Types.ObjectId;
  sucursalId: mongoose.Types.ObjectId;
}

export interface IProductCreate {
  nombre: string;
  descripcion: string;
  precio: mongoose.Types.Decimal128;
  monedaId: mongoose.Types.ObjectId | IMoneda;
  deleted_at: Date | null;
  sucursalId: mongoose.Types.ObjectId;
  grupoId: mongoose.Types.ObjectId;
  stock: number;
}

const productoSchema: Schema = new Schema(
  {
    nombre: { type: String, required: true },
    descripcion: { type: String },
    precio: { type: Schema.Types.Decimal128, required: true },
    monedaId: { type: Schema.Types.ObjectId, ref: 'Moneda', required: true },
    deleted_at: { type: Date, default: null },
  },
  { timestamps: true }
);

export const Producto = mongoose.model<IProducto>('Producto', productoSchema);

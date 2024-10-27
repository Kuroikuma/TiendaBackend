import mongoose, { Schema, Document } from 'mongoose';
import { IMoneda } from '../moneda/Moneda.model';

export interface IProducto extends Document {
  nombre: string;
  descripcion: string;
  monedaId: mongoose.Types.ObjectId | IMoneda;
  deleted_at: Date | null;
  create_at?: Date;
  update_at?: Date;
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
  inventarioSucursalId: mongoose.Types.ObjectId;
  create_at: Date;
  update_at: Date;
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
  create_at: Date;
  update_at: Date;
}

const productoSchema: Schema = new Schema(
  {
    nombre: { type: String, required: true },
    descripcion: { type: String },
    monedaId: { type: Schema.Types.ObjectId, ref: 'Moneda', required: true },
    deleted_at: { type: Date, default: null },
  },
  { timestamps: true }
);

export const Producto = mongoose.model<IProducto>('Producto', productoSchema);

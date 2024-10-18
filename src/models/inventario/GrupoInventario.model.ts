import mongoose, { Schema, Document } from 'mongoose';
import { IProducto } from './Producto.model';

export interface IGrupoInventario extends Document {
  nombre: string;
  descripcion: string;
  deleted_at: Date | null;
}

const grupoInventarioSchema: Schema = new Schema(
  {
    nombre: { type: String, required: true },
    descripcion: { type: String },
    deleted_at: { type: Date, default: null },
  },
  { timestamps: true }
);

export const GrupoInventario = mongoose.model<IGrupoInventario>(
  'GrupoInventario',
  grupoInventarioSchema
);

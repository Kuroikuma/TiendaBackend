import mongoose, { Schema, Document } from 'mongoose';
import { IProducto, Producto } from './Producto.model';
import { GrupoInventario, IGrupoInventario } from './GrupoInventario.model';

export interface IProductosGrupos extends Document {
  productoId: mongoose.Types.ObjectId | IProducto;
  grupoId: mongoose.Types.ObjectId | IGrupoInventario;
  deleted_at: Date | null;
}

const productosGruposSchema: Schema = new Schema(
  {
    productoId: {
      type: Schema.Types.ObjectId,
      ref: 'Producto',
      required: true,
    },
    grupoId: {
      type: Schema.Types.ObjectId,
      ref: 'GrupoInventario',
      required: true,
    },
    deleted_at: { type: Date, default: null },
  },
  { timestamps: true }
);

export const ProductosGrupos = mongoose.model<IProductosGrupos>(
  'ProductosGrupos',
  productosGruposSchema
);

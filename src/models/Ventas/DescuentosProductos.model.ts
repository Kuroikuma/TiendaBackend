import mongoose, { Schema, Document } from 'mongoose';
import { IDescuento } from './Descuento.model';
import { IProducto } from '../inventario/Producto.model';

export interface IDescuentosProductos extends Document {
  descuentoId: mongoose.Types.ObjectId | IDescuento;
  productoId: mongoose.Types.ObjectId | IProducto;
  deleted_at: Date | null;
}

const descuentosProductosSchema: Schema = new Schema({
  descuentoId: { type: Schema.Types.ObjectId, ref: 'Descuento', required: true },
  productoId: { type: Schema.Types.ObjectId, ref: 'Producto', required: true },
  deleted_at: { type: Date, default: null },
}, { timestamps: true });

export const DescuentosProductos = mongoose.model<IDescuentosProductos>('DescuentosProductos', descuentosProductosSchema);

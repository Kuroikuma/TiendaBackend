import mongoose, { Schema, Document } from 'mongoose';
import { IProducto } from '../inventario/Producto.model';
import { IInventarioSucursal } from '../inventario/InventarioSucursal.model';
import { ITraslado } from './Traslado.model';

export interface IDetalleTraslado extends Document {
  inventarioSucursalId: mongoose.Types.ObjectId | IInventarioSucursal;
  trasladoId: mongoose.Types.ObjectId | ITraslado;
  productoId: mongoose.Types.ObjectId | IProducto;
  cantidad: number;
  recibido: boolean;
  regresado: boolean;
  estado: boolean;
  archivosAdjuntos: boolean;
  deleted_at: Date | null;
}

const detalleTrasladoSchema: Schema = new Schema({
  inventarioSucursalId: { type: Schema.Types.ObjectId, ref: 'InventarioSucursal', required: true },
  trasladoId: { type: Schema.Types.ObjectId, ref: 'Traslado', required: true },
  productoId: { type: Schema.Types.ObjectId, ref: 'Producto', required: true },
  cantidad: { type: Number, required: true },
  recibido: { type: Boolean, required: true },
  regresado: { type: Boolean, required: true },
  estado: { type: Boolean, required: true },
  archivosAdjuntos: { type: Boolean, default: false },
  deleted_at: { type: Date, default: null },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'update_at' }
});

export const DetalleTraslado = mongoose.model<IDetalleTraslado>('DetalleTraslado', detalleTrasladoSchema);

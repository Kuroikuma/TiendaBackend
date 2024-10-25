import mongoose, { Schema, Document } from 'mongoose';
import { IProducto } from '../inventario/Producto.model';
import { IInventarioSucursal } from '../inventario/InventarioSucursal.model';
import { ITraslado } from './Traslado.model';

export interface IDetalleTraslado {
  inventarioSucursalId: mongoose.Types.ObjectId | IInventarioSucursal;
  trasladoId: mongoose.Types.ObjectId | ITraslado;
  cantidad: number;
  recibido?: boolean;
  regresado?: boolean;
  estado?: boolean;
  archivosAdjuntos: string[];
  deleted_at: Date | null;
  comentarioRecepcion?:string;
  comentarioEnvio:string;
}

export interface IDetalleTrasladoEnvio {
  inventarioSucursalId: mongoose.Types.ObjectId | IInventarioSucursal;
  cantidad: number;
  comentarioEnvio:string;
  archivosAdjuntos: string[];
}

const detalleTrasladoSchema: Schema = new Schema(
  {
    inventarioSucursalId: {
      type: Schema.Types.ObjectId,
      ref: 'InventarioSucursal',
      required: true,
    },
    trasladoId: {
      type: Schema.Types.ObjectId,
      ref: 'Traslado',
      required: true,
    },
    cantidad: { type: Number, required: true },
    recibido: { type: Boolean, required: true },
    regresado: { type: Boolean, required: true },
    estado: { type: Boolean, required: true },
    archivosAdjuntos: { type: Array<string>, default: false },
    deleted_at: { type: Date, default: null },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'update_at' },
  }
);

export const DetalleTraslado = mongoose.model<IDetalleTraslado>(
  'DetalleTraslado',
  detalleTrasladoSchema
);

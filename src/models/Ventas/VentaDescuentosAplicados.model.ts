import mongoose, { Schema, Document } from "mongoose";

export type ITipoAplicacion = 'PRODUCTO' | 'GRUPO';
export type ITipoDescuento = 'PORCENTAJE' | 'FIJO';

export interface IVentaDescuentosAplicados extends Document {
  ventaId: mongoose.Types.ObjectId;
  descuentosProductosId?: mongoose.Types.ObjectId | null;
  descuentoGrupoId?: mongoose.Types.ObjectId | null;
  tipoAplicacion: ITipoAplicacion;
  valor: mongoose.Types.Decimal128;
  tipo: ITipoDescuento;
  monto: mongoose.Types.Decimal128;
}

const ventaDescuentosAplicadosSchema = new Schema<IVentaDescuentosAplicados>({
  ventaId: {
    type: Schema.Types.ObjectId,
    ref: 'Venta',
    required: true
  },
  descuentosProductosId: {
    type: Schema.Types.ObjectId,
    ref: 'DescuentosProductos',
    default: null
  },
  descuentoGrupoId: {
    type: Schema.Types.ObjectId,
    ref: 'DescuentoGrupo',
    default: null
  },
  tipoAplicacion: {
    type: String,
    enum: ['PRODUCTO', 'GRUPO'],
    required: true
  },
  valor: {
    type: mongoose.Types.Decimal128,
    required: true
  },
  tipo: {
    type: String,
    enum: ['PORCENTAJE', 'FIJO'],
    required: true
  },
  monto: {
    type: mongoose.Types.Decimal128,
    required: true
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updatedAt' } // Corregido a `updatedAt`
});

export const VentaDescuentosAplicados = mongoose.model<IVentaDescuentosAplicados>(
  'VentaDescuentosAplicados',
  ventaDescuentosAplicadosSchema
);

import mongoose, { Schema, Document } from 'mongoose';
import { IMoneda } from '../moneda/Moneda.model';

export interface IDescuento extends Document {
  nombre: string;
  tipoDescuento: 'porcentaje' | 'valor';
  valorDescuento: number;
  fechaInicio: Date;
  fechaFin: Date;
  minimoCompra: number;
  minimoCantidad: number;
  activo: boolean;
  moneda_id: mongoose.Types.ObjectId | IMoneda;
  deleted_at: Date | null;
}

const descuentoSchema: Schema = new Schema(
  {
    nombre: { type: String, required: true },
    tipoDescuento: {
      type: String,
      enum: ['porcentaje', 'valor'],
      required: true,
    },
    valorDescuento: { type: Number, required: true },
    fechaInicio: { type: Date, required: true },
    fechaFin: { type: Date, required: true },
    minimoCompra: { type: Schema.Types.Decimal128 || null, required: true },
    minimoCantidad: { type: Number, required: true },
    activo: { type: Boolean, default: true },
    moneda_id: { type: Schema.Types.ObjectId, ref: 'Moneda', required: true },
    deleted_at: { type: Date, default: null },
  },
  { timestamps: true }
);

export const Descuento = mongoose.model<IDescuento>(
  'Descuento',
  descuentoSchema
);
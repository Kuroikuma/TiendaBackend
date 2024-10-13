import mongoose, { Schema, Document } from 'mongoose';
import { IDescuento } from './Descuento.model';
import { IGrupoInventario } from '../inventario/GrupoInventario.model';

export interface IDescuentoGrupo extends Document {
  descuentoId: mongoose.Types.ObjectId | IDescuento;
  grupoId: mongoose.Types.ObjectId | IGrupoInventario;
  deleted_at: Date | null;
}

const descuentoGrupoSchema: Schema = new Schema({
  descuentoId: { type: Schema.Types.ObjectId, ref: 'Descuento', required: true },
  grupoId: { type: Schema.Types.ObjectId, ref: 'GrupoInventario', required: true },
  deleted_at: { type: Date, default: null },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'update_at' }
});

export const DescuentoGrupo = mongoose.model<IDescuentoGrupo>('DescuentoGrupo', descuentoGrupoSchema);

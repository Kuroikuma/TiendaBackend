import mongoose from "mongoose";
const { Schema } = mongoose;

export interface IVentaDescuentosAplicados {
  ventaId: mongoose.Types.ObjectId;
  descuentoProductoId: mongoose.Types.ObjectId;
  descuentoCategoriaId: mongoose.Types.ObjectId;
  tipoAplicacion: string;
  valor: mongoose.Types.Decimal128;
  tipo: string;
  monto: mongoose.Types.Decimal128;
}

const ventaDescuentosAplicadosSchema = new Schema({
  ventaId: {
    type: Schema.Types.ObjectId,
    ref: 'ventas', // Nombre de la colección de ventas
    required: true
  },
  descuentoProductoId: {
    type: Schema.Types.ObjectId,
    ref: 'descuentoProducto', // Nombre de la colección de descuentos a nivel de producto
    default: null
  },
  descuentoCategoriaId: {
    type: Schema.Types.ObjectId,
    ref: 'descuentoCategoria', // Nombre de la colección de descuentos a nivel de categoría
    default: null
  },
  tipoAplicacion: {
    type: String,
    enum: ['PRODUCTO', 'CATEGORIA'],
    required: true
  },
  valor: {
    type: mongoose.Types.Decimal128, // Para soportar decimales
    required: true
  },
  tipo: {
    type: String,
    enum: ['PORCENTAJE', 'FIJO'],
    required: true
  },
  monto: {
    type: mongoose.Types.Decimal128, // Para el monto calculado del descuento
    required: true
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'update_at' },
});

module.exports = mongoose.model('ventaDescuentosAplicados', ventaDescuentosAplicadosSchema);

import { injectable } from 'tsyringe';
import { Descuento, IDescuento, IDescuentoCreate} from '../../models/Ventas/Descuento.model';
import { DescuentoGrupo, IDescuentoGrupo } from '../../models/Ventas/DescuentoGrupo.model';
import { DescuentosProductos, IDescuentosProductos } from '../../models/Ventas/DescuentosProductos.model';
import mongoose from 'mongoose';

@injectable()
export class DescuentoRepository {
  private model: typeof Descuento;
  private modelDescuentoProducto: typeof DescuentosProductos;
  private modelDescuentoGrupo: typeof DescuentoGrupo;

  constructor() {
    this.model = Descuento;
    this.modelDescuentoProducto = DescuentosProductos;
    this.modelDescuentoGrupo = DescuentoGrupo;
  }

  async create(data: Partial<IDescuentoCreate>, session: mongoose.mongo.ClientSession): Promise<IDescuento> {
    const descuento = new this.model(data);
    return await descuento.save({ session });
  }

  async createDescuentoProducto(data: Partial<IDescuentosProductos>, session: mongoose.mongo.ClientSession): Promise<void> {
    const descuento = new this.modelDescuentoProducto(data);
    await descuento.save({ session });
  }
  async createDescuentoGrupo(data: Partial<IDescuentoGrupo>, session: mongoose.mongo.ClientSession): Promise<void> {
    const descuento = new this.modelDescuentoGrupo(data);
    await descuento.save({ session });
  }

  async findById(id: string): Promise<IDescuento | null> {
    const descuento = await this.model.findById(id);

    if (!descuento) {
      return null;
    }

    return descuento;
  }

  async findAll(
    filters: any = {},
    limit: number = 10,
    skip: number = 0
  ): Promise<IDescuento[]> {
    const query = this.model.find({ ...filters, deleted_at: null });

    return await query.limit(limit).skip(skip).exec();
  }

  async findByName(
    name: string,
  ): Promise<IDescuento | null> {
    const descuento = await this.model.findOne({ nombre: name });

    return descuento;
  }

  async update(
    id: string,
    data: Partial<IDescuento>
  ): Promise<IDescuento | null> {
    return await this.model.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async delete(id: string): Promise<IDescuento | null> {
    return await this.model
      .findByIdAndUpdate(id, { deleted_at: new Date() }, { new: true })
      .exec();
  }

  async restore(id: string): Promise<IDescuento | null> {
    return await this.model
      .findByIdAndUpdate(id, { deleted_at: null }, { new: true })
      .exec();
  }
}

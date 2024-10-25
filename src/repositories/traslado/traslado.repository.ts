import { injectable } from 'tsyringe';
import { ITraslado, Traslado } from 'src/models/traslados/Traslado.model';
import { mongo } from 'mongoose';
import { IDetalleTraslado } from 'src/models/traslados/DetalleTraslado.model';

@injectable()
export class TrasladoRepository {
  private model: typeof Traslado;

  constructor() {
    this.model = Traslado;
  }

  async create(data: Partial<ITraslado>): Promise<ITraslado> {
    const Traslado = new this.model(data);
    return await Traslado.save();
  }

  async findById(id: string): Promise<ITraslado | null> {
    const Traslado = await this.model.findById(id);

    if (!Traslado) {
      return null;
    }

    return Traslado;
  }

  async findAll(
    filters: any = {},
    limit: number = 10,
    skip: number = 0
  ): Promise<ITraslado[]> {
    const query = this.model.find({ ...filters, deleted_at: null });

    return await query.limit(limit).skip(skip).exec();
  }

  async findByName(
    name: string,
  ): Promise<ITraslado | null> {
    const Traslado = await this.model.findOne({ nombre: name });

    return Traslado;
  }

  async update(
    id: string,
    data: Partial<ITraslado>
  ): Promise<ITraslado | null> {
    return await this.model.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async delete(id: string): Promise<ITraslado | null> {
    return await this.model
      .findByIdAndUpdate(id, { deleted_at: new Date() }, { new: true })
      .exec();
  }

  async restore(id: string): Promise<ITraslado | null> {
    return await this.model
      .findByIdAndUpdate(id, { deleted_at: null }, { new: true })
      .exec();
  }
  async saveAllDetalleTraslado(data: IDetalleTraslado[], session:mongo.ClientSession): Promise<void> {
    await this.model.insertMany(data, { session });
  }

  async getLastTrasladoBySucursalId(sucursalId: string) {
    try {
        const ultimoTraslado = await this.model
            .findOne({ sucursalId }) 
            .sort({ fechaRegistro: -1 })
       // Ejecuta la 

        return ultimoTraslado; 
    } catch (error) {
        console.error('Error al obtener el último traslado:', error);
        throw new Error('Error al obtener el último traslado');
    }
}
}

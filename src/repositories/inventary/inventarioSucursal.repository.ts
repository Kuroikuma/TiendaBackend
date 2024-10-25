import { injectable } from 'tsyringe';
import { IInventarioSucursal, InventarioSucursal } from '../../models/inventario/InventarioSucursal.model';
import { Types } from 'mongoose';

@injectable()
export class InventarioSucursalRepository {
  private model: typeof InventarioSucursal;

  constructor() {
    this.model = InventarioSucursal;
  }

  async create(data: Partial<IInventarioSucursal>): Promise<IInventarioSucursal> {
    const grupo = new this.model(data);
    return await grupo.save();
  }

  async findById(id: string): Promise<IInventarioSucursal | null> {
    const grupo = await this.model.findById(id);

    if (!grupo) {
      return null;
    }

    return grupo;
  }

  async findAll(
    filters: any = {},
    limit: number = 10,
    skip: number = 0
  ): Promise<IInventarioSucursal[]> {
    const query = this.model.find({ ...filters, deleted_at: null });

    return await query.limit(limit).skip(skip).exec();
  }

  async findByName(
    name: string,
  ): Promise<IInventarioSucursal | null> {
    const grupo = await this.model.findOne({ nombre: name });

    return grupo;
  }

  async update(
    id: string,
    data: Partial<IInventarioSucursal>
  ): Promise<IInventarioSucursal | null> {
    return await this.model.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async delete(id: string): Promise<IInventarioSucursal | null> {
    return await this.model
      .findByIdAndUpdate(id, { deleted_at: new Date() }, { new: true })
      .exec();
  }

  async restore(id: string): Promise<IInventarioSucursal | null> {
    return await this.model
      .findByIdAndUpdate(id, { deleted_at: null }, { new: true })
      .exec();
  }
  
  async getListProductByInventarioSucursalIds(
    sucursalId: string,
    listInventarioSucursalId: string[]
  ) {
    // Convertir los strings a ObjectId si es necesario
    const sucursalObjectId = new Types.ObjectId(sucursalId);
    const idsToFind = listInventarioSucursalId.map(id => new Types.ObjectId(id));

    // Hacer la consulta usando Mongoose
    const listInventarioSucursal = await this.model.find({
      bodegaId: sucursalObjectId,
      estado: true, // Filtrar por estado de BodegaActivoDesglose
      activoDesglose: { $exists: true }, // Verificar que el activoDesglose exista
      _id: { $in: idsToFind }, // Usar $in para buscar los IDs
    })
      .populate({
        path: 'productoId',
        match: { delete_at: null }, // Filtrar por el estado de ActivoDesglose
      })
      .exec();

    // Filtrar cualquier resultado donde no se haya hecho el populate exitosamente
    return listInventarioSucursal.filter(bodega => bodega.productoId);
  }
}

import { injectable } from 'tsyringe';
import { ProductosGrupos } from '../../models/inventario/ProductosGrupo.model';
import { IProducto, Producto } from '../../models/inventario/Producto.model';
import {
  GrupoInventario,
  IGrupoInventario,
  IGrupoInventarioWithPopulate,
} from '../../models/inventario/GrupoInventario.model';
import { IInventarioSucursal, InventarioSucursal } from 'src/models/inventario/InventarioSucursal.model';

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
}

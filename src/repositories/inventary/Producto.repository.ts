import { injectable } from 'tsyringe';
import { IProducto, Producto } from '../../models/inventario/Producto.model';
import { Sucursal } from '../../models/sucursales/Sucursal.model';
import { InventarioSucursal } from '../../models/inventario/InventarioSucursal.model';


@injectable()
export class GrupoInventarioRepository {

  private model: typeof Producto;
  private modelSucursal: typeof Sucursal;
  private modelInventarioSucursal: typeof InventarioSucursal;

  constructor() {
    this.model = Producto;
    this.modelSucursal = Sucursal;
    this.modelInventarioSucursal = InventarioSucursal;
  }

  async create(data: Partial<IProducto>): Promise<IProducto> {
    const product = new this.model(data);
    return await product.save();
  }

  async findById(id: string): Promise<IProducto | null> {
    const product = await this.model.findById(id);

    if (!product) {
      return null;
    }

    return product;
  }
  
  async findAll(filters: any = {}, limit: number = 10, skip: number = 0): Promise<IProducto[]> {
    const query = this.model.find(filters);

    return await query.limit(limit).skip(skip).exec();
  }

  async update(id: string, data: Partial<IProducto>): Promise<IProducto | null> {
    return await this.model.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async delete(id: string): Promise<IProducto | null> {
    return await this.model.findByIdAndUpdate(id, { deleted_at: new Date() }, { new: true }).exec();
  }

  async restore(id: string): Promise<IProducto | null> {
    return await this.model.findByIdAndUpdate(id, { deleted_at: null }, { new: true }).exec();
  }
}

import { injectable } from 'tsyringe';
import {
  IBranchProducts,
  IProducto,
  Producto,
} from '../../models/inventario/Producto.model';
import { Sucursal, ISucursal } from '../../models/sucursales/Sucursal.model';
import { InventarioSucursal } from '../../models/inventario/InventarioSucursal.model';

@injectable()
export class SucursalRepository {
  private model: typeof Producto;
  private modelSucursal: typeof Sucursal;
  private modelInventarioSucursal: typeof InventarioSucursal;

  constructor() {
    this.model = Producto;
    this.modelSucursal = Sucursal;
    this.modelInventarioSucursal = InventarioSucursal;
  }

  async create(data: Partial<ISucursal>): Promise<ISucursal> {
    const sucursal = new this.modelSucursal(data);
    return await sucursal.save();
  }

  async findById(id: string): Promise<ISucursal | null> {
    const sucursal = await this.modelSucursal.findById(id);

    if (!sucursal) {
      return null;
    }

    return sucursal;
  }

  async findAll(
    filters: any = {},
    limit: number = 10,
    skip: number = 0
  ): Promise<ISucursal[]> {
    const query = this.modelSucursal.find({ ...filters, deleted_at: null });

    return await query.limit(limit).skip(skip).exec();
  }

  async findBranchProducts(id: string): Promise<IBranchProducts[]> {
    const sucursal = await this.modelSucursal.findById(id);

    if (!sucursal) {
      return [];
    }

    const products = await this.modelInventarioSucursal
      .find({ sucursalId: id, deleted_at: null })
      .populate('productoId');

    let newProducts: IBranchProducts[] = [];

    products.forEach((product) => {
      if (product.deleted_at === null) {
        let producto = product.productoId as IProducto;
        newProducts.push({
          stock: product.stock,
          nombre: producto.nombre,
          descripcion: producto.descripcion,
          precio: producto.precio,
          monedaId: producto.monedaId,
          deleted_at: producto.deleted_at,
        });
      }
    });

    return newProducts;
  }

  async findByName(name: string): Promise<ISucursal | null> {
    const query = this.modelSucursal.findOne({ nombre: name });

    return await query.exec();
  }

  async update(
    id: string,
    data: Partial<ISucursal>
  ): Promise<ISucursal | null> {
    return await this.modelSucursal
      .findByIdAndUpdate(id, data, { new: true })
      .exec();
  }

  async delete(id: string): Promise<ISucursal | null> {
    return await this.modelSucursal
      .findByIdAndUpdate(id, { deleted_at: new Date() }, { new: true })
      .exec();
  }

  async restore(id: string): Promise<ISucursal | null> {
    return await this.modelSucursal
      .findByIdAndUpdate(id, { deleted_at: null }, { new: true })
      .exec();
  }
}

import { injectable, inject } from 'tsyringe';
import {
  IProducto,
  IProductCreate,
} from '../../models/inventario/Producto.model';
import { ProductoRepository } from '../../repositories/inventary/Producto.repository';

@injectable()
export class ProductoService {
  constructor(
    @inject(ProductoRepository) private repository: ProductoRepository
  ) {}

  async createProduct(
    data: Partial<IProductCreate>
  ): Promise<IProducto | null> {
    const newBranch = await this.repository.create(data);

    return newBranch;
  }

  async getProductById(id: string): Promise<IProducto | null> {
    const user = await this.repository.findById(id);
    if (!user) {
      throw new Error('Product not found');
    }
    return user;
  }

  async getAllProduct(
    filters: any,
    limit: number,
    skip: number
  ): Promise<IProducto[]> {
    return this.repository.findAll(
      { ...filters, deleted_at: null },
      limit,
      skip
    );
  }

  async updateProduct(
    id: string,
    data: Partial<IProducto>
  ): Promise<IProducto | null> {
    const branch = await this.repository.update(id, data);
    if (!branch) {
      throw new Error('Product not found');
    }
    return branch;
  }

  async deleteProduct(id: string): Promise<IProducto | null> {
    const branch = await this.repository.delete(id);
    if (!branch) {
      throw new Error('Product not found');
    }
    return branch;
  }

  async restoreProduct(id: string): Promise<IProducto | null> {
    return this.repository.restore(id);
  }
}

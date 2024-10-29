import { injectable, inject } from 'tsyringe';
import {
  IProducto,
  IProductCreate,
  IBranchProductsAll,
  IProductShortage,
} from '../../models/inventario/Producto.model';
import { ProductoRepository } from '../../repositories/inventary/Producto.repository';
import { TrasladoRepository } from '../../repositories/traslado/traslado.repository';
import mongoose from 'mongoose';
import { IDetalleTraslado } from '../../models/traslados/DetalleTraslado.model';
import { InventarioSucursalRepository } from '../../repositories/inventary/inventarioSucursal.repository';
import { IInventarioSucursal } from '../../models/inventario/InventarioSucursal.model';

@injectable()
export class ProductoService {
  constructor(
    @inject(ProductoRepository) private repository: ProductoRepository,
    @inject(TrasladoRepository) private trasladoRepository: TrasladoRepository,
    @inject(InventarioSucursalRepository) private inventarioSucursalRepository: InventarioSucursalRepository
  ) {}

  async createProduct(
    data: Partial<IProductCreate>
  ): Promise<IProductCreate | null> {
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

  async findProductInTransitBySucursal(sucursaleId: string): Promise<IInventarioSucursal> {
    const pedidosEnTransito = await this.trasladoRepository.findPedidoEnProcesoBySucursal(sucursaleId);

    let itemsDePedido:IDetalleTraslado[] = [];
    let listInventarioSucursalId:string[] = [];

    for await (const element of pedidosEnTransito) {

      let itemDePedido = await this.trasladoRepository.findAllItemDePedidoByPedido((element._id as mongoose.Types.ObjectId).toString());

      itemsDePedido.push(...itemDePedido);
    }

    for await (const element of itemsDePedido) {
      listInventarioSucursalId.push(element.inventarioSucursalId.toString());
    }

    let productos = await this.inventarioSucursalRepository.getListProductByInventarioSucursalIds(sucursaleId, listInventarioSucursalId);

    //@ts-ignore
    return productos
  }

  async findAllProducts(): Promise<IBranchProductsAll[]> {
    return this.repository.findAllProducts();
  }
}

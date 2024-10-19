import { injectable } from 'tsyringe';
import {
  IProductCreate,
  IProducto,
  Producto,
} from '../../models/inventario/Producto.model';
import { Sucursal } from '../../models/sucursales/Sucursal.model';
import { InventarioSucursal } from '../../models/inventario/InventarioSucursal.model';
import mongoose from 'mongoose';
import { ProductosGrupos } from 'src/models/inventario/ProductosGrupo.model';

@injectable()
export class ProductoRepository {
  private model: typeof Producto;
  private modelSucursal: typeof Sucursal;
  private modelInventarioSucursal: typeof InventarioSucursal;
  private modelProductoGrupo: typeof ProductosGrupos;

  constructor() {
    this.model = Producto;
    this.modelSucursal = Sucursal;
    this.modelInventarioSucursal = InventarioSucursal;
    this.modelProductoGrupo = ProductosGrupos;
  }

  async create(data: Partial<IProductCreate>): Promise<IProducto | null> {
    const session = await mongoose.startSession();

    try {
      session.startTransaction();

      let isProductAvailableAtBranch = await this.findProductByNameInSucursal(data.nombre!, data.sucursalId!.toString());

      if (isProductAvailableAtBranch) {
        throw new Error('Producto ya existente en la sucursal');
      }

      const product = new this.model(data);
      const sucursal = await this.modelSucursal.findById(data.sucursalId);
      const grupo = await this.modelSucursal.findById(data.grupoId);

      if (!sucursal) {
        throw new Error('Sucursal no encontrada');
      }

      if (!grupo) {
        throw new Error('Grupo no encontrado');
      }

      let productSave = await product.save({session});

      let inventarioSucursal = new this.modelInventarioSucursal({
        productoId: productSave._id,
        sucursalId: sucursal._id,
        stock: data.stock,
        ultimo_movimiento: new Date(),
      });

      let productoGrupo = new this.modelProductoGrupo({
        productoId: productSave._id,
        grupoId: grupo._id,
      });

      await inventarioSucursal.save({session});

      await productoGrupo.save({session});

      await session.commitTransaction();
      session.endSession();

      return productSave;

    } catch (error) {
      console.log(error);

      await session.abortTransaction();
      session.endSession();

      throw new Error('Error al crear producto');
    }
  }

  async findById(id: string): Promise<IProducto | null> {
    const product = await this.model.findById(id);

    if (!product) {
      return null;
    }

    return product;
  }

  async findAll(
    filters: any = {},
    limit: number = 10,
    skip: number = 0
  ): Promise<IProducto[]> {
    const query = this.model.find({...filters, deleted_at: null});

    return await query.limit(limit).skip(skip).exec();
  }

  async findProductByNameInSucursal(name: string, sucursalId: string): Promise<IProducto | null> {	
    const product = await this.model.findOne({ nombre: name });

    if (!product) return null; 

    const query = await this.modelInventarioSucursal.findOne({ productoId: product._id, sucursalId: sucursalId });

    return query ? product : null;
  }

  async update(
    id: string,
    data: Partial<IProducto>
  ): Promise<IProducto | null> {
    return await this.model.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async delete(id: string): Promise<IProducto | null> {
    return await this.model
      .findByIdAndUpdate(id, { deleted_at: new Date() }, { new: true })
      .exec();
  }

  async restore(id: string): Promise<IProducto | null> {
    return await this.model
      .findByIdAndUpdate(id, { deleted_at: null }, { new: true })
      .exec();
  }
}

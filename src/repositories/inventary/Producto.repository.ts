import { injectable } from 'tsyringe';
import {
  IBranchProductsAll,
  IProductCreate,
  IProducto,
  Producto,
} from '../../models/inventario/Producto.model';
import { ISucursal, Sucursal } from '../../models/sucursales/Sucursal.model';
import { InventarioSucursal } from '../../models/inventario/InventarioSucursal.model';
import mongoose from 'mongoose';
import { IProductosGrupos, ProductosGrupos } from '../../models/inventario/ProductosGrupo.model';
import { GrupoInventario } from '../../models/inventario/GrupoInventario.model';
import { ObjectId } from 'mongoose';

@injectable()
export class ProductoRepository {
  private model: typeof Producto;
  private modelSucursal: typeof Sucursal;
  private modelInventarioSucursal: typeof InventarioSucursal;
  private modelProductoGrupo: typeof ProductosGrupos;
  private modelGrupoInventario: typeof GrupoInventario;

  constructor() {
    this.model = Producto;
    this.modelSucursal = Sucursal;
    this.modelInventarioSucursal = InventarioSucursal;
    this.modelProductoGrupo = ProductosGrupos;
    this.modelGrupoInventario = GrupoInventario;
  }

  async create(data: Partial<IProductCreate>): Promise<IProductCreate | null> {
    const session = await mongoose.startSession();

    try {
      session.startTransaction();

      let isProductAvailableAtBranch = await this.findProductByNameInSucursal(
        data.nombre!,
        data.sucursalId!.toString()
      );

      // se debe que si el producto esta eliminaddo, no se puede insertarlo

      if (isProductAvailableAtBranch) {
        throw new Error('Producto ya existente en la sucursal');
      }

      let productExist = await this.findProductByName(data.nombre!);

      const product = productExist ? productExist : new this.model(data);
      const sucursal = await this.modelSucursal.findById(data.sucursalId);
      const grupo = await this.modelGrupoInventario.findById(data.grupoId);

      if (!sucursal) {
        throw new Error('Sucursal no encontrada');
      }

      if (!grupo) {
        throw new Error('Grupo no encontrado');
      }

      let productSave = productExist
        ? productExist
        : await product.save({ session });

      let inventarioSucursal = new this.modelInventarioSucursal({
        productoId: productSave._id,
        sucursalId: sucursal._id,
        stock: data.stock,
        ultimo_movimiento: new Date(),
        precio: data.precio,
      });

      let productoGrupoExist = await this.modelProductoGrupo.findOne({
        productoId: productSave._id,
        grupoId: grupo._id,
      });

      if (!productoGrupoExist) {
        let productoGrupo = new this.modelProductoGrupo({
          productoId: productSave._id,
          grupoId: grupo._id,
        });

        await productoGrupo.save({ session });
      }

      await inventarioSucursal.save({ session });

      await session.commitTransaction();
      session.endSession();

      const sucursalId = new mongoose.Types.ObjectId(
        data.sucursalId?.toString()
      );
      let grupoId = new mongoose.Types.ObjectId(data.grupoId?.toString());

      let productoCreate: IProductCreate = {
        nombre: data.nombre!,
        descripcion: data.descripcion!,
        precio: data.precio!,
        monedaId: data.monedaId!,
        deleted_at: null,
        sucursalId,
        grupoId,
        stock: data.stock!,
        create_at: new Date(),
        update_at: new Date(),
      };

      return productoCreate;
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
    const query = this.model.find({ ...filters, deleted_at: null });

    return await query.limit(limit).skip(skip).exec();
  }

  async findProductByNameInSucursal(
    name: string,
    sucursalId: string
  ): Promise<IProducto | null> {
    const product = await this.model.findOne({ nombre: name });

    if (!product) return null;

    const query = await this.modelInventarioSucursal.findOne({
      productoId: product._id,
      sucursalId: sucursalId,
      deleted_at: null,
    });

    return query ? product : null;
  }

  async findProductByName(name: string): Promise<IProducto | null> {
    const product = await this.model.findOne({ nombre: name });

    if (!product) return null;

    return product;
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

  async findAllProducts(): Promise<IBranchProductsAll[]> {
    
    const products = await this.modelInventarioSucursal
      .find({ deleted_at: null })
      .populate([{ path: 'productoId' }, { path: 'sucursalId' }]);

    let newProducts: IBranchProductsAll[] = [];

    products.forEach((inventarioSucursal) => {
      if (inventarioSucursal.deleted_at == null) {
        let producto = inventarioSucursal.productoId as IProducto;
        let sucursalId = inventarioSucursal.sucursalId as ISucursal;

        if (producto.deleted_at == null) {
          newProducts.push({
            stock: inventarioSucursal.stock,
            nombre: producto.nombre,
            descripcion: producto.descripcion,
            precio: inventarioSucursal.precio,
            monedaId: producto.monedaId,
            deleted_at: producto.deleted_at,
            id: producto._id as mongoose.Types.ObjectId,
            sucursalId: sucursalId._id as mongoose.Types.ObjectId,
            inventarioSucursalId:
              inventarioSucursal._id as mongoose.Types.ObjectId,
            create_at: producto.create_at!,
            update_at: producto.update_at!,
            nombreSucursal: sucursalId.nombre,
          });
        }
      }
    });

    return newProducts;
  }
   async findProductoGrupoByProductId(productId: string): Promise<IProductosGrupos | null> {
    const productoGrupo = await this.modelProductoGrupo.findOne({ productoId: productId }).populate('grupoId');

    if (!productoGrupo) {
      return null;
    }

    return productoGrupo;
  }
}

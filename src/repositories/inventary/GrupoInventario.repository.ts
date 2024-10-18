import { injectable } from 'tsyringe';
import { ProductosGrupos } from '../../models/inventario/ProductosGrupo.model';
import { IProducto, Producto } from '../../models/inventario/Producto.model';
import { GrupoInventario, IGrupoInventario, IGrupoInventarioWithPopulate } from '../../models/inventario/GrupoInventario.model';

@injectable()
export class GrupoInventarioRepository {
  private model: typeof GrupoInventario;
  private modelProductoGrupo: typeof ProductosGrupos;
  private modelProducto: typeof Producto;

  constructor() {
    this.model = GrupoInventario;
    this.modelProductoGrupo = ProductosGrupos;
    this.modelProducto = Producto;
  }

  async create(data: Partial<IGrupoInventario>): Promise<IGrupoInventario> {
    const grupo = new this.model(data);
    return await grupo.save();
  }

  async findById(id: string): Promise<IGrupoInventario | null> {
    const grupo = await this.model.findById(id);

    if (!grupo) {
      return null;
    }

    return grupo;
  }
  async findByIdWithProduct(id: string): Promise<IGrupoInventario | null> {
    const grupo = await this.model.findById(id);

    if (!grupo) {
      return null;
    }

    let newGrupo: IGrupoInventarioWithPopulate = grupo;

    let productGroup = await this.modelProductoGrupo.find({ grupoId: id }).populate('productoId');

    if (productGroup.length > 0) {
      productGroup.forEach(product => {
        newGrupo.products?.push(product.productoId as IProducto);
      });
    }
    
    return grupo;
  }
  
  async findAll(filters: any = {}, limit: number = 10, skip: number = 0): Promise<IGrupoInventario[]> {
    const query = this.model.find(filters);

    return await query.limit(limit).skip(skip).exec();
  }

  async update(id: string, data: Partial<IGrupoInventario>): Promise<IGrupoInventario | null> {
    return await this.model.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async delete(id: string): Promise<IGrupoInventario | null> {
    return await this.model.findByIdAndUpdate(id, { deleted_at: new Date() }, { new: true }).exec();
  }

  async restore(id: string): Promise<IGrupoInventario | null> {
    return await this.model.findByIdAndUpdate(id, { deleted_at: null }, { new: true }).exec();
  }
}

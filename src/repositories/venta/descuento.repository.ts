import { injectable } from 'tsyringe';
import { Descuento, IDescuento, IDescuentoCreate, IListDescuentoResponse} from '../../models/Ventas/Descuento.model';
import { DescuentoGrupo, IDescuentoGrupo } from '../../models/Ventas/DescuentoGrupo.model';
import { DescuentosProductos, IDescuentosProductos } from '../../models/Ventas/DescuentosProductos.model';
import mongoose from 'mongoose';
import { ISucursal } from 'src/models/sucursales/Sucursal.model';

@injectable()
export class DescuentoRepository {
  private model: typeof Descuento;
  private modelDescuentoProducto: typeof DescuentosProductos;
  private modelDescuentoGrupo: typeof DescuentoGrupo;

  constructor() {
    this.model = Descuento;
    this.modelDescuentoProducto = DescuentosProductos;
    this.modelDescuentoGrupo = DescuentoGrupo;
  }

  async create(data: Partial<IDescuentoCreate>, session: mongoose.mongo.ClientSession): Promise<IDescuento> {
    const descuento = new this.model(data);
    return await descuento.save({ session });
  }

  async createDescuentoProducto(data: Partial<IDescuentosProductos>, session: mongoose.mongo.ClientSession): Promise<void> {
    const descuento = new this.modelDescuentoProducto(data);
    await descuento.save({ session });
  }
  async createDescuentoGrupo(data: Partial<IDescuentoGrupo>, session: mongoose.mongo.ClientSession): Promise<void> {
    const descuento = new this.modelDescuentoGrupo(data);
    await descuento.save({ session });
  }

  async findById(id: string): Promise<IDescuento | null> {
    const descuento = await this.model.findById(id);

    if (!descuento) {
      return null;
    }

    return descuento;
  }

  async findBySucursalId(sucursalId: string): Promise<IListDescuentoResponse> {
    const descuentosPorProductosGenerales: IDescuentosProductos[] = [];
    const descuentosPorProductosEnSucursal: IDescuentosProductos[] = [];
    const descuentosPorGruposGenerales: IDescuentoGrupo[] = [];
    const descuentosPorGruposEnSucursal: IDescuentoGrupo[] = [];

    let hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const queryProductos = await this.modelDescuentoProducto.find({ deleted_at: null }).populate(["descuentoId", "productoId", "sucursalId"]);
    const queryGrupos = await this.modelDescuentoGrupo.find({ deleted_at: null }).populate("descuentoId", "groupId", "sucursalId");

    queryProductos.forEach((descuentoProducto) => {
      if (!(descuentoProducto.descuentoId as IDescuento).activo ) {
        throw new Error("Descuento inactivo");  
      }

      let fechaInicio = (descuentoProducto.descuentoId as IDescuento).fechaInicio;
      let fechaFin = (descuentoProducto.descuentoId as IDescuento).fechaFin;

      if (fechaInicio && fechaFin) {
        if (fechaInicio > hoy || fechaFin < hoy) {
          throw new Error("Descuento no activado");
        }
      }
      
      if (descuentoProducto.sucursalId) {
        if ((descuentoProducto.sucursalId as ISucursal).id === sucursalId) {
          descuentosPorProductosEnSucursal.push(descuentoProducto);
        }
      } else {
        descuentosPorProductosGenerales.push(descuentoProducto);
      }
    });

    queryGrupos.forEach((descuentoGrupo) => {

      if (!(descuentoGrupo.descuentoId as IDescuento).activo ) {
        throw new Error("Descuento inactivo");  
      }

      let fechaInicio = (descuentoGrupo.descuentoId as IDescuento).fechaInicio;
      let fechaFin = (descuentoGrupo.descuentoId as IDescuento).fechaFin;

      if (fechaInicio && fechaFin) {
        if (fechaInicio > hoy || fechaFin < hoy) {
          throw new Error("Descuento no activado");
        }
      }
      
      if (descuentoGrupo.sucursalId) {
        if ((descuentoGrupo.sucursalId as ISucursal).id === sucursalId) {
          descuentosPorGruposEnSucursal.push(descuentoGrupo);
        }
      } else {
        descuentosPorGruposGenerales.push(descuentoGrupo);
      }
    });

    const listDescuentos = {
      descuentosPorProductosGenerales,
      descuentosPorProductosEnSucursal,
      descuentosPorGruposGenerales,
      descuentosPorGruposEnSucursal,
    };

    return listDescuentos;
  }

  async findByName(
    name: string,
  ): Promise<IDescuento | null> {
    const descuento = await this.model.findOne({ nombre: name });

    return descuento;
  }

  async update(
    id: string,
    data: Partial<IDescuento>
  ): Promise<IDescuento | null> {
    return await this.model.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async delete(id: string): Promise<IDescuento | null> {
    return await this.model
      .findByIdAndUpdate(id, { deleted_at: new Date() }, { new: true })
      .exec();
  }

  async restore(id: string): Promise<IDescuento | null> {
    return await this.model
      .findByIdAndUpdate(id, { deleted_at: null }, { new: true })
      .exec();
  }
}

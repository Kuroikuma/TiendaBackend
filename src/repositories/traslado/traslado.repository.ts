import { injectable } from 'tsyringe';
import { ITraslado, Traslado } from '../../models/traslados/Traslado.model';
import mongoose, { mongo } from 'mongoose';
import {
  DetalleTraslado,
  IDetalleTraslado,
  IDetalleTrasladoCreate,
} from '../../models/traslados/DetalleTraslado.model';

@injectable()
export class TrasladoRepository {
  private model: typeof Traslado;
  private modelDetalleTraslado: typeof DetalleTraslado;

  constructor() {
    this.model = Traslado;
    this.modelDetalleTraslado = DetalleTraslado;
  }

  async create(data: Partial<ITraslado>): Promise<ITraslado> {
    const Traslado = new this.model(data);
    return await Traslado.save();
  }

  async findById(id: string): Promise<ITraslado | null> {
    const Traslado = await this.model.findById(id);

    if (!Traslado) {
      return null;
    }

    return Traslado;
  }

  async findAll(
    filters: any = {},
    limit: number = 10,
    skip: number = 0
  ): Promise<ITraslado[]> {
    const query = this.model.find({ ...filters, deleted_at: null });

    return await query.limit(limit).skip(skip).exec();
  }

  async findByName(name: string): Promise<ITraslado | null> {
    const Traslado = await this.model.findOne({ nombre: name });

    return Traslado;
  }

  async update(
    id: string,
    data: Partial<ITraslado>,
    session: mongoose.mongo.ClientSession
  ): Promise<ITraslado | null> {

    return await this.model
      .findByIdAndUpdate(id, { $set: data }, { new: true, session })
      .exec();
  }

  async delete(id: string): Promise<ITraslado | null> {
    return await this.model
      .findByIdAndUpdate(id, { deleted_at: new Date() }, { new: true })
      .exec();
  }

  async restore(id: string): Promise<ITraslado | null> {
    return await this.model
      .findByIdAndUpdate(id, { deleted_at: null }, { new: true })
      .exec();
  }
  async saveAllDetalleTraslado(
    data: IDetalleTrasladoCreate[],
    session: mongo.ClientSession
  ): Promise<void> {
    await this.modelDetalleTraslado.insertMany(data, { session });
  }

  async updateAllDetalleTraslado(
    data: IDetalleTraslado[],
    session: mongo.ClientSession
  ): Promise<void> {
    const bulkOps = data.map((detalle) => ({
      updateOne: {
          filter: { _id: detalle._id },
          update: { $set: detalle },
          upsert: true
      }
  }));
  
  await this.modelDetalleTraslado.bulkWrite(bulkOps, { session });
  }

  async getLastTrasladoBySucursalId(sucursalId: string) {
    try {
      const ultimoTraslado = await this.model
        .findOne({ sucursalOrigenId:sucursalId })
        .sort({ fechaRegistro: -1 });
      // Ejecuta la

      return ultimoTraslado;
    } catch (error) {
      console.error('Error al obtener el último traslado:', error);
      throw new Error('Error al obtener el último traslado');
    }
  }

  async findAllItemDePedidoByPedido(pedidoId: string) {
    try {
      const listItemDePedido = await this.modelDetalleTraslado.find({ trasladoId: pedidoId });

      return listItemDePedido;
    } catch (error) {
      console.error('Error al obtener el último traslado:', error);
      throw new Error('Error al obtener el último traslado');
    }
  }

  async findPedidoEnviadosBySucursal(sucursalId: string) {
    try {      
      const listPedidos = await this.model
        .find({ sucursalOrigenId: sucursalId })
        .populate([
          { path: 'usuarioIdEnvia' },
          { path: 'usuarioIdRecibe' },
          { path: 'sucursalOrigenId' },
          { path: 'sucursalDestinoId' },
        ]);

      return listPedidos;
    } catch (error) {
      console.error('Error al obtener los pedidos enviados:', error);
      throw new Error('Error al obtener los pedidos enviados');
    }
  }

  async findPedidoRecibidosBySucursal(sucursalId: string) {
    try {
      const listPedidos = await this.model
        .find({ sucursalDestinoId: sucursalId })
        .populate([
          { path: 'usuarioIdEnvia' },
          { path: 'usuarioIdRecibe' },
          { path: 'sucursalOrigenId' },
          { path: 'sucursalDestinoId' },
        ]);

      return listPedidos;
    } catch (error) {
      console.error('Error al obtener los pedidos recibidos:', error);
      throw new Error('Error al obtener los pedidos recibidos');
    }
  }

  async findPedidoPorRecibirBySucursal(sucursalId: string) {
    try {
      const listPedidos = await this.model
        .find({ sucursalDestinoId: sucursalId })
        .populate([
          { path: 'usuarioIdEnvia' },
          { path: 'usuarioIdRecibe' },
          { path: 'sucursalOrigenId' },
          { path: 'sucursalDestinoId' },
        ]);

      const listPedidoPorRecibir = listPedidos.filter((pedido) => pedido.estatusTraslado === 'En Proceso');

      return listPedidoPorRecibir;
    } catch (error) {
      console.error('Error al obtener los pedidos por recibir:', error);
      throw new Error('Error al obtener los pedidos por recibir');
    }
  }

  async findPedidoEnProcesoBySucursal(sucursalId: string) {
    try {
      const listPedidos = await this.model
        .find({ sucursalOrigenId: sucursalId })
        .populate([
          { path: 'usuarioIdEnvia' },
          { path: 'usuarioIdRecibe' },
          { path: 'sucursalOrigenId' },
          { path: 'sucursalDestinoId' },
        ]);

      const listPedidoEnProceso = listPedidos.filter((pedido) => pedido.estatusTraslado === 'En Proceso');

      return listPedidoEnProceso;
    } catch (error) {
      console.error('Error al obtener los pedidos en proceso:', error);
      throw new Error('Error al obtener los pedidos en proceso');
    }
  }
}

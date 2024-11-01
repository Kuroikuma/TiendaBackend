import { injectable, inject } from 'tsyringe';
import {
  IDescuento,
  IDescuentoCreate,
} from '../../models/Ventas/Descuento.model';
import { DescuentoRepository } from '../../repositories/venta/descuento.repository';
import mongoose from 'mongoose';

@injectable()
export class DescuentoService {
  constructor(
    @inject(DescuentoRepository) private repository: DescuentoRepository
  ) {}

  async createDescuento(data: Partial<IDescuentoCreate>): Promise<IDescuento> {
    const session = await mongoose.startSession();

    const descuentoExists = await this.repository.findByName(data.nombre!);

    try {
      session.startTransaction();

      if (descuentoExists) {
        throw new Error('Descuento already exists');
      }

      const newDescuento = await this.repository.create(data, session);

      let tipoDescuentoEntidad = data.tipoDescuentoEntidad!;
      let productId = data.productId!;
      let groupId = data.groupId!;
      let descuentoId = newDescuento._id as mongoose.Types.ObjectId;

      if (tipoDescuentoEntidad === 'Product') {
        let descuentoProducto = {
          descuentoId,
          productId,
        };

        await this.repository.createDescuentoProducto(
          descuentoProducto,
          session
        );
      } else if (tipoDescuentoEntidad === 'Group') {
        let descuentoGrupo = {
          descuentoId,
          groupId,
        };

        await this.repository.createDescuentoGrupo(descuentoGrupo, session);
      }

      await session.commitTransaction();
      session.endSession();

      return newDescuento;
    } catch (error) {
      console.log(error);

      await session.abortTransaction();
      session.endSession();

      throw new Error('Error al crear el descuento');
    }
  }

  async getDescuentoById(id: string): Promise<IDescuento | null> {
    const descuento = await this.repository.findById(id);
    if (!descuento) {
      throw new Error('Grupo not found');
    }
    return descuento;
  }

  async getAllDescuento(
    filters: any,
    limit: number,
    skip: number
  ): Promise<IDescuento[]> {
    return this.repository.findAll(filters, limit, skip);
  }

  async updateDescuento(
    id: string,
    data: Partial<IDescuento>
  ): Promise<IDescuento | null> {
    const descuento = await this.repository.update(id, data);
    if (!descuento) {
      throw new Error('Grupo not found');
    }
    return descuento;
  }

  async deleteDescuento(id: string): Promise<IDescuento | null> {
    const descuento = await this.repository.delete(id);
    if (!descuento) {
      throw new Error('Group not found');
    }
    return descuento;
  }

  async restoreDescuento(id: string): Promise<IDescuento | null> {
    return this.repository.restore(id);
  }
}

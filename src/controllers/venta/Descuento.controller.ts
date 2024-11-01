import { injectable, inject } from 'tsyringe';
import { Request, Response, NextFunction } from 'express';
import { DescuentoService } from '../../services/venta/descuento.service';

@injectable()
export class DescuentoController {
  constructor(@inject(DescuentoService) private service: DescuentoService) {}

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const descuento = await this.service.createDescuento(req.body);
      res.status(201).json(descuento);
    } catch (error) {
      next(error);
    }
  }

  async getById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const descuento = await this.service.getDescuentoById(req.params.id);
      res.status(200).json(descuento);
    } catch (error) {
      next(error);
    }
  }

  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { limit = 10, skip = 0, ...filters } = req.query;
      const descuento = await this.service.getAllDescuento(
        filters,
        Number(limit),
        Number(skip)
      );
      res.status(200).json(descuento);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const descuento = await this.service.updateDescuento(req.params.id, req.body);
      res.status(200).json(descuento);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const descuento = await this.service.deleteDescuento(req.params.id);
      res.status(200).json(descuento);
    } catch (error) {
      next(error);
    }
  }

  async restore(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const descuento = await this.service.restoreDescuento(req.params.id);
      res.status(200).json(descuento);
    } catch (error) {
      next(error);
    }
  }
}
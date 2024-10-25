import { injectable, inject } from 'tsyringe';
import { Request, Response, NextFunction } from 'express';
import { ProductoService } from '../../services/inventario/Product.service';

@injectable()
export class ProductoController {
  constructor(@inject(ProductoService) private service: ProductoService) {}

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const branch = await this.service.createProduct(req.body);
      res.status(201).json(branch);
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
      const branch = await this.service.getProductById(req.params.id);
      res.status(200).json(branch);
    } catch (error) {
      next(error);
    }
  }

  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { limit = 10, skip = 0, ...filters } = req.query;
      const branch = await this.service.getAllProduct(
        filters,
        Number(limit),
        Number(skip)
      );
      res.status(200).json(branch);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const branch = await this.service.updateProduct(req.params.id, req.body);
      res.status(200).json(branch);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const branch = await this.service.deleteProduct(req.params.id);
      res.status(200).json(branch);
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
      const branch = await this.service.restoreProduct(req.params.id);
      res.status(200).json(branch);
    } catch (error) {
      next(error);
    }
  }
}
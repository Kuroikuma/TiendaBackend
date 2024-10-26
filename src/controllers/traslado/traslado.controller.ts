import { injectable, inject } from 'tsyringe';
import { Request, Response, NextFunction } from 'express';
import { TrasladoService } from '../../services/traslado/traslado.service';

@injectable()
export class TrasladoController {
  constructor(@inject(TrasladoService) private service: TrasladoService) {}

  async postCreateEnvioProducto(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const traslado = await this.service.postCreateEnvioProducto(req.body);
      res.status(201).json(traslado);
    } catch (error) {
      next(error);
    }
  }

  async postCreateRecibirProducto(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const traslado = await this.service.postRecibirPedido(req.body);
      res.status(201).json(traslado);
    } catch (error) {
      next(error);
    }
  }
}

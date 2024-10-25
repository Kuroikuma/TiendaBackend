// import { injectable, inject } from 'tsyringe';
// import { Request, Response, NextFunction } from 'express';
// import { TrasladoService } from '../../services/traslado/InventoryManagement.service';

// @injectable()
// export class GrupoInventarioController {
//   constructor(@inject(TrasladoService) private service: TrasladoService) {}

//   async create(req: Request, res: Response, next: NextFunction): Promise<void> {
//     try {
//       const group = await this.service.createGrupo(req.body);
//       res.status(201).json(group);
//     } catch (error) {
//       next(error);
//     }
//   }
// }

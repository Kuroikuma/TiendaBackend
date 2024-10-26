import { TrasladoController } from '../../controllers/traslado/traslado.controller';
import { container } from 'tsyringe';
import { authMiddleware } from '../../middlewares/authMiddleware';

const express = require('express');
const router = express.Router();

const trasladoController = container.resolve(TrasladoController);

router.use(authMiddleware);

// Definir las rutas
router.post('/', trasladoController.postCreateEnvioProducto.bind(trasladoController));
router.post('/RecibirPedido', trasladoController.postCreateRecibirProducto.bind(trasladoController));
// router.get(
//   '/:id',
//   authMiddleware,
//   branchController.getById.bind(branchController)
// );
// router.get('/', authMiddleware, branchController.getAll.bind(branchController));
// router.put(
//   '/:id',
//   authMiddleware,
//   branchController.update.bind(branchController)
// );
// router.delete(
//   '/:id',
//   authMiddleware,
//   branchController.delete.bind(branchController)
// );
// router.patch(
//   '/:id/restore',
//   authMiddleware,
//   branchController.restore.bind(branchController)
// );

// router.get('/:id/products', authMiddleware, branchController.findBranchProducts.bind(branchController));

export default router;

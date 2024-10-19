import { ProductoController } from '../../controllers/inventario/Product.controller';
import { container } from 'tsyringe';
import { authMiddleware } from '../../middlewares/authMiddleware';

const express = require('express');
const router = express.Router();

const productController = container.resolve(ProductoController);

router.use(authMiddleware);

// Definir las rutas
router.post('/', productController.create.bind(productController));
router.get('/:id', productController.getById.bind(productController));
router.get('/', productController.getAll.bind(productController));
router.put('/:id', productController.update.bind(productController));
router.delete('/:id', productController.delete.bind(productController));
router.patch('/:id/restore', productController.restore.bind(productController));

export default router;

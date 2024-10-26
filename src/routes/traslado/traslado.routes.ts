import { TrasladoController } from '../../controllers/traslado/traslado.controller';
import { container } from 'tsyringe';
import { authMiddleware } from '../../middlewares/authMiddleware';

const express = require('express');
const router = express.Router();

const trasladoController = container.resolve(TrasladoController);

router.use(authMiddleware);

// Post de envio de pedido
router.post('/', trasladoController.postCreateEnvioProducto.bind(trasladoController));
router.post('/RecibirPedido', trasladoController.postCreateRecibirProducto.bind(trasladoController));

// Get de pedidos enviados
router.get('/enviados', trasladoController.findPedidoEnviadosBySucursal.bind(trasladoController));

// Get de pedidos recibidos
router.get('/recibidos', trasladoController.findPedidoRecibidosBySucursal.bind(trasladoController));

// Get de pedidos por recibir
router.get('/recibir', trasladoController.findPedidoPorRecibirBySucursal.bind(trasladoController));

export default router;

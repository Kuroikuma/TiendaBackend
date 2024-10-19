import 'reflect-metadata';
import * as dotenv from 'dotenv';
import connectDB from './config/database';
import userRoutes from './routes/user.routes';
import branchRoutes from './routes/branch.routes';
import productRoutes from './routes/inventario/producto.routes';
import { errorHandler } from './middlewares/errorHandler';
import grupoRoutes from './routes/inventario/grupo.routes';

const express = require('express');
const cors = require("cors");

dotenv.config();

const app = express();
const port = process.env.PORT;

connectDB();

app.use(cors());

app.use(express.json());

// Rutas
app.use('/api/users', userRoutes);
app.use('/api/branches', branchRoutes);

// rutas de inventario
app.use('/api/inventory/products', productRoutes);
app.use('/api/inventory/groups', grupoRoutes);

// Middleware de manejo de errores
app.use(errorHandler);



app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

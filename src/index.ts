import 'reflect-metadata';
import * as dotenv from 'dotenv';
import express from 'express';
import connectDB from './config/database';
import userRoutes from './routes/user.routes';
import branchRoutes from './routes/branch.routes';

dotenv.config();

const app = express();
const port = process.env.PORT;

connectDB();

app.use(express.json());

// Rutas
app.use('/api/users', userRoutes);
app.use('/api/branches', branchRoutes);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/database';
import userRoutes from './routes/userRoutes';

dotenv.config();

const app = express();
const port = process.env.PORT;

connectDB();

app.use(express.json());

// Rutas
app.use('/api/users', userRoutes);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

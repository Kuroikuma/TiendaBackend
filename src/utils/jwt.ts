import jwt, { SignOptions, JwtPayload } from 'jsonwebtoken';
import { Types } from 'mongoose'; // Para manejar ObjectId



// Configura las opciones de JWT en variables de entorno para hacerlas configurables
const jwtOptions: SignOptions = {
  expiresIn: process.env.JWT_EXPIRES_IN || '1h',  // Tiempo de expiración configurable
  algorithm: process.env.JWT_ALGORITHM as jwt.Algorithm || 'HS256', // Algoritmo de firma
};

export interface CustomJwtPayload extends JwtPayload {
  userId: Types.ObjectId; // Asegurándonos de que el userId sea de tipo ObjectId
  username: string;
}

export const generateToken = (payload: CustomJwtPayload): string => {
  const secretKey = process.env.JWT_SECRET || 'defaultSecretKey';
  // Utiliza un secreto más seguro desde las variables de entorno
  console.log(secretKey)
  
  if (!secretKey || secretKey === 'defaultSecretKey') {
    throw new Error('Secret key not set in environment variables');
  }
  
  return jwt.sign(payload, secretKey, jwtOptions);
};


export const verifyToken = (token: string): CustomJwtPayload | null => {
  const secretKey = process.env.JWT_SECRET || 'defaultSecretKey';
  try {
    return jwt.verify(token, secretKey) as CustomJwtPayload;
  } catch (err) {
    console.error('Token verification failed:', err);
    return null;
  }
};

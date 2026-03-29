import { Router } from 'express';
import { transactionRoutes } from './transaction.routes';
import { userRoutes } from './user.routes';

const routes = Router();

routes.use('/transactions', transactionRoutes);
routes.use('/users', userRoutes);

export { routes };

import { Router } from 'express';
import { transactionRoutes } from '../modules/transactions/routes/transaction.routes';
import { userRoutes } from '../modules/users/routes/user.routes';

const routes = Router();

routes.use('/transactions', transactionRoutes);
routes.use('/users', userRoutes);

export { routes };

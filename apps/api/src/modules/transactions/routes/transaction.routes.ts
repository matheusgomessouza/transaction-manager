import { Router } from 'express';
import { transactionController } from '../controllers/transaction.controller';

const transactionRoutes = Router();

transactionRoutes.post('/', transactionController.process);
transactionRoutes.get('/resume', transactionController.getResume);
transactionRoutes.get('/invalid', transactionController.getInvalid);

export { transactionRoutes };

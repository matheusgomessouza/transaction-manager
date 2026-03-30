import 'dotenv/config';
import 'express-async-errors';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { routes } from './routes';
import { logger } from './lib/logger';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use(routes);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  logger.error({ error: err.message, stack: err.stack }, 'Erro não tratado capturado pelo Express');

  res.status(500).json({
    status: 'error',
    message: 'Internal server error',
  });
});

const PORT = process.env.PORT || 3333;

if (process.env.NODE_ENV !== 'test') {
  app.listen(Number(PORT), '0.0.0.0', () => {
    logger.info(`Server running on port ${PORT}`);
  });
}

export { app };

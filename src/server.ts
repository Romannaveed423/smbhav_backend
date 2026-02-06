import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { connectDatabase } from './config/database';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import routes from './routes';
import http from 'http';
import { initSocket } from './socket';


const app: Application = express();

const server = http.createServer(app);
initSocket(server);

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
app.use(cors({
  origin: [
    'http://72.61.244.223:3001',
    'http://localhost:3001',
    'http://localhost:3000',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
if (env.nodeEnv === 'development') {
  app.use(morgan('dev'));
  // Route debugging in development
  app.use((req, res, next) => {
    console.log(`[ROUTE] ${req.method} ${req.path}`);
    next();
  });
} else {
  app.use(morgan('combined'));
}

// Rate limiting removed

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/v1', routes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    code: 'NOT_FOUND',
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
const startServer = async (): Promise<void> => {
  try {
    await connectDatabase();
    
    const server = app.listen(env.port, '0.0.0.0', () => {
      console.log(`Server is running on http://0.0.0.0:${env.port} in ${env.nodeEnv} mode`);
    });

    // Handle server errors (like port already in use)
    server.on('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`\n Port ${env.port} is already in use!`);
        console.error(`\n To fix this, run one of these commands:`);
        console.error(`   npm run kill-port`);
        console.error(`   lsof -ti:${env.port} | xargs kill`);
        console.error(`   pkill -f "tsx watch"`);
        process.exit(1);
      } else {
        console.error('Failed to start server:', error);
        process.exit(1);
      }
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;


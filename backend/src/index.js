import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import portfolioRoutes from './routes/portfolio.js';
import healthRoutes from './routes/health.js';
import { requestLogger } from './middleware/requestLogger.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(requestLogger);

// Routes
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/health', healthRoutes);

// 404 handler for undefined routes
app.use(notFoundHandler);

// Error handling middleware (must be last)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
  console.log(`CORS enabled for: ${corsOptions.origin}`);
  console.log(`Excel file path: ${process.env.EXCEL_FILE_PATH || 'NOT CONFIGURED'}`);
});

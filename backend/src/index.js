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

// CORS configuration - handle multiple origins and missing protocol
const getAllowedOrigins = () => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const origins = [];
  
  // Add the configured URL
  if (frontendUrl.startsWith('http://') || frontendUrl.startsWith('https://')) {
    origins.push(frontendUrl);
  } else {
    // If no protocol, add both http and https versions
    origins.push(`https://${frontendUrl}`);
    origins.push(`http://${frontendUrl}`);
  }
  
  // Always allow localhost for development
  origins.push('http://localhost:3000');
  
  return origins;
};

const allowedOrigins = getAllowedOrigins();

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.some(allowed => origin === allowed || origin.includes(allowed.replace(/^https?:\/\//, '')))) {
      callback(null, true);
    } else {
      console.log(`CORS blocked origin: ${origin}`);
      console.log(`Allowed origins: ${allowedOrigins.join(', ')}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
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
  console.log(`CORS enabled for: ${allowedOrigins.join(', ')}`);
  console.log(`Excel file path: ${process.env.EXCEL_FILE_PATH || 'NOT CONFIGURED'}`);
});

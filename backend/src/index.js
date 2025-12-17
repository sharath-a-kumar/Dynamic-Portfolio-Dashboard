import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Basic health check route
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    services: {
      yahooFinance: true,
      googleFinance: true
    }
  });
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});

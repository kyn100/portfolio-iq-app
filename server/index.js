import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Explicitly load .env from server directory
dotenv.config({ path: path.join(__dirname, '.env') });

console.log("Server Environment Loaded. GEMINI_API_KEY:", process.env.GEMINI_API_KEY ? "Present" : "Missing");
import express from 'express';
import cors from 'cors';
import stocksRouter from './routes/stocks.js';
import portfolioRouter from './routes/portfolio.js';
import watchlistRouter from './routes/watchlist.js';
import sectorsRouter from './routes/sectors.js';
import insightsRouter from './routes/insights.js';
import batchQuotesRouter from './routes/batchQuotes.js';
import searchRouter from './routes/search.js';
import trendAlertsRouter from './routes/trendAlerts.js';
import recommendationsHandler from '../api/_controllers/recommendations.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/stocks', stocksRouter);
app.use('/api/portfolio', portfolioRouter);
app.use('/api/watchlist', watchlistRouter);
app.use('/api/sectors', sectorsRouter);
app.use('/api/insights', insightsRouter);
app.use('/api/trend-alerts', trendAlertsRouter);
app.use('/api/batch-quotes', batchQuotesRouter);
app.use('/api/search', searchRouter);
app.use('/api/recommendations', recommendationsHandler);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`🚀 PortfolioIQ server running on http://localhost:${PORT}`);
});

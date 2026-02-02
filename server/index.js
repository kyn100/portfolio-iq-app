import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import stocksRouter from './routes/stocks.js';
import portfolioRouter from './routes/portfolio.js';
import watchlistRouter from './routes/watchlist.js';
import sectorsRouter from './routes/sectors.js';
import insightsRouter from './routes/insights.js';
import trendAlertsRouter from './routes/trendAlerts.js';

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

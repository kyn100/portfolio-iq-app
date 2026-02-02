import express from 'express';
import cors from 'cors';

// Controllers
import portfolioHandler from './_controllers/portfolio.js';
import watchlistHandler from './_controllers/watchlist.js';
import sectorsHandler from './_controllers/sectors.js';
import insightsHandler from './_controllers/insights.js';
import batchQuotesHandler from './_controllers/batch-quotes.js';
import searchHandler from './_controllers/search.js';
import trendAlertsHandler from './_controllers/trend-alerts.js';
import healthHandler from './_controllers/health.js';
import stockDetailsHandler from './_controllers/stock-details.js';
import recommendationsHandler from './_controllers/recommendations.js';

const app = express();


// Middleware
app.use(cors({
    origin: '*', // Allow all for Vercel app
    credentials: true
}));
app.use(express.json());

// Routes
// We mount the handlers. 
// Note: Some handlers strictly check req.method inside. `app.all` passes everything.
// Some handlers manually set CORS headers. That's fine, Express CORS + manual headers might duplicate but usually works or manual overrides.

app.all('/api/portfolio', portfolioHandler);
app.all('/api/portfolio/:id', portfolioHandler); // Handle specific item operations if logic exists, typically portfolio.js handled method switching.

app.all('/api/watchlist', watchlistHandler);
app.all('/api/watchlist/:symbol', watchlistHandler);

app.all('/api/sectors', sectorsHandler);
app.all('/api/insights', insightsHandler);
app.all('/api/batch-quotes', batchQuotesHandler);
app.all('/api/search', searchHandler);
app.all('/api/trend-alerts', trendAlertsHandler);
app.all('/api/health', healthHandler);
app.all('/api/recommendations', recommendationsHandler);

// Stock Details
app.all('/api/stocks/:symbol', stockDetailsHandler);

// Fallback for unhandled routes
app.use((req, res) => {
    res.status(404).json({ error: 'API Route not found' });
});

export default app;

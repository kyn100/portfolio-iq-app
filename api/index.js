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
import blackswanHandler from './_controllers/blackswan.js';
import grayrhinoHandler from './_controllers/grayrhino.js';
import marketRouter from '../server/routes/market.js';
import focusListRouter from '../server/routes/focusList.js';

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

app.use('/api/portfolio', portfolioHandler);
// app.use matches subpaths, which is required for Routers.
// Note: Handlers must be Express Routers or middleware-compatible.

app.use('/api/watchlist', watchlistHandler);

app.use('/api/sectors', sectorsHandler);
app.use('/api/insights', insightsHandler);
app.use('/api/batch-quotes', batchQuotesHandler);
app.use('/api/search', searchHandler);
app.use('/api/trend-alerts', trendAlertsHandler);
app.use('/api/health', healthHandler);
app.use('/api/recommendations', recommendationsHandler);
app.use('/api/blackswan', blackswanHandler);
app.use('/api/grayrhino', grayrhinoHandler);
app.use('/api/market', marketRouter);
app.use('/api/focus-list', focusListRouter);

// Stock Details
app.all('/api/stocks/:symbol', stockDetailsHandler);

// Fallback for unhandled routes
app.use((req, res) => {
    res.status(404).json({ error: 'API Route not found' });
});

export default app;

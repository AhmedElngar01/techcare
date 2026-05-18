require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { initDb } = require('./src/config/db');
const { runSeed } = require('./src/db/seed');
const errorHandler = require('./src/middleware/error');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());
app.use(morgan('dev'));

// Initialize DB
initDb();
runSeed();

// Routes
app.use('/api/v1/auth', require('./src/routes/auth'));
app.use('/api/v1/devices', require('./src/routes/devices'));
app.use('/api/v1/diagnoses', require('./src/routes/diagnoses'));
app.use('/api/v1/guides', require('./src/routes/guides'));
app.use('/api/v1/parts', require('./src/routes/parts'));
app.use('/api/v1/orders', require('./src/routes/orders'));
app.use('/api/v1/payments', require('./src/routes/payments'));
app.use('/api/v1/reports', require('./src/routes/reports'));
app.use('/api/v1/admin/accounts', require('./src/routes/admin.accounts'));
app.use('/api/v1/admin/notifications', require('./src/routes/admin.notifications'));
app.use('/api/v1/admin/analytics', require('./src/routes/admin.analytics'));

// Error handling
app.use(errorHandler);

// Only listen if not running in a Vercel Serverless environment
if (!process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

module.exports = app;

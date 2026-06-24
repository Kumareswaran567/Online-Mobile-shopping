// Express Server — serves frontend + API on one port, auto-opens Chrome on start
const express    = require('express');
const cors       = require('cors');
const path       = require('path');
const { exec }   = require('child_process'); // for auto-opening Chrome
require('dotenv').config();

const checkoutRoutes = require('./routes/checkout');
const ordersRoutes   = require('./routes/orders');
const returnsRoutes  = require('./routes/returns');
const { query }      = require('./database');

const app  = express();
const PORT = process.env.PORT || 4000;

// ── CORS ──────────────────────────────────────────────
app.use(cors({
    origin: function(origin, callback) { callback(null, true); },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// ── Body parsing ──────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Request logging ───────────────────────────────────
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// ── Health check ──────────────────────────────────────
app.get('/health', async (req, res) => {
    try {
        await query('SELECT NOW()');
        res.json({ status: 'healthy', database: 'connected', timestamp: new Date().toISOString() });
    } catch (error) {
        res.status(500).json({ status: 'unhealthy', database: 'disconnected', error: error.message });
    }
});

// ── API Routes (must be before static files) ──────────
app.use('/api/checkout', checkoutRoutes);
app.use('/api/orders',   ordersRoutes);
app.use('/api/returns',  returnsRoutes);

// ── Serve Frontend Static Files ───────────────────────
const frontendPath = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendPath));

// Fallback → index.html  (Express 5 uses /{*path})
app.get('/{*path}', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
});

// ── Global error handler ──────────────────────────────
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// ── Start Server ──────────────────────────────────────
app.listen(PORT, () => {
    const url = `http://localhost:${PORT}`;

    console.log('\n🚀 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('   MobileHub is live!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log(`🌐  Website   →  ${url}`);
    console.log(`📦  Orders    →  ${url}/orders.html`);
    console.log(`🛡️   Admin     →  ${url}/admin.html`);
    console.log(`📊  Health    →  ${url}/health`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // ── Auto-open Chrome ──────────────────────────────
    // Tries Chrome first, falls back to the default browser
    const openCmd =
        process.platform === 'win32'
            ? `start chrome "${url}"`   // Windows
            : process.platform === 'darwin'
                ? `open -a "Google Chrome" "${url}"`  // macOS
                : `google-chrome "${url}"`;            // Linux

    exec(openCmd, (err) => {
        if (err) {
            // Chrome not found — try default browser
            const fallback =
                process.platform === 'win32'   ? `start "${url}"` :
                process.platform === 'darwin'  ? `open "${url}"` :
                                                 `xdg-open "${url}"`;
            exec(fallback);
        }
    });
});

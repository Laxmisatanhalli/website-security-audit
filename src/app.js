const path = require('path');
const express = require ('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const authRoutes = require('./routes/auth.routes')
const scanRoutes = require('./routes/scan.routes')
const websiteRoutes = require('./routes/website.routes')

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors({ credentials: true, origin: process.env.CORS_ORIGIN || true }));

app.use('/api/auth', authRoutes);
app.use('/api/scans', scanRoutes);
app.use('/api/websites', websiteRoutes);


app.use(express.static(path.join(__dirname, '../frontend')));

app.get(/.*/, (req, res, next) => {

    if (req.path.startsWith('/api/')) {
        return next();
    }

    res.sendFile(
        path.join(__dirname, '../frontend/index.html')
    );
});

module.exports = app;


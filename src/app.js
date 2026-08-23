const express = require ('express');
const authRoutes = require('./routes/auth.routes')
const scanRoutes = require('./routes/scan.routes')

const app = express();
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/scans', scanRoutes);

module.exports = app;
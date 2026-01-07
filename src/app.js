const express = require('express');
const ordersRoutes = require('./modules/orders/routes');

const app = express();

app.use(express.json());
app.use('/orders', ordersRoutes);

module.exports = app;

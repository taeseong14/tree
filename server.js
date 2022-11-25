const express = require('express');
const app = express();
const axios = require('axios');
const iconv = require('iconv-lite');

// app.use(require('cors')());
app.use(require('cookie-parser')());
app.use(express.json());
app.use('/common', require('./common'));

// routes

app.use('/tree', require('./tree'));



app.listen(3000, () => console.log('listening on port 3000'));
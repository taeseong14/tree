const express = require('express');
const app = express.Router();
const path = require('path');

app.use(express.static(__dirname));

module.exports = app;

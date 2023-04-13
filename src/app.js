require('dotenv').config();
const express = require("express");
const morgan = require("morgan");
const helmet = require("helmet");
const compression = require("compression");
const { checkOverload } = require("./helpers/check.connect");
const app = express();

//init middleware
app.use(morgan("dev"));
app.use(helmet());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({
    extended: true
}))

//init db
require("./dbs/init.mongodb");
// checkOverload();

//init routes
app.use('/', require('./routes'))

//init handling error

module.exports = app;

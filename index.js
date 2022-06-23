var express = require('express');
const bodyParser = require('body-parser');
var app = express();
const Sentry = require('@sentry/node');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.raw());
app.engine('html', require('ejs').renderFile);
const oracledb = require('oracledb');
const { Console, info } = require('console');
require("dotenv").config();
var config = require('./config');
const logger = require('./logger');
const swaggerUi = require('swagger-ui-express');
const swaggerFile = require('./swagger_output.json');
const weatherForecsat_router = require('./server/routes/weatherForecast');


//LOG
logger.create_logFile();


//SENTRY
Sentry.init({
    environment: process.env.NODE_ENV,
    dsn: process.env.SENTRY
});

app.use(Sentry.Handlers.requestHandler());


//ORACLE INIT
try {
    oracledb.initOracleClient({ libDir: process.env.INSTANTCLIENT });
} catch (e) {
    console.log("oracle instant client already initialized");
}
oracledb.autoCommit = true;
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

var indexRouter = express.Router();

//EndPoints
indexRouter.get('/', function(req, res) {
    logger.create_logFile();
    res.status(200).send({ "status": "ok" });
});

indexRouter.use('/', weatherForecsat_router);
indexRouter.use('/api-docs', swaggerUi.serve);
indexRouter.get('/api-docs', swaggerUi.setup(swaggerFile));

app.use(config.baseUrl, indexRouter);

let server = app.listen(process.env.PORT, process.env.IP_ADDRESS, function() {
    console.log('ONLINE on port ' + process.env.PORT);
});

module.exports = server;

// Optional fallthrough error handler
if (process.env.NODE_ENV === 'production') {
    app.use(function onError(err, req, res, next) {
        // The error id is attached to `res.sentry` to be returned
        // and optionally displayed to the user for support.
        res.statusCode = 500;
        res.end(res.sentry + "\n");
    });
}
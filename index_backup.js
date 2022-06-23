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
var dateFormat = require("dateformat");


// LOG
var winston = require('winston');
var fs = require('fs');
var path = require('path');
var date = new Date();
l_date = dateFormat(date, "yyyymmdd");
var logDir = config.logpath; // directory path you want to set
if (logDir == '') {
    console.log("LOGPATH: " + logDir + "\nIl campo LOGPATH non può essere vuoto!");
} else {
    if (!fs.existsSync(logDir)) {
        // Create the directory if it does not exist
        fs.mkdirSync(logDir);
    }
    var logger = new(winston.createLogger)({
        transports: [
            new(winston.transports.Console)({
                colorize: 'all'
            }),
            new(winston.transports.File)({ filename: path.join(logDir, l_date + '_weather.log') })
        ]
    });
}


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
    console.log('root_path');
    res.render("index.html");
});

indexRouter.get('/getWeatherData', async function(req, res) {

    let connection;

    try {
        connection = await oracledb.getConnection({
            user: process.env.USERORACLE,
            password: process.env.PASSORACLE,
            connectString: process.env.CONNECTSTRING
        });
        const results = await connection.execute(
            `SELECT ID_REQUEST FROM WEATHER_SITE_OPERATIONS WHERE ID_SITE = :P_SITE_ID AND CITY = :P_CITY AND MANAGED = 0`, {
                P_SITE_ID: {
                    type: oracledb.NUMBER,
                    dir: oracledb.BIND_IN,
                    val: parseInt(req.query.siteId)
                },
                P_CITY: {
                    type: oracledb.STRING,
                    dir: oracledb.BIND_IN,
                    val: req.query.city
                }
            }
        );
        if (results.rows.length === 0) {
            res.set('Content-Type', 'text/xml');
            res.send(results.rows);
        } else {
            var l_id_request = results.rows[0]['ID_REQUEST'];
            console.log(l_id_request);
            oracledb.fetchAsString = [oracledb.CLOB];
            const weather = await connection.execute(
                `SELECT RESPONSE FROM WEATHER_REQUEST WHERE ID = :P_ID_REQUEST`, {
                    P_ID_REQUEST: {
                        type: oracledb.NUMBER,
                        dir: oracledb.BIND_IN,
                        val: l_id_request
                    }
                }
            );
            await connection.execute(
                `UPDATE WEATHER_SITE_OPERATIONS SET MANAGED = 1 WHERE ID_SITE = :P_SITE_ID`, {
                    P_SITE_ID: {
                        type: oracledb.NUMBER,
                        dir: oracledb.BIND_IN,
                        val: parseInt(req.query.siteId)
                    }
                }
            );
            res.set('Content-Type', 'text/xml');
            res.send(weather.rows[0]['RESPONSE']);
        }
        logger.info('[/getWeatherData]' + '[' + dateFormat(date, "HH:MM:ss") + '] status: 1, statusDescription: OK');
    } catch (err) {
        console.error('General error: ' + err.message);
        res.status(200).send({ status: 0, statusDescription: err.message });
        logger.error('[/getWeatherData]' + '[' + dateFormat(date, "HH:MM:ss") + '] Error: ' + err.message);
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error('Error closing db connection: ' + err.message);
                logger.error('[/getWeatherData]' + '[' + dateFormat(date, "HH:MM:ss") + ']' + 'Error closing db connection: ' + err.message);
            }
        }
    }
});

indexRouter.get('/getWeatherLocations', async function(req, res) {

    let connection;
    let objs = [];
    var cities = "";

    try {
        connection = await oracledb.getConnection({
            user: process.env.USERORACLE,
            password: process.env.PASSORACLE,
            connectString: process.env.CONNECTSTRING
        });
        const results = await connection.execute(
            `SELECT CITY FROM WEATHER_SITE_CITIES WHERE ID_SITE = :P_SITE_ID`, {
                P_SITE_ID: {
                    type: oracledb.NUMBER,
                    dir: oracledb.BIND_IN,
                    val: parseInt(req.query.siteId)
                }
            }
        );
        for (var i = 0; i < results.rows.length; i++) {
            if (i === 0) {
                cities = results.rows[i]['CITY'];
            } else {
                cities = cities + ',' + results.rows[i]['CITY'];
            }
        }
        res.set('Content-Type', 'text/xml');
        res.send(cities);
        logger.info('[/getWeatherLocations]' + '[' + dateFormat(date, "HH:MM:ss") + '] status: 1, statusDescription: OK');
    } catch (err) {
        console.error('General error: ' + err.message);
        res.status(200).send({ status: 0, statusDescription: err.message });
        logger.error('[/getWeatherLocations]' + '[' + dateFormat(date, "HH:MM:ss") + '] Error: ' + err.message);
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error('Error closing db connection: ' + err.message);
                logger.error('[/getWeatherLocations]' + '[' + dateFormat(date, "HH:MM:ss") + ']' + 'Error closing db connection: ' + err.message);
            }
        }
    }
});

app.use(config.baseUrl, indexRouter);
app.listen(process.env.PORT, process.env.IP_ADDRESS, function() {

});

// Optional fallthrough error handler
if (process.env.NODE_ENV === 'production') {
    app.use(function onError(err, req, res, next) {
        // The error id is attached to `res.sentry` to be returned
        // and optionally displayed to the user for support.
        res.statusCode = 500;
        res.end(res.sentry + "\n");
    });
}
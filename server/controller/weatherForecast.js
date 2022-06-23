const oracledb = require('oracledb');
const logger = require('../../logger');
const dateFormat = require("dateformat");
const query = require('../query/weatherForecast');
const bodyParser = require('body-parser');
var express = require('express');
var app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.raw());
app.engine('html', require('ejs').renderFile);
const { Console, info } = require('console');
require("dotenv").config();
const jwt = require('jsonwebtoken');
const response_page = require('../../response_page');

async function getWeatherData(req, res) {
    // #swagger.tags = ['Accessing to the weather forecast data']
    /* #swagger.parameters['siteId'] = {
        in: 'query',
        type: "number",
        required: 'true',
        description: "Querying in order to access the weather forecast data"      
} */
    /* #swagger.parameters['city'] = {
        in: 'query',
        type: "string",
        required: 'true',
        description: "Querying in order to access the weather forecast locations data"      
} */
    /* #swagger.security = [{
               "AUTHORIZATION": []
        }] */

    let connection;
    const k_method_name = '[/getWeatherData]';

    try {
        connection = await oracledb.getConnection({
            user: process.env.USERORACLE,
            password: process.env.PASSORACLE,
            connectString: process.env.CONNECTSTRING
        });
        const results = await connection.execute(
            query.getWeatherData_select_idRequest, {
            P_SITE_ID: {
                type: oracledb.NUMBER,
                dir: oracledb.BIND_IN,
                val: parseInt(req.query.siteId)},
            P_CITY: {
                type: oracledb.STRING,
                dir: oracledb.BIND_IN,
                val: req.query.city}
        }
        );
        if (results.rows.length === 0) {
            res.set('Content-Type', 'text/xml');
            response_page.return_page(res, results.rows, null, 0);
        } else {
            var l_id_request = results.rows[0]['ID_REQUEST'];
            console.log(l_id_request);
            oracledb.fetchAsString = [oracledb.CLOB];
            const weather = await connection.execute(
                query.getWeatherData_select_response, {
                P_ID_REQUEST: {
                    type: oracledb.NUMBER,
                    dir: oracledb.BIND_IN,
                    val: l_id_request}
            }
            );
            await connection.execute(
                query.getWeatherData_update, {
                P_SITE_ID: {
                    type: oracledb.NUMBER,
                    dir: oracledb.BIND_IN,
                    val: parseInt(req.query.siteId)},
                P_ID_REQUEST: {
                    type: oracledb.NUMBER,
                    dir: oracledb.BIND_IN,
                    val: l_id_request}
            }
            );
            res.set('Content-Type', 'text/xml');
            response_page.return_page(res, weather.rows[0]['RESPONSE'], null, 0);
        }
        response_page.return_page(res, null, null, 0);
        l_message = 'status: 1, statusDescription: OK';
        logger.create_logFile(1, l_message);
    } catch (err) {
        console.error('General error: ' + err.message);
        l_message = k_method_name + ' ' + err.message;
        logger.create_logFile(-1, l_message);
        response_page.return_page(res, err.message, null, 2);
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error('Error closing db connection: ' + err.message);
                l_message = k_method_name + ' ' + err.message;
                logger.create_logFile(-1, l_message);
            }
        }
    }
}

async function getWeatherLocations(req, res){
// #swagger.tags = ['Accessing to the weather forecast locations data']
    /* #swagger.parameters['siteId'] = {
        in: 'query',
        type: "number",
        required: 'true',
        description: "Querying in order to access the weather forecast locations data"      
} */
    /* #swagger.security = [{
               "AUTHORIZATION": []
        }] */

let connection;
    var cities = "";
    const k_method_name = '[/getWeatherLocations]';

    try {
        connection = await oracledb.getConnection({
            user: process.env.USERORACLE,
            password: process.env.PASSORACLE,
            connectString: process.env.CONNECTSTRING
        });
        const results = await connection.execute(
            query.getWeatherLocations, {
                P_SITE_ID: {
                    type: oracledb.NUMBER,
                    dir: oracledb.BIND_IN,
                    val: parseInt(req.query.siteId)}
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
        response_page.return_page(res, cities, null, 0);
        l_message = 'status: 1, statusDescription: OK';
        logger.create_logFile(1, l_message);
    } catch (err) {
        console.error('General error: ' + err.message);
        l_message = k_method_name + ' ' + err.message;
        logger.create_logFile(-1, l_message);
        response_page.return_page(res, err.message, null, 2);
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error('Error closing db connection: ' + err.message);
                l_message = k_method_name + ' ' + err.message;
                logger.create_logFile(-1, l_message);
            }
        }
    }
}

async function generateToken(req, res){
    // #swagger.tags = ['Generate token for the weather forecast data']
    /* #swagger.parameters['Username and Password'] = {
        in: 'body',
        name: 'body',
        type: "object",
        required: 'true',
        description: "Generate token for the weather forecast /endpoints",
        schema: {
            $ref: "#definitions/generateToken"
        }   
} */
let connection;
let l_step = "[/generateToken]";
var l_message = '';
console.log(req.body);
try {
    connection = await oracledb.getConnection({
        user: process.env.USERORACLE,
        password: process.env.PASSORACLE,
        connectString: process.env.CONNECTSTRING
    });
    //Authentication
    //QUERY FOR FROM_NUMBER
    const results = await connection.execute(
        query.generateToken, {
            P_USERNAME: {
                type: oracledb.STRING,
                dir: oracledb.BIND_IN,
                val: req.body.username},
            P_PASSWORD: {
                type: oracledb.STRING,
                dir: oracledb.BIND_IN,
                val: req.body.password} 
        }
    );
    //Generate and encoding token
    //console.log(results.rows[0]['AUTH_CHECK']);
    let token = '';
    if (results.rows[0]['AUTH_CHECK'] == 1) {
        token = jwt.sign({ payload: req.body.username + req.body.password },
            process.env.JWTSECRETKEY, { expiresIn: "1h" }
        );
        response_page.return_page(res, token, null, 0);
        l_message = 'status: 1, statusDescription: OK';
        logger.create_logFile(1, l_message);
    } else {
        response_page.return_page(res, { status: -1, statusDescription: 'Wrong username or password' }, null, 3);
            l_message = 'Invalid Username or Password';
            logger.create_logFile(req, -1, l_message);
    }

    // controller.return_page(res, { status: 1, statusDescription: 'ok' }, null, 0);
    l_message = 'status: 1, statusDescription: OK';
    logger.create_logFile(1, l_message);
} catch (err) {
    // controller.return_page(res, { status: 0, statusDescription: err.message }, null, 2);
    console.error(err);
    l_message = l_step + ' ' + err.message;
    logger.create_logFile(-1, l_message);
} finally {
    if (connection) {
        try {
            await connection.close();
        } catch (err) {
            console.error(err);
            l_message = l_step + ' ' + err.message;
            logger.create_logFile(-1, l_message);
        }
    }
}

}

module.exports = {
    getWeatherData: getWeatherData,
    getWeatherLocations: getWeatherLocations,
    generateToken: generateToken
}

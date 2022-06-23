var express = require('express');
var router = express.Router();
var weatherForecast_controller = require('../controller/weatherForecast');
const auth = require('../../middleware/auth');

router.get('/getWeatherData', auth, weatherForecast_controller.getWeatherData);

router.get('/getWeatherLocations', auth, weatherForecast_controller.getWeatherLocations);

router.post('/generateToken', weatherForecast_controller.generateToken);

module.exports = router;
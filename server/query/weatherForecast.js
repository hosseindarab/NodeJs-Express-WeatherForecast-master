const getWeatherData_select_idRequest = `SELECT ID_REQUEST FROM WEATHER_SITE_OPERATIONS WHERE ID_SITE = :P_SITE_ID AND CITY = :P_CITY AND MANAGED = 0`;

const getWeatherData_select_response = `SELECT RESPONSE FROM WEATHER_REQUEST WHERE ID = :P_ID_REQUEST`;

const getWeatherData_update = `UPDATE WEATHER_SITE_OPERATIONS SET MANAGED = 1 WHERE ID_SITE = :P_SITE_ID AND ID_REQUEST = :P_ID_REQUEST`;

const getWeatherLocations = `SELECT CITY FROM WEATHER_SITE_CITIES WHERE ID_SITE = :P_SITE_ID`;

const generateToken = `select f_check_auth_weather(:P_USERNAME, :P_PASSWORD) auth_check from dual`;

module.exports = {
    getWeatherData_select_idRequest: getWeatherData_select_idRequest,
    getWeatherData_select_response: getWeatherData_select_response,
    getWeatherData_update: getWeatherData_update,
    getWeatherLocations: getWeatherLocations,
    generateToken: generateToken
}


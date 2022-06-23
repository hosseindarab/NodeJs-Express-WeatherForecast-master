module.exports = {
    create_logFile: create_logFile
};

function create_logFile(p_level = '', p_message = '') {
    const { transports, createLogger, format } = require('winston');
    const fs = require('fs');
    const path = require('path');
    const config = require('./config');
    const dateFormat = require("dateformat");
    var logDir = config.logpath;
    var date = new Date()
    var orario = new Date();
    var l_date = dateFormat(date, "yyyymmdd");
    var l_orario = dateFormat(orario, "HHMMss");

    if (!fs.existsSync(logDir)) {
        // Create the directory if it does not exist
        fs.mkdirSync(logDir);
    }
    var logger = createLogger({
        format: format.combine(
            format.timestamp(),
            format.json()
        ),
        transports: [
            new(transports.Console)({
                colorize: 'all'
            }),
            new(transports.File)({ filename: path.join(logDir, l_date + l_orario + '_twilio.log') })
        ]
    });
    logger.log({ level: 'info', site: process.env.SITE, application: process.env.APPLICATION, hostname: process.env.IP_ADDRESS, message: 'Connect String: ' + process.env.CONNECTSTRING + ' ' + 'Schema: ' + process.env.USERORACLE });
    if (p_level === 1) {
        logger.log({ level: 'info', message: '' + p_message });
    } else if (p_level === -1) {
        logger.log({ level: 'error', message: '' + p_message });
    } else {
        null;
    }
}
const jwt = require('jsonwebtoken');
var config = require('../config.js');
var xmlparser = require('express-xml-bodyparser');
const controller = require('../response_page');


module.exports = (req, res, next) => {
    xmlparser({ trim: false, explicitArray: false })
    Token = req.headers.authorization;
    // console.log('Token:' + Token);
    try {
        const decodedToken = jwt.verify(Token, process.env.JWTSECRETKEY);
        if (!decodedToken) {
            let message = 'Invalid Username or Password';
            logger.create_logFile(req, -1, message);
            //Otherwise everything is fine and user is authenticated. So, we pass execution.
        } else {
            next();
        }


    } catch (err) {
        res.set('Content-Type', 'text/xml');
        controller.return_page(res, { status: 1, statusDescription: err.message }, null, 3);
        logger.create_logFile(req, -1, `/auth: ${err.message}`)
    }
};
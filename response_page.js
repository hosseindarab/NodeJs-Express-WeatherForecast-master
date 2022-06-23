module.exports = {
    return_page: return_page
};

function return_page(res, json, replacer, requestValid) {

    var statusCode;
    var jsonFinale;

    switch (requestValid) {
        case 0:
            statusCode = 200;
            jsonFinale = {
                "status": "success",
                "data": json
            }
            break;
        case 1:
            statusCode = 400;
            jsonFinale = {
                "status": "fail",
                "data": json
            };
            break;
        case 2:
            statusCode = 500
            jsonFinale = {
                "status": "error",
                "message": json
            };
            break;
        case 3:
            statusCode = 401
            jsonFinale = {
                "status": "auth-error",
                "data": json
            }
            break;
    }

    res.contentType('application/json').status(statusCode).send(JSON.stringify(jsonFinale, replacer));

}
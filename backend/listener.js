/**
 * @desc Simple backend listener for URL monitor.
 * It provides "/monitor" for monitoring and "/ping" for keep alive APIs.
 * By default listens on 127.0.0.1:1234
 * 
 * @author Mihai Fantana
 **/

const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

/**
 * @desc Monitor API. Prints out the received URL from extension 
 **/
app.post('/monitor', (req, res, next) => {
    console.log('Url:', req.body.url);
    res.sendStatus(200);
    next();
});

/**
 * @desc Keepalive API 
 **/
app.get('/ping', (req, res, next) => {
    res.sendStatus(200);
    next();
});

/**
 * @desc Monitor API. Prints out the received URL from extension 
 **/
app.listen(1234, '127.0.0.1', function () {
    console.log('URL Monitor listening on port 1234!');
});


'use strict';

const express = require('express');
const os = require('os');
const uuid = require('uuid/v4');
const pino = require('pino');
const pinoExpress = require('express-pino-logger');
// run npm i <package name>
const logger = pino({
  level: process.env.LOG_LEVEL || 'info'
});
const loggerExpress = pinoExpress(logger);
var PropertiesReader = require('properties-reader');
var isAlive = true
// Constants
const PORT = process.env.PORT || 8080;
const HOST = '0.0.0.0';
const hostname = os.hostname();
const config = process.env.CONFIG;
var properties;
const version = PropertiesReader('config/version.ini').get('main.version');
const BACKEND_URL = process.env.BACKEND_URL || `http://localhost:${PORT}/version`
logger.info('BACKEND URL: ' + BACKEND_URL);

// App
const app = express();
// set log
app.use(loggerExpress);

// Main Function
app.get('/', (req, res) => {
  if (!isAlive)
    res.status(503).send(
      `Backend version:${version},Response:503, Message: Backend is stopped`
    );
  else {
    // var protocol = 'http'
    // if (BACKEND_URL.startsWith('https')) protocol = 'https';
    //   var https = require(protocol);
    //   var client = https.get(BACKEND_URL, (resp) => {
    //   logger.info(`${BACKEND_URL} return ${resp.statusCode}`);
    //   res.status(resp.statusCode).send(
    //     `Frontend version:${version},Response:${resp.statusCode},Host:${hostname} ==> [ Backend ]`
    //   );
    // });
    var protocol = 'http'
    if (BACKEND_URL.startsWith('https')) protocol = 'https';
    const https = require(protocol);
    const client = https.get(BACKEND_URL, (resp) => {
      logger.info(`${BACKEND_URL} return ${resp.statusCode}`);
      var body='';
      resp.on('data', function (chunk) {
        body += chunk;
        
      });
      res.status(resp.statusCode).send(
        `Frontend version: ${version} => [Backend: ${BACKEND_URL}, Response: ${resp.statusCode}, Body: ${body}]`
      );
      res.on('end', function() {
        logger.info(`End`);
      });
    });
    // var protocol = 'http'
    // if (BACKEND_URL.startsWith('https')) protocol = 'https';
    // const https = require(protocol);
    // const client = https.get(BACKEND_URL, (resp) => {
    //   logger.info(`${BACKEND_URL} return ${resp.statusCode}`);
    //   resp.on('data', function (chunk) {
    //     logger.info(`Process for response`);
    //     res.status(resp.statusCode).send(
    //       `Frontend version:${version} Response:${resp.statusCode} => [${chunk}]`
    //     );
    //   });
    // });
    client.on('error', error => {
      logger.error(error);
      res.status(503).send(
        `Backend version:${version},Response:503,Host:${hostname},${error}`
      );
    });
    client.end();
  }
});

app.get('/stop', (req, res) => {
  isAlive = false;
  res.status(200).send(
    `Frontend version:${version} Response:200 Message:set ${hostname} is stopped`
  );
  logger.info('App is stopped working');
});

app.get('/version', (req, res) => {
  res.status(200).send(
    `Frontend version:${version} Response:200 Meessage:check version`
  );
  logger.info('App is stopped working');
});

app.get('/start', (req, res) => {
  isAlive = true;
  res.status(200).send(
    `Frontend version:${version} Response:200 Message:set ${hostname} is started`
  );
  logger.info('App is started');
});

app.get('/status', (req, res) => {
  var status = 200;
  var message = 'OK';
  if (isAlive == false) {
    status = 503;
    message = 'Unavailable';
    logger.info('App status = Not Ready');
  } else {
    logger.info('App status = Ready');
  }
  res.status(status).send(
    `Frontend version:${version} Response:200 Message:${message}`
  );
});

app.get('/version', (req, res) => {
  logger.info("Check version");
  res.status(200).send(
    `Backend version:${version},Response:200`
  );
});

app.listen(PORT, HOST);
logger.info(`Running on http://${HOST}:${PORT}`);

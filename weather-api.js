// weather-api
// microservice in nodejs
// v 0.1.8

"use strict";

const http   = require( 'http' );
const moment = require( 'moment' );
const config = require( './config/application.js' );

const server = http.createServer( ( req, res ) => {

    // store the request information
    const headers    = req.headers;
    const connection = req.connection;
    const method     = req.method;
    const url        = req.url;
    const api_key    = headers.api_key;

    // validate the api key
    // return 401 and error if api_key is missing or doesn't match
    if ( api_key !== config.api_key ) {
        res.statusCode = 401;

        res.setHeader( 'Content-Type', 'text/plain' );

        res.write( 'unauthorized\n' );
        res.end();

        log_request(
            get_formatted_timestamp(),
            connection.remoteAddress,
            method,
            url,
            res.statusCode
        );

        return;
    }

    // validate the method
    // return 405 and Allow header if the request was anything but GET
    if ( method !== 'GET' ) {
        res.statusCode = 405;

        res.setHeader( 'Allow', 'GET' );
        res.setHeader( 'Content-Type', 'text/plain' );

        res.write( method + ' is not allowed\n' );
        res.end();

        log_request(
            get_formatted_timestamp(),
            connection.remoteAddress,
            method,
            url,
            res.statusCode
        );

        return;
    }

    // validate the url
    // return 404 if not /weather/[temperature|humidity]
    let [ slash, endpoint, parameter, ...extra ] = url.split( '/' );

    let parameter_match = /^temperature$|^humidity$/;

    if ( endpoint !== 'weather' || !parameter_match.test( parameter ) || extra.length >= 1 ) {
        res.statusCode = 404;

        res.setHeader( 'Content-Type', 'text/plain' );

        res.write( url + ' is not a known route\n' );
        res.end();

        log_request(
            get_formatted_timestamp(),
            connection.remoteAddress,
            method,
            url,
            res.statusCode
        );

        return;
    }

    // TODO: read the sensor data
    // looks like if we're going to use the DHT22, we're probably best using the pigpio library.
    // to use the DHT22 sensor, we need to set HIGH, detect the state change, then digital read.
    // also, we should to consider removing individual calls for getting just temp and humidity.
    // since the sensor returns everything all in one call anyway, it might be more efficient to
    // have one endpoint returning two key value pairs.
    // or, perhaps return both if /weather and individual if asked /weather/temperature
    let data        = read_pin( config.pin );
    let data_return = {};

    if ( parameter === 'temperature' ) {
        let temperature = data.temperature;

        data_return = { 'temperature' : temperature };
    }
    else if ( parameter === 'humidity' )  {
        let humidity = data.humidity;

        data_return = { 'humidity' : humidity };
    }

    // the request was good
    // return to the caller
    res.statusCode = 200;
    res.setHeader( 'Content-Type', 'application/json' );

    res.write( JSON.stringify( data_return ) );
    res.end();

    log_request(
        get_formatted_timestamp(),
        connection.remoteAddress,
        method,
        url,
        res.statusCode
    );

    return;
});

server.listen( config.port, config.hostname, () => {
    console.log( get_formatted_timestamp() + ' [info] ' + 'weather-api server started' );
    console.log( get_formatted_timestamp() + ' [info] ' + `serving: ${config.hostname}:${config.port}` );
});

function get_formatted_timestamp () {
    let timestamp = moment().format( 'MMDDYYYY-HHmmss' );

    return '[' + timestamp + ']';
}

function log_request ( timestamp, remoteaddress, method, url, statuscode ) {
    console.log(
        timestamp + ' ' +
        remoteaddress + ' ' +
        method + ' ' +
        url + ' ' +
        statuscode
    );

    return;
}

function read_pin ( pin ) {
    let data = {};

    if ( config.environment === 'development' ) {
        data = {
            temperature : Math.floor( ( Math.random() * 100 ) + 1 ),
            humidity    : Math.floor( ( Math.random() * 100 ) + 1 )
        };
    }
    else {
        // TODO: read pin from gpio, store, and return
        data = {
            temperature : 42,
            humidity    : 42
        };
    }

    return data;
}
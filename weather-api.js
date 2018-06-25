// weather-api
// microservice in nodejs
// v 0.1.9

"use strict";

const http   = require( 'http' );
const moment = require( 'moment' );
const sensor = require( 'node-dht-sensor' );
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

    // read the sensor data
    // using the node-dht-sensor node module, which uses the bcm2835 library.
    // still testing this out, and may very well re-roll the functionality to remove the
    // additional dependency.
    let data        = read_pin( config.dht, config.pin );
    let data_return = {};

    // TODO:
    // convert this to allow for just /weather to return both
    // return 500 with error string if read_pin fails
    if ( parameter === 'temperature' ) {
        data_return = { 'temperature' : data.temperature };
    }
    else if ( parameter === 'humidity' )  {
        data_return = { 'humidity' : data.humidity };
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

function read_pin ( dht, pin ) {
    let temperature = {};
    let humidity    = {};

    if ( config.environment === 'production' ) {
        sensor.read( dht, pin, function( err, temperature, humidity ) {
            if ( !err ) {
                temperature = ( temperature.toFixed( 1 ) * 9 / 5 ) + 32,
                humidity    = humidity.toFixed( 1 )
            }
            else {
                temperature = 'err';
                humidity    = 'err';
            }
        });
    }
    else {
        temperature = 'devel';
        humidity    = 'devel';
    }

    let data = {
        temperature : temperature,
        humidity    : humidity
    };

    return data;
}

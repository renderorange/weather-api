// weather-api
// simple API in nodejs

"use strict";

const version = '0.1.11';

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
    // return 401 and error if api_key is missing from their request
    // or doesn't match
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
    // return 404 if the request is not for /weather/[temperature|humidity]/
    // this allows for /weather on it's own, with or without a trailing slash
    // as well as /weather/temperature or /weather/humidity, with or without a trailing slash
    let [ space, endpoint, parameter, extra ] = url.split( '/' );

    let parameter_match = /^temperature$|^humidity$/;

    // if endpoint is anything but weather
    if ( endpoint !== 'weather'
         // or if parameter is defined and is not empty and doesn't match either temperature or humidity
         || ( parameter !== undefined && ( parameter.length != 0 && !parameter_match.test( parameter ) ) )
         // or if there's anything after parameter which isn't empty
         || ( extra     !== undefined &&       extra.length != 0 ) ) {

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
    let data = read_pin( config.dht, config.pin );

    // return 500 if there was an issue reading
    // undef indicates error from the read_pin function
    if ( data === undefined ) {
        res.statusCode = 500;

        res.setHeader( 'Content-Type', 'text/plain' );

        res.write( 'unknown error\n' );
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

    // format the data return based on the requested route
    let data_return = {};

    // test to allow for both /weather and /weather/
    // the split for the url will make parameter defined, but with empty value
    // if the user requests weather with a trailing slash
    if ( parameter === undefined || parameter.length === 0 ) {
        data_return = { 'temperature' : data.temperature, 'humidity' : data.humidity };
    }
    else if ( parameter === 'temperature' ) {
        data_return = { 'temperature' : data.temperature };
    }
    else if ( parameter === 'humidity' )  {
        data_return = { 'humidity' : data.humidity };
    }

    // the request was good
    // return the requested information to the user
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

// before starting the server, display the initial startup message
console.log( get_formatted_timestamp() + ' [info] weather-api - version ' + version );

// and verify the configuration
verify_config_values( function ( err ) {
    if ( err ) {
        console.log(
            get_formatted_timestamp() + ' [error] config verification failed\n' +
            get_formatted_timestamp() + ' [error] ' + err.message + '\n' +
            get_formatted_timestamp() + ' [error] exiting'
        );

        process.exit( 1 );
    }
});

// now start the server, listening on the configured port and address
server.listen( config.port, config.address, () => {
    console.log(
        get_formatted_timestamp() + ' [info] server started\n' +
        get_formatted_timestamp() + ' [info] environment: ' + config.environment + '\n' +
        get_formatted_timestamp() + ' [info] serving: ' + config.address + ':' + config.port
    );
});

function get_formatted_timestamp () {
    let timestamp = moment().format( 'MMDDYYYY-HHmmss' );

    return '[' + timestamp + ']';
}

function verify_config_values ( done ) {

    // valid config keys and values
    let key_match = /^address$|^port$|^api_key$|^environment$|^dht$|^pin$/;

    let valid_config = {
        address     : /^[a-z0-9\.]*$/,
        port        : /^\d*$/,
        api_key     : /^\w{16,40}$/,
        environment : /^production$|^development$/,
        dht         : /^11$|^22$/,
        pin         : /^\d*$/
    };

    // verify the keys and values from our config
    for ( let key in config ) {

        // TODO: verify the config.key exists against our valid_config set
        if ( !key_match.test( key ) ) {
            return done ( Error ( 'config.' + key + ': ' + key + ' is not a valid key name' ) )
        }

        // since we know the key is valid, test it's value 
        let value_match = valid_config[ key ];

        if ( !value_match.test( config[ key ] ) ) {
            return done ( Error ( 'config.' + key + ': ' + config[ key ] + ' is not a valid value' ) )
        }
    }

    return;
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

    // read the sensor if production
    if ( config.environment === 'production' ) {

        sensor.read( dht, pin, function( err, temperature, humidity ) {

            // log the exception and return undef to the caller
            // the caller tests for undef and returns 500 to the user if so
            if ( err ) {
                console.log( get_formatted_timestamp() + ' [error] ' + err.message );

                return;
            }

            // if there wasn't an error, format and return the data structure
            else {
                let temperature = ( temperature.toFixed( 1 ) * 9 / 5 ) + 32;
                let humidity    = humidity.toFixed( 1 );

                return { 'temperature' : temperature, 'humidity' : humidity };
            }
        });
    }

    // return some dummy data if not production
    else {
        return { 'temperature' : 'devel', 'humidity' : 'devel' };
    }
}

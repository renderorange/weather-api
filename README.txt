# NAME

weather-api - simple API in nodejs

# DESCRIPTION

This project provides a simple API, written in nodejs, which serves temperature and humidity data from the Raspberry Pi.

Supported sensors are the DHT11 or DHT22 (AM2302) read using the bcm2835 C library.

# SYNOPSIS

    server ~/weather-api $ nodejs weather-api.js 
    [06152018-233738] [info] weather-api - version 0.1.10
    [06152018-233738] [info] environment: development
    [06152018-233738] [info] serving: 0.0.0.0:3000
    [06152018-233948] 10.0.0.103 GET /weather 200

    laptop ~ $ curl -X GET -H 'API_KEY: 1234567890qwerty' server:3000/weather
    {
       "temperature" : 85,
       "humidity" : 65
    }

# ENDPOINTS

The API is served over port 3000 and bound to all interfaces by default, but can be configured to a specific interface or port (see the 'CONFIGURATION' section below).

## /weather

### METHODS

#### GET

This API is a read-only resource; GET is the only allowed method.

All other methods requested to the API will return exceptions (see the 'RESPONSES' section below).

### PARAMETERS

The parameters to the /weather endpoint define what resource you want to read.

#### temperature

Provides the temperature reading in F.

    http://server:3000/weather/temperature

    {
       "temperature" : 85
    }


#### humidity

Provides the relative humidity reading in percent.

    http://server:3000/weather/humidity

    {
       "humidity" : 65
    }

### RETURNS

A JSON datastructure containing key value pairs.

    {
       "temperature" : 85,
       "humidity" : 65
    }

#### [temperature|humidity]

The value read from the requested resource.

# RESPONSES

The following are the responses the API may return.

## 401 (Unauthorized)

The API_KEY header was not found, or the key didn't match.

The exception string, 'unauthorized', with the 401 response code, is returned.

    # request without the API_KEY header
    $ curl -sD - -X GET server:3000/weather/temperature
    HTTP/1.1 401 Unauthorized
    Content-Type: text/plain
    Date: Tue, 19 Jun 2018 18:51:43 GMT
    Connection: keep-alive
    Transfer-Encoding: chunked

    unauthorized

## 405 (Method not allowed)

The method requested was something other than GET.

The exception string, 'METHOD is not allowed', with the 405 response code, is returned.  Additionally, the Allow header is set indicating only GET.

    # request method other than GET
    $ curl -sD - -X POST -H 'API_KEY: 1234567890qwerty' server:3000/weather/temperature
    HTTP/1.1 405 Method Not Allowed
    Allow: GET
    Content-Type: text/plain
    Date: Tue, 19 Jun 2018 18:54:18 GMT
    Connection: keep-alive
    Transfer-Encoding: chunked

    POST is not allowed

## 404 (Not Found)

The requested route was not known.

The exception string, 'URL is not a known route', with the 404 response code, is returned.

    # request an unknown route
    $ curl -sD - -X GET -H 'API_KEY: 1234567890qwerty' server:3000/paper
    HTTP/1.1 404 Not Found
    Content-Type: text/plain
    Date: Tue, 19 Jun 2018 19:12:14 GMT
    Connection: keep-alive
    Transfer-Encoding: chunked

    /paper is not a known route

    # a parameter to an unknown route
    $ curl -sD - -X GET -H 'API_KEY: 1234567890qwerty' server:3000/weather/forecast
    HTTP/1.1 404 Not Found
    Content-Type: text/plain
    Date: Tue, 19 Jun 2018 19:10:17 GMT
    Connection: keep-alive
    Transfer-Encoding: chunked

    /weather/forecast is not a known route

    # or extra parameters to a known route
    $ curl -sD - -X GET -H 'API_KEY: 1234567890qwerty' server:3000/weather/temperature?test=1
    HTTP/1.1 404 Not Found
    Content-Type: text/plain
    Date: Tue, 19 Jun 2018 19:13:33 GMT
    Connection: keep-alive
    Transfer-Encoding: chunked

    /weather/temperature?test=1 is not a known route

## 500 (Internal Server Error)

There was an issue while reading the sensor.

The exception string, 'unknown error', with the 500 response code, is returned.

    $ curl -s -D - -X GET -H 'API_KEY: 1234567890qwerty' server:3000/weather/temperature
    HTTP/1.1 500 Internal Server Error
    Content-Type: text/plain
    Date: Tue, 17 Jun 2018 00:00:18 GMT
    Connection: keep-alive
    Transfer-Encoding: chunked

    unknown error

## 200 (OK)

Everything in the request was good and there were no issues on the backend.

The JSON data structure, with requested resource and 200 response code, is returned.

    # request meeting all criteria
    $ curl -sD - -X GET -H 'API_KEY: 1234567890qwerty' server:3000/weather
    HTTP/1.1 200 OK
    Content-Type: application/json
    Date: Tue, 19 Jun 2018 19:17:19 GMT
    Connection: keep-alive
    Transfer-Encoding: chunked

    {"temperature":85,"humidity":65}

# LOGGING

The API outputs timestamped startup info to stdout, as well as request, response, and error details.

    [06162018-002138] [info] weather-api server started - verison 0.1.10
    [06162018-002138] [info] environment: development
    [06162018-002138] [info] serving: 0.0.0.0:3000
    [06162018-002156] 10.0.0.103 GET /weather/humidity 401
    [06162018-002218] 10.0.0.103 GET /weather/humidity 200
    [06162018-002851] 10.0.0.103 GET /weather/notaresource 404
    [06162018-003000] 10.0.0.103 POST /weather/temperature 405
    [06172018-000018] 10.0.0.103 GET /weather/temperature 500
    [06172018-000020] [error] Error: failed to read sensor

# CONFIGURATION

The API requires configuration settings which are stored and defined within the ./config/application.js file located within the project's base dir.  The config object is exported and accessed within weather-api.js.

    # ./config/application.js
    config.interface   = '0.0.0.0';
    config.port        = 3000;
    config.api_key     = '1234567890qwerty';
    config.environment = 'development';
    config.dht         = 22;
    config.pin         = 4;

The key value pairs within the configuration are verified on startup, and will fail to start if either the names or values aren't correct or within range.

## config.interface

The interface on the Raspberry Pi to bind to.

Verification on startup allows for both ip addresses and hostnames.

## config.port

The port to listen on.

Verification on startup allows for digits only.

## config.api_key

The authorization header string to validate against.

Verification on startup allows for case-insensitive alpha-numeric characters, and requires between a 16 and 40 character length string.

## config.environment

Whether the API is running on development or production.  If development, values of 'devel' will be returned instead of reading the values via GPIO.

Verification requires either 'development' or 'production' as values.

## config.dht

The temperature/humidity sensor being used.  Supported config values are:

### 11

If using the DHT11.

### 22

If using the DHT22 (or AM2302).

## config.pin

The GPIO pin the DHT sensor is connected to.

Verification on startup requires digits only.

# INSTALLATION

Before installing the module dependencies for this project, the bcm2835 C library will need to be installed.

First, ensure you have build-essential and make installed so you can compile the library.

    # apt-get install build-essential make

Download the bcm2835 library to the desired location.  My personal location for source code is /usr/local/src/, and is used in the example below.  Also, ensure you have the latest version; the link below is for v1.56 which might not be the latest as you're reading this.

    # cd /usr/local/src/
    /usr/local/src # wget http://www.airspayce.com/mikem/bcm2835/bcm2835-1.56.tar.gz
    /usr/local/src # tar zxvf bcm2835-1.56.tar.gz

Now, configure, make, test, and install the library.

    /usr/local/src # cd bcm2835-1.56/
    /usr/local/src/bcm2835-1.56 # ./configure
    /usr/local/src/bcm2835-1.56 # make
    /usr/local/src/bcm2835-1.56 # make check
    /usr/local/src/bcm2835-1.56 # make install

If you receive the following error when running the API through nodejs:

    bcm2835_init: Unable to open /dev/gpiomem: Permission denied

You're probably running the API as an un-privileged user (you should be), which isn't the 'pi' user.  You will need to add the user to the gpio group so it can access gpiomem (replace apiuser with the user you're running nodejs as).

    # adduser apiuser gpio

# DEPENDENCIES

This project is built using nodejs and utilizes deconstructing assignment from ES6.  Because of this, the latest (or newer) nodejs is recommended.

The http library is used but is included through nodejs core.  No additional installation is required.

Additionally, the moment and node-dht-sensor libraries are also used.  Both are defined in the package.json file within the project's base dir and can be installed via npm.

    server ~/weather-api $ npm install

Of note, the node-dht-sensor library requires the bcm2835 C library installed to the Raspberry Pi before installing through npm, else installation will fail.  (see the 'INSTALLATION' section above).

# AUTHOR

Blaine Motsinger <blaine@renderorange.com>

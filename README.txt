# NAME

weather-api - microservice in nodejs

# DESCRIPTION

This project provides a simple API, written in nodejs, which reads and serves sensor data from the Raspberry Pi.

# SYNOPSIS

    server ~ $ nodejs weather-api.js 
    [06152018-233738] [info] weather-api server started
    [06152018-233738] [info] serving: 0.0.0.0:3000
    [06152018-233948] 10.0.0.103 GET /weather/temperature 200

    laptop ~ $ curl -X GET -H 'API_KEY: 1234qwerty' server:3000/weather/temperature
    {
       "temperature" : 85
    }

# ENDPOINTS

The API is served over port 3000 and bound to all interfaces, but can be configured to a specific interface or port (more about that in the 'CONFIGURATION' section below).

## /weather

### METHODS

#### GET

This API is a read-only resource; GET is the only allowed method.

All other methods requested to the API will return exceptions (more about that in the 'RESPONSES' section below).

### PARAMETERS

The parameters to the /weather endpoint define what resource you want to read.

#### temperature

Provides the temperature reading in F.

    http://server:3000/weather/temperature

#### humidity

Provides the relative humidity reading in percent.

    http://server:3000/weather/humidity

#### pressure

Provides the barometric pressure reading.

    http://server:3000/weather/pressure

### RETURNS

A JSON datastructure containing one key value pair.

    {
       "temperature" : 85
    }

#### [temperature|humidity|pressure]

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
    $ curl -sD - -X POST -H 'API_KEY: 1234qwerty' server:3000/weather/temperature
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
    $ curl -sD - -X GET -H 'API_KEY: 1234qwerty' server:3000/paper
    HTTP/1.1 404 Not Found
    Content-Type: text/plain
    Date: Tue, 19 Jun 2018 19:12:14 GMT
    Connection: keep-alive
    Transfer-Encoding: chunked

    /paper is not a known route

    # a parameter to an unknown route
    $ curl -sD - -X GET -H 'API_KEY: 1234qwerty' server:3000/weather/forecast
    HTTP/1.1 404 Not Found
    Content-Type: text/plain
    Date: Tue, 19 Jun 2018 19:10:17 GMT
    Connection: keep-alive
    Transfer-Encoding: chunked

    /weather/forecast is not a known route

    # or extra parameters to a known route
    $ curl -sD - -X GET -H 'API_KEY: 1234qwerty' server:3000/weather/temperature?test=1
    HTTP/1.1 404 Not Found
    Content-Type: text/plain
    Date: Tue, 19 Jun 2018 19:13:33 GMT
    Connection: keep-alive
    Transfer-Encoding: chunked

    /weather/temperature?test=1 is not a known route

## 200 (ok)

Everything in the request was good and there were no issues on the backend.

The JSON data structure, with requested resource and 200 response code, is returned.

    # request meeting all criteria
    $ curl -sD - -X GET -H 'API_KEY: 1234qwerty' server:3000/weather/temperature
    HTTP/1.1 200 OK
    Content-Type: application/json
    Date: Tue, 19 Jun 2018 19:17:19 GMT
    Connection: keep-alive
    Transfer-Encoding: chunked

    {"temperature":85}

# LOGGING

The API outputs timestamped startup info to stdout, as well as request and response details.

    [06162018-002138] [info] weather-api server started
    [06162018-002138] [info] serving: 0.0.0.0:3000
    [06162018-002156] 10.0.0.103 GET /weather/humidity 401
    [06162018-002218] 10.0.0.103 GET /weather/humidity 200
    [06162018-002851] 10.0.0.103 GET /weather/notaresource 404
    [06162018-003000] 10.0.0.103 POST /weather/temperature 405

# CONFIGURATION

The API requires configuration settings which are stored and defined within the ./config/application.js file located within the project's base dir.  The config object is exported and accessed within weather-api.js.

    # ./config/application.js
    config.hostname = '0.0.0.0';
    config.port     = 3000;
    config.api_key  = '1234qwerty';

## config.hostname

The address to bind to.

## config.port

The port to listen on.

## config.api_key

The authorization header string to validate against.

# DEPENDENCIES

This project is built using nodejs and utilizes both deconstructing assignment and template literals from ES6.  Because of this, the latest (or newer) nodejs is recommended.

The http library is used but is included through nodejs core.  No additional installation is required.

The moment library is also used.  Moment is defined in the package.json file within the project's base dir, and can be installed via npm.

    $ npm install

# AUTHOR

Blaine Motsinger <blaine@renderorange.com>

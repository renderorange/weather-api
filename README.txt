# NAME

weather api - microservice in nodejs

# DESCRIPTION

This project provides a simple API, written in nodejs, which reads and serves sensor data from the Raspberry Pi.

# SYNOPSIS

    server ~ $ nodejs weather.js 
    [06152018-233738] [info] weather api server started
    [06152018-233738] [info] serving: 0.0.0.0:3000
    [06152018-233948] 10.0.0.103 GET /weather/temperature 200

    laptop ~ $ curl -X GET -H 'API_KEY: 1234qwerty' server:3000/weather/temperature
    {
       "last" : 1496113521,
       "temperature" : 85
    }

# ENDPOINTS

The API is served over port 3000 and bound to all interfaces, but can be configured to a specific interface or port (more about that in the CONFIGURATION section below).

## /weather

### METHODS

#### GET

This API is a read-only resource; GET is the only allowed method.

All other methods requested to the API will return exceptions (more about that in the EXCEPTIONS section below).

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

A JSON datastructure containing two key value pairs.

    {
       "last" : 1496113521,
       "temperature" : 85
    }

#### last

Unix timestamp representing the mtime of the last reading.

#### [temperature|humidity|pressure]

The value read from the requested resource.

# RESPONSE CODES

The following are the response codes the API may return.

## 401 (Unauthorized)

The API_KEY header was not found, or the key didn't match.

## 405 (Method not allowed)

The method requested was something other than GET.

## 404 (Not Found)

The requested route was not known.

## 200 (ok)

Everything in the request was good and there were no issues on the backend.

# LOGGING

The API outputs timestamped startup info to stdout, as well as request details and response, in similar fashion to Apache's access-log.

    [06162018-002138] [info] weather api server started
    [06162018-002138] [info] serving: 0.0.0.0:3000
    [06162018-002156] 10.0.0.103 GET /weather/humidity 401
    [06162018-002218] 10.0.0.103 GET /weather/humidity 200
    [06162018-002851] 10.0.0.103 GET /weather/notaresource 404
    [06162018-003000] 10.0.0.103 POST /weather/temperature 405

# CONFIGURATION

The API requires configuration settings which are stored and defined within the ./config/application.js file located within the project's base dir.  The config object is exported and accessed within weather.js.

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

The moment library is also used and must be installed via npm (or whatever other way you'd prefer).

# AUTHOR

Blaine Motsinger
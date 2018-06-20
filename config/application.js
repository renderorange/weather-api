// weather-api config

let config = {};

config.hostname    = '0.0.0.0';
config.port        = 3000;
config.api_key     = '1234qwerty';
config.environment = 'development';

// NOTE: these aren't real pin location
// and require configuration with your Pi.
config.pins        = {
    'temperature' : 3,
    'humidity'    : 4,
    'pressure'    : 5
};

module.exports = config;
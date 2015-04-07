var http = require('http');
var httpProxy = require('http-proxy');
var exec = require('child_process').exec;
var request = require("request");
var redis = require('redis');
var config = require('./env.json');

var CURRENT = 'BLUE';

REDISCLIENTS = {
    "GREEN": redis.createClient(config['GREEN']['REDIS'], '127.0.0.1', {}),
    "BLUE": redis.createClient(config['BLUE']['REDIS'], '127.0.0.1', {})
}

server = http.createServer().listen(5000);
proxy = httpProxy.createProxyServer();

exec('forever --watchDirectory deploy/blue-www start app/foreman start -p 5001');
exec('forever --watchDirectory deploy/green-www start app/foreman start -p 5002');

server.on('request', function(req, res) {
    if (req.url === '/switch') {
        switchTo(config['INVERSE'][CURRENT]);
        res.statusCode = 200;
        res.write('Data Migration & Environment switching done successfully. The current environment is ' + CURRENT);
        res.end();
        return;
    } 
    if (req.url === '/website' && config['MIRROR'] === 1) {
        var inverse = config['INVERSE'][CURRENT]
        req.pipe(request.post( config[inverse]['ENV']+ '/website'));
        console.log("Data written on both instances")
    }

    proxy.web( req, res, {target: config[CURRENT]['ENV'] } );  
});


function switchTo(newEnv) {
    REDISCLIENTS[config["INVERSE"][newEnv]].lrange("website:newest", 0, -1, function(_, websites) {
        websites.forEach(function(data) {
            REDISCLIENTS[newEnv].lpush("website:newest", data);
        });
    });
    CURRENT = newEnv;
}
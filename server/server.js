"use strict";
var net = require('net');
var path = require('path');
var Hapi = require('hapi');
var Good = require('good');
var Joi = require('joi');

var config = require('../config');

var server = new Hapi.Server('0.0.0.0', process.env.port || 8080, {
	cors: true,
	validation: {
		abortEarly: false,
		allowUnknown: true
	}
});

server.route({
	method: 'GET',
	path: '/{static*}',
	handler: {
		directory: {
			path: path.join(__dirname, '/public'),
			lookupCompressed: true,
			listing: false,
			index: true
		}
	}
});

server.pack.register({
	plugin: Good,
	options: {
		reporters: [{
			reporter: require('good-console'),
			args: [{log: '*', request: '*'}]
		}]
	}
}, function (err) {
	if (err) throw err; // something bad happened loading the plugin
	server.start(function () {
		server.log('info', 'Server running at: ' + server.info.uri);
	});
});

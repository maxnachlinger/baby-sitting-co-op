"use strict";
var net = require('net');
var path = require('path');
var Hapi = require('hapi');
var Good = require('good');
var Joi = require('joi');

var config = require('./common/config');

var server = new Hapi.Server('0.0.0.0', process.env.port || config.serverPort, {
	cors: true,
	validation: {
		abortEarly: false,
		allowUnknown: true
	}
});

server.route({
	method: 'GET',
	path: '/member',
	handler: require('./handlers/members')
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

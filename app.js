"use strict";
var path = require('path');
var Hapi = require('hapi');
var Good = require('good');
var Joi = require('joi');
var _ = require('lodash');

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
server.route({
	method: 'GET',
	path: '/member/points',
	handler: require('./handlers/membersPoints')
});
server.route({
	method: 'GET',
	path: '/member/productivityRanking',
	handler: require('./handlers/membersProductivity')
});
server.route({
	method: 'GET',
	path: '/member/{memberId}',
	config: {
		validate: {
			params: {
				memberId: Joi.string().required()
			}
		},
		handler: require('./handlers/getMember')
	}
});

server.route({
	method: 'GET',
	path: '/member/{memberId}/{facet}',
	config: {
		validate: {
			params: {
				memberId: Joi.string().required(),
				facet: Joi.string().required().allow(['points','sittersUsed','totalUniqueSittersUsed','parentsSatFor',
					'totalUniqueParentsSatFor', 'lastSat','productivityRanking','recommendedSitters'])
			}
		},
		handler: require('./handlers/getMember')
	}
});

server.pack.register([{
	plugin: Good,
	options: {
		reporters: [{
			reporter: require('good-console'),
			args: [{log: '*', request: '*'}]
		}]
	}
}, {
	plugin: require('./plugins/levelConnectionPlugin'),
	options: {
		manifestPath: path.resolve('./manifest.json'),
		dbPath: path.resolve('./db.level'),
		levelOptions: config.levelOptions,
		subLevels: _.values(config.subLevels),
		levelPort: config.levelPort
	}
}], function (err) {
	if (err) throw err; // something bad happened loading the plugin

	server.start(function () {
		server.log('info', 'Server running at: ' + server.info.uri);
	});
});

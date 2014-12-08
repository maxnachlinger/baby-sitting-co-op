var path = require('path');
var net = require('net');
var multilevel = require('multilevel');
var level = require('level');
var sublevel = require('level-sublevel');
var Hoek = require('hoek');

var _plugin = {
	serverSocket: null
};

_plugin.defaults = {
	manifestPath: path.resolve(__dirname + '/../manifest.json'),
	dbPath: path.resolve(__dirname + '/../../db.level'),
	levelOptions: {
		createIfMissing: true,
		errorIfExists: false,
		valueEncoding: 'json'
	},
	subLevels: [],
	levelPort: 3000
};

_plugin.register = function (server, options, next) {
	var settings = Hoek.applyToDefaults(_plugin.defaults, options);

	var db = sublevel(level(settings.dbPath, settings.levelOptions));
	for (var i = 0, c = settings.subLevels.length; i < c; i++) {
		db.sublevel(settings.subLevels[i]);
	}

	multilevel.writeManifest(db, settings.manifestPath);
	var manifest = require(settings.manifestPath);

	// start up the db server
	net.createServer(function (con) {
		_plugin.serverSocket = con;
		_plugin.serverSocket.pipe(multilevel.server(db)).pipe(_plugin.serverSocket);
	}).listen(settings.levelPort, function (err) {
		if (err) return next(err);

		server.ext('onPreHandler', function (request, extNext) {

			request.getLevelConnection = function (cb) {
				var client = multilevel.client(manifest);
				var clientSocket = net.createConnection(settings.levelPort);
				clientSocket.pipe(client.createRpcStream()).pipe(clientSocket);

				request._levelConnection = {
					client: client,
					clientSocket: clientSocket,
					close: function () {
						if (!request._levelConnection) return;

						request._levelConnection.clientSocket.end();
						request._levelConnection.client.close();
					}
				};
				cb(null, request._levelConnection.client);
			};

			extNext();
		});

		server.events.on('response', function (request) {
			if(request._levelConnection)
				request._levelConnection.close();
		});

		next();
	});
};

_plugin.register.attributes = {
	name: 'hapijs-level-connection-plugin',
	version: '0.0.1'
};

module.exports = _plugin;

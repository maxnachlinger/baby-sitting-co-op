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

	net.createServer(function (con) {
		_plugin.serverSocket = con;
		_plugin.serverSocket.pipe(multilevel.server(db)).pipe(_plugin.serverSocket);
	}).listen(settings.levelPort, function (err) {
		if (err) return next(err);

		server.ext('onPreHandler', function (request, extNext) {
			request.getLevelConnection = function (cb) {
				var client = multilevel.client(require(settings.manifestPath));
				var clientSocket = net.createConnection(settings.levelPort);
				clientSocket.pipe(client.createRpcStream()).pipe(clientSocket);

				request.levelConnection = {
					client: client,
					clientSocket: clientSocket
				};

				cb(null, request.levelConnection.client);
			};

			request.closeLevelConnection = function () {
				if (!request.levelConnection) return;

				request.levelConnection.clientSocket.destroy();
				request.levelConnection.client.close();
			};
			extNext();
		});

		server.events.on('response', function (request) {
			if(request.closeLevelConnection)
				request.closeLevelConnection();
		});

		next();
	});
};

_plugin.register.attributes = {
	name: 'hapijs-level-connection-plugin',
	version: '0.0.1'
};

module.exports = _plugin;

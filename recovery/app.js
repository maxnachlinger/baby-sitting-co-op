"use strict";
var path = require('path');
var _ = require('lodash');
var async = require('async');
var VError = require('verror');
var level = require('level');
var config = require('../config');
var readTransactions = require('./readTransactions');
var generateStats = require('./generateStats');
var domain = require('domain');
var sublevel = require('level-sublevel')

var serverDomain = domain.create();
serverDomain.on('error', function (err) {
	console.error(err && err.stack);
	process.exit(1);
});
serverDomain.run(run);

var db = sublevel(level(config.dbPath, {
	createIfMissing: true,
	errorIfExists: false,
	valueEncoding: 'json'
}));
var transactionsLevel = db.sublevel(config.subLevels.transactions);
var statsLevel = db.sublevel(config.subLevels.stats);

function run() {
	var transactions = [];
	var stats = [];

	console.log("Reading transactions file");
	async.series([
		function (sCb) {
			readTransactions({
				transactionsPath: path.resolve('./transactions.xml')
			}, function (err, res) {
				if (err) err = new VError(err);
				transactions = res;
				console.log("(%d) transactons found.", transactions.length);
				sCb(err);
			})
		},
		function (sCb) {
			console.log("Inserting transactions into db.");
			transactionsLevel.batch(_.map(transactions, function (o) {
				return {type: 'put', key: o._id, value: o};
			}), sCb);
		},
		function (sCb) {
			console.log("Verifying inserted transactions.");
			verifyData({
				sub: transactionsLevel,
				keyPrefix: '!transaction',
				amtExpected: transactions.length
			}, sCb);
		},
		function (sCb) {
			console.log("Generating stats.");
			generateStats({
				transactions: transactions
			}, function (err, res) {
				if (err) err = new VError(err);
				stats = res;
				console.log("Stats for (%d) sitters generated.", stats.length);
				sCb(err);
			});
		},
		function (sCb) {
			console.log("Inserting stats into db.");
			statsLevel.batch(_.map(stats, function (o) {
				return {type: 'put', key: o._id, value: o};
			}), sCb);
		},
		function (sCb) {
			console.log("Verifying inserted stats.");
			verifyData({
				sub: statsLevel,
				keyPrefix: '!stat',
				amtExpected: stats.length
			}, sCb);
		}
	], function (err) {
		if (err) {
			console.error("Errored: %j", err && err.stack);
			return process.exit(1);
		}
		console.log("Done.");
		process.exit(0);
	});
}

function verifyData(params, cb) {
	var sub = params.sub;
	var keyPrefix = params.keyPrefix;
	var amtExpected = params.amtExpected;
	var amtFound = 0;

	sub.createReadStream({gt: keyPrefix, keys: true, values: false})
		.on('data', function (data) {
			amtFound++;
		})
		.on('error', cb)
		.on('end', function () {
			if (amtExpected === amtFound) {
				console.log("Verified, (%d) records found, (%d) expected.", amtFound, amtExpected);
				return cb();
			}
			return cb(new VError("Expected (" + amtExpected + ") " + keyPrefix + " items to be stored, but only retrieved ("
			+ amtFound + ")"));
		});
}

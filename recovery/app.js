"use strict";
var path = require('path');
var _ = require('lodash');
var async = require('async');
var VError = require('verror');
var level = require('level');
var config = require('../common/config');
var readTransactions = require('./readTransactions');
var generateStats = require('./generateStats');
var domain = require('domain');
var sublevel = require('level-sublevel');

var serverDomain = domain.create();
serverDomain.on('error', function (err) {
	console.error(err && err.stack);
	process.exit(1);
});
serverDomain.run(run);

var db = sublevel(level(config.dbPath, config.levelOptions));

// setup sublevels
var sublevels = {};
_(config.subLevels).each(function(sublevelName) {
	sublevels[sublevelName] = db.sublevel(sublevelName);
});

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
			sublevels.transactions.batch(_.map(transactions, function (o) {
				return {type: 'put', key: o._id, value: o};
			}), sCb);
		},
		function (sCb) {
			console.log("Verifying inserted transactions.");
			verifyData({
				sub: sublevels.transactions,
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
				console.log("Stats generated.");
				sCb(err);
			});
		},
		function (sCb) {
			console.log("Inserting member stats into db.");
			sublevels.members.batch(_.map(stats.members, function (o) {
				return {type: 'put', key: o.memberId, value: o};
			}), sCb);
		},

		function (sCb) {
			console.log("Verifying inserted stats.");
			verifyData({
				sub: sublevels.members,
				amtExpected: stats.members.length
			}, sCb);
		},

		function (sCb) {
			console.log("Inserting productive members into db.");
			// using the array idx as the key is important since we want to store the sorted
			// array in it's original order. This is of course optimized for read
			sublevels.productiveMembers.batch(_.map(stats.productiveMembers, function (o, i) {
				return {type: 'put', key: i, value: o};
			}), sCb);
		},

		function (sCb) {
			console.log("Verifying inserted productive members.");
			verifyData({
				sub: sublevels.productiveMembers,
				amtExpected: stats.productiveMembers.length
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
	var amtExpected = params.amtExpected;
	var amtFound = 0;

	sub.createKeyStream()
		.on('data', function (data) {
			amtFound++;
		})
		.on('error', cb)
		.on('end', function () {
			if (amtExpected === amtFound) {
				console.log("Verified, (%d) records found, (%d) expected.", amtFound, amtExpected);
				return cb();
			}
			return cb(new VError("Expected (" + amtExpected + ") items to be stored, but only retrieved ("
			+ amtFound + ")"));
		});
}

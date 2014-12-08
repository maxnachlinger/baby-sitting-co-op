"use strict";
var fs = require('fs');
var _ = require('lodash');
var joi = require('joi');
var VError = require('verror');
var parseString = require('xml2js').parseString;

module.exports = function (params, cb) {
	var joiResult = joi.validate(params, {
		transactionsPath: joi.string().required()
	}, {convert: true, allowUnknown: true});

	if (joiResult.error)
		return setImmediate(cb.bind(this, new VError(joiResult.error.message)));

	var transactionsPath = params.transactionsPath;

	fs.readFile(transactionsPath, function(err, contents) {
		parseString(contents, function (err, result) {
			if (err) return cb(new VError(err));

			var i = -1;
			var result = _(result.ArrayOfBabySittingTransaction.BabySittingTransaction).map(function (row) {
				// values come back as one-item arrays
				// TODO - the code below ought to ensure each record has valid data, this should use _.reduce and only add data if the read data is valid
				return {
					_id: ++i,
					childrenWatched: parseInt(row.ChildrenWatched.shift()),
					duration: parseInt(row.Duration.shift().replace(/\D/g, '')),
					sitterId: row.SittingProviderId.shift(),
					parentId: row.SittingReceiverId.shift(),
					startedAt: Date.parse(row.StartedAtUtc.shift()['a:DateTime'].shift())
				};
			}).valueOf();

			cb(null, result)
		});
	});
};

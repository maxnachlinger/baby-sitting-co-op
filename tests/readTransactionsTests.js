var test = require('tape');
var path = require('path');
var readTransactions = require('../recovery/readTransactions');

test('Transforms transactions.xml document into an array of objects', function (t) {
	readTransactions({
		transactionsPath: path.normalize(path.join(__dirname, '/fixtures/transactions.xml'))
	}, function (err, transactions) {
		t.notOk(err, 'No error should be returned, received: ' + (err && err.stack));
		t.deepEqual(transactions, [
			{
				_id: 0,
				childrenWatched: 3,
				duration: 2,
				sitterId: '0',
				parentId: '1',
				startedAt: 1411376036954
			},
			{
				_id: 1,
				childrenWatched: 2,
				duration: 1,
				sitterId: '0',
				parentId: '2',
				startedAt: 1413096588393
			}
		]);
		t.end();
	});
});

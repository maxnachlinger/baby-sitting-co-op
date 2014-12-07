var path = require('path');

module.exports = {
	dbPath: path.resolve(__dirname + '/db.level'),
	subLevels: {
		transactions: 'transactions',
		stats: 'stats'
	},
	levelPort: 3000
};

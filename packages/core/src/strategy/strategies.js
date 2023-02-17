const STRATEGIES = {
	'eager-on-end': require('./eager-on-end'),
	'timed': require('./timed'),
	'once': require('./once'),
};

module.exports = {
	STRATEGIES
};

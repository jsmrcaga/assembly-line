// This file handles the first instanciation for scheduler and strategy
// They should not be instanciated other than here
const get_config = require('./index');

let cache = null;

module.exports = () => {
	if(cache) {
		return cache;
	}

	const { config } = get_config();

	const { Scheduler } = require('../scheduler/scheduler');
	const { Strategy } = require('../strategy/strategy');

	const StrategyClass = Strategy.resolve(config.strategy.backend);
	const SchedulerClass = Scheduler.resolve(config.scheduler.backend);

	const scheduler = new SchedulerClass(config.scheduler);

	const _export = {
		scheduler,
		strategy: new StrategyClass({ scheduler, config: config.strategy}),
	};

	cache = _export;
	return cache;
};

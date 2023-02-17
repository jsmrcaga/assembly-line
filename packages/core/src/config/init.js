// This file handles the first instanciation for scheduler and strategy
// They should not be instanciated other than here
const { config } = require('./index')();

const { Scheduler } = require('../scheduler/scheduler');
const { Strategy } = require('../strategy/strategy');

const StrategyClass = Strategy.resolve(config.strategy.backend);
const SchedulerClass = Scheduler.resolve(config.scheduler.backend);
	
const scheduler = new SchedulerClass(config.scheduler);

module.exports = {
	scheduler,
	strategy: new StrategyClass({ scheduler, config: config.strategy}),
};

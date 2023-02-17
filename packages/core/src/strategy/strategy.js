const { Resolver } = require('../importer/resolver');
const { Scheduler } = require('../scheduler/scheduler');

class Strategy extends Resolver {
	#stopped = false;

	constructor({ config={}, scheduler }) {
		super();

		if(!scheduler) {
			throw new Error('Strategy: Scheduler is mandatory');
		}

		this.config = config;
		this.scheduler = scheduler;
	}

	static resolve(path) {
		// Import here to prevent dependency cycle
		const { STRATEGIES } = require('./strategies');

		if(path in STRATEGIES) {
			return STRATEGIES[path];
		}

		return super.resolve(path);
	}

	consume() {
		if(this.#stopped) {
			return;
		}

		return this.consume_tasks();
	}

	consume_tasks() {
		throw new Error(`${this.constructor.name}.consume_tasks should be overriden`);
	}

	// Useful for tests
	stop() {
		this.#stopped = true;
	}
}

module.exports = { Strategy };

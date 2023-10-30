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

	reschedule_tasks(tasks) {
		if(!tasks?.length) {
			return Promise.resolve();
		}

		return Promise.all(tasks.map(task => {
			return this.scheduler.reschedule(task);
		}));
	}

	run_tasks(tasks) {
		const tasks_promises = tasks.map(t => t.run());

		// Does not matter if some fail
		return Promise.allSettled(tasks_promises).then((results) => {
			// Reschedule failed tasks
			const failed_tasks = [];
			for(let i = 0; i < tasks.length; i++) {
				if(results[i].status === 'rejected') {
					failed_tasks.push(tasks[i]);
				}
			}

			let promise = Promise.resolve();
			if(failed_tasks.length) {
				promise = this.reschedule_tasks(failed_tasks);
			}

			return promise;
		}).catch(e => {
			console.error(e);
		});
	}

	// Useful for tests
	stop() {
		this.#stopped = true;
	}

}

module.exports = { Strategy };

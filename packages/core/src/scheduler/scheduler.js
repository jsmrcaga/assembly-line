const { Resolver } = require('../importer/resolver');
const { Task } = require('../task/task');

class Scheduler extends Resolver {
	constructor(config={}) {
		super();
		this.config = config;
	}

	// Scheduling
	schedule({ eta, offset, task_name, args, expires }) {
		if(eta && offset) {
			throw new Error('Date & Offset provided, only one permitted');
		}

		if(eta) {
			if(new Date(eta).getTime() < Date.now()) {
				throw new Error('Date must be in the future');
			}
		}

		if(offset && offset < 0) {
			throw new Error('Offset must be greater than 0');
		}

		if(expires && new Date(expires) < new Date()) {
			throw new Error('Cannot schedule task which expires in the past');
		}

		if(offset) {
			eta = new Date(Date.now() + offset).toISOString();
		}

		return this.schedule_task({ eta, offset, task_name, args, expires });
	}

	schedule_task({ eta, offset, task_name, args, expires }) {
		throw new Error('Scheduler.schedule_task should be overwritten');
	}

	queue(task_name, { args }) {
		return this.queue_task(task_name, { args });
	}

	queue_task(task_name, { args }) {
		return this.schedule({
			task_name,
			args,
			eta: null,
			offset: null,
			expires: null
		});
	}

	// Consuming
	consume(quantity=1) {
		// Ensure we are returning a promise
		const tasks = this.consume_tasks(quantity);

		let promise;
		if(tasks instanceof Promise) {
			promise = tasks;
		} else {
			promise = Promise.resolve(tasks);
		}

		return promise.then(tasks => {
			// Should we filter or throw -> depends on config
			const allowed_tasks = tasks.filter(task => {
				if(!Task.is_task(task)) {
					if(this.config.throw_on_invalid_task) {
						throw new Error('Scheduler got invalid task');
					}

					return false;
				}

				return true;
			});

			return allowed_tasks.map(task => new Task(task));
		});
	}

	consume_tasks(quantity) {
		throw new Error('Scheduler.consume_tasks should be overwritten');
	}
}

module.exports = {
	Scheduler
};

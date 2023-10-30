const { Resolver } = require('../importer/resolver');
const { Task } = require('../task/task');

class Scheduler extends Resolver {
	constructor(config={}) {
		super();
		this.config = config;
	}

	reschedule(task) {
		if(!(task instanceof Task)) {
			throw new Error('Can only reschedule an instance of Task');
		}

		return this.schedule({
			task_name: task.task_name,
			args: task.args,
			...task.options
		})
	}

	// Scheduling
	schedule({ eta, offset, task_name, args, expires, ...rest }={}) {
		if(!task_name) {
			throw new Error('Cannot schedule task without task_name');
		}

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


		return this.schedule_task({ eta, offset, task_name, args, expires, ...rest });
	}

	schedule_task() {
		throw new Error('Scheduler.schedule_task should be overwritten');
	}

	queue(task_name, { args, ...rest }) {
		return this.queue_task(task_name, { args, ...rest });
	}

	queue_task(task_name, { args, ...rest }) {
		return this.schedule({
			task_name,
			args,
			eta: null,
			offset: null,
			expires: null,
			...rest
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
			const actual_tasks = tasks.filter(task => {
				if(!Task.is_task(task)) {
					if(this.config.throw_on_invalid_task) {
						throw new Error('Scheduler got invalid task');
					}

					return false;
				}

				// It is possible that the task took too long to arrive
				if(task.options?.expires && new Date(task.options?.expires).getTime() < Date.now()) {
					return false;
				}

				return true;
			});

			const { not_yet_tasks, allowed_tasks } = tasks.reduce((agg, t) => {
				const task = new Task(t);

				if(task.options?.eta && new Date(task.options?.eta).getTime() > Date.now()) {
					agg.not_yet_tasks.push(task);
					return agg;
				}

				agg.allowed_tasks.push(task);
				return agg;
			}, { not_yet_tasks: [], allowed_tasks: [] });

			const reschedule_promise = not_yet_tasks.map(task => this.reschedule(task));

			return Promise.all([
				allowed_tasks,
				Promise.allSettled(reschedule_promise)
			]);

		}).then(([allowed_tasks, reschedule_results]) => {
			// find a way to log rescheduling errors
			return allowed_tasks;
		});
	}

	consume_tasks(quantity) {
		throw new Error('Scheduler.consume_tasks should be overwritten');
	}
}

module.exports = {
	Scheduler
};

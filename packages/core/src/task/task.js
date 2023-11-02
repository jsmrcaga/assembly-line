const { registry } = require('../registry/registry');

class Task {
	constructor({
		task_name,
		args=[],
		options: {
			expires,
			eta,
			...rest
		} = {}
	}={}) {
		if(!task_name) {
			throw new Error('Cannot instanciate task without task_name');
		}

		this.task_name = task_name;
		this.args = args;
		this.options = {
			expires,
			eta,
			...rest
		};
	}

	static to_task({ task_name, args, expires, eta, ...rest }) {
		return new this({
			task_name,
			args,
			options: {
				expires,
				eta,
				...rest
			}
		});
	}

	static is_task(task) {
		return Object.keys(task).includes('task_name') && typeof task.task_name === 'string';
	}

	static is_max_retried(options = {}) {
		if([null, undefined].includes(options?.max_retries)) {
			return false;
		}

		if(!options.retries) {
			return false;
		}

		return options.retries >= options.max_retries;
	}

	toJSON() {
		// Maps to constructor
		const { task_name, args, options } = this;
		return {
			task_name,
			args,
			options
		};
	}

	run() {
		return new Promise((resolve, reject) => {
			const { expires } = this;
			if(new Date(expires) > new Date()) {
				// Task expired
				throw new Error('Task expired');
			}

			const { callback, options } = registry.find(this.task_name);
			if(!callback) {
				throw new Error(`Could not find task ${this.task_name}`);
			}

			try {
				const result = callback.apply(callback, this.args);
				resolve(result);
			} catch(e) {
				reject(e);
			}
		});
	}
}


module.exports = { Task };

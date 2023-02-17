const { registry } = require('../registry/registry');

class Task {
	constructor({
		task_name,
		args=[],
		options: {
			exp,
			eta
		} = {}
	}={}) {
		if(!task_name) {
			throw new Error('Cannot instanciate task without task_name');
		}

		this.task_name = task_name;
		this.args = args;
		this.options = {
			exp,
			eta
		};
	}

	static is_task(task) {
		return Object.keys(task).includes('task_name');
	}

	run() {
		const { exp } = this;
		if(new Date(exp) > new Date()) {
			// Task expired
			throw new Error('Task expired');
		}

		const { callback, options } = registry.find(this.task_name);
		if(!callback) {
			throw new Error(`Could not find task ${this.task_name}`);
		}

		return callback.apply(callback, this.args);
	}
}


module.exports = { Task };

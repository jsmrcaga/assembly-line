const { scheduler } = require('../config/init');

const { registry: default_registry } = require('../registry/registry');

function task_decorator(callback, { registry=default_registry, ...options }={}) {
	function wrapped_task(...args) {
		return callback(...args);
	}

	const task_name = `${callback.name}__task`;
	registry.register(task_name, callback, options);

	// This will allow tracebacks and error reporting
	// to be a lot more understandable from the workers
	Object.defineProperty(wrapped_task, 'name', {
		value: task_name
	});

	// Schedule manually with options
	Object.defineProperty(wrapped_task, 'schedule', {
		writable: false,
		value: ({ timeout=null, eta=null, expires=null, args=[], retries }) => {
			scheduler.schedule(task_name, {
				timeout,
				eta,
				expires,
				retries,
				args
			});
		}
	});

	// Schedule to run immediately, no options allowed
	Object.defineProperty(wrapped_task, 'delay', {
		writable: false,
		value: (...args) => {
			scheduler.queue(task_name, { args });
		}
	});

	return wrapped_task;
}


module.exports = task_decorator;

const init_config = require('../config/init');

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
		value: ({ timeout=null, eta=null, expires=null, args=[], max_retries, ...rest }) => {
			const { scheduler } = init_config();
			return scheduler.schedule(task_name, {
				...options,
				timeout,
				eta,
				expires,
				max_retries,
				args,
				...rest
			});
		}
	});

	// Schedule to run immediately, no options allowed
	Object.defineProperty(wrapped_task, 'delay', {
		writable: false,
		value: (...args) => {
			const { scheduler } = init_config();
			return scheduler.queue(task_name, { args, ...options });
		}
	});

	return wrapped_task;
}


module.exports = task_decorator;

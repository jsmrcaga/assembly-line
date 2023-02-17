const { config } = require('../config')();
const Crypto = require('crypto');

class Registry {
	#registry = new Map();

	register(name='anonymous_task', callback, options={}) {
		const task_name = name ?? 'anonymous_task';
		const is_registered = [...this.#registry.values()].filter(({ callback: cb }) => cb === callback);
		// +1 because 2 are registered but with the new one makes 3
		if(is_registered?.length + 1 >= 3) {
			console.warn(`Assembly Line Warning: task "${task_name}" is being registered multiple times (${is_registered.length + 1}), this could mean you have a memory leak`);
			if(config.registry.trace_memory_leak && options.trace_memory_leak !== false) {
				console.trace('Possible Memory leak trace:');
			}
		}

		this.#registry.set(task_name, {
			callback,
			options
		});
	}

	find(task_name) {
		const task_def = this.#registry.get(task_name);
		return task_def;
	}
}

const registry = new Registry();

module.exports = { Registry, registry };

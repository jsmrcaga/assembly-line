const os = require('node:os');
const path = require('node:path');

const DEFAULT_CONFIG = {
	system: {
		worker_count: os.cpus().length,
	},
	registry: {
		trace_memory_leak: true,
	},
	tasks: {
		discovery_paths: [
			path.join(process.cwd(), './tasks/tasks.js'),
			path.join(process.cwd(), './src/tasks.js'),
		]
	},
	scheduler: {
		backend: path.resolve(__dirname, '../scheduler/memory-scheduler'),
		throw_on_invalid_task: false,
	},
	strategy: {
		backend: 'eager-on-end',
		options: {
			// If queue was empty we wait 1 second before asking for a new task
			empty_queue_wait_ms: 1000,
			// After every task we wait 200ms before reaching to the queue again
			cooldown_ms: 200,
		}
	}
};

const merge_object = (conf1={}, overrides={}) => {
	const merged_obj = Object.entries(conf1).reduce((agg, [k, v]) => {
		if(Array.isArray(v)) {
			if(overrides[k]) {
				agg[k] = overrides[k];
				return agg;
			}

			agg[k] = v;
			return agg;
		}

		if(v instanceof Object) {
			merged_sub_object = merge_object(v, overrides[k] || {});
			agg[k] = merged_sub_object;
		} else {
			agg[k] = overrides[k] ?? v;
		}

		return agg;
	}, {});

	// This is so any key that did not exist on the basic
	// object will still find itself on the final object
	return {
		...overrides,
		...merged_obj
	};
};

let config_cache = null;

function get_config(overrides={}) {
	// Make sure any sub-sequent requires result in the same config
	// Will not work for workers if they get killed and env changed
	if(config_cache) {
		return config_cache;
	}

	let config;
	try {
		const { ASSEMBLY_LINE_CONFIG='./.assembly-line.json' } = process.env;
		const config_path = path.join(process.cwd(), ASSEMBLY_LINE_CONFIG);

		let required_config = require(config_path);
		if(required_config instanceof Function) {
			required_config = required_config();
		}

		const config_w_overrides = merge_object(required_config, overrides);
		// Config might be incomplete
		// Overrides might be incomplete
		config = merge_object(DEFAULT_CONFIG, config_w_overrides);

	} catch(e) {
		if(e.code !== 'MODULE_NOT_FOUND') {
			throw e;
		}

		// Warn user?
		config = merge_object(DEFAULT_CONFIG, overrides);
	}

	if(!config.strategy?.backend) {
		throw new Error('Strategy backend is mandatory in config');
	}

	if(!config.scheduler?.backend) {
		throw new Error('Scheduler backend is mandatory in config');
	}

	const result = { config };

	config_cache = result;
	return result;
};

get_config.DEFAULT_CONFIG = DEFAULT_CONFIG;

module.exports = get_config;

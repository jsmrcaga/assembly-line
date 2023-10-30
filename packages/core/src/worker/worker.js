const get_config = require('../config');
const { scheduler, strategy } = require('../config/init');
const { registry } = require('../registry/registry');
const Importer = require('../importer/importer');

class AssemblyWorker {
	// Can be overridden if somoeone uses the worker as a standalone runner
	constructor(worker_config=null) {
		this.config = worker_config || get_config();
	}

	run() {
		const { tasks: { discovery_paths } } = this.config;

		// Manage imports
		return Importer.discover_tasks({
			config: this.config,
			discovery_paths,
		}).then(() => {
			// - begin consuming tasks with given strategy
			return strategy.consume();
		}).then(results => {
			return results;
		});
	}
}

module.exports = {
	AssemblyWorker
};

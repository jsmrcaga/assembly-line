const { config } = require('../config')();
const { scheduler, strategy } = require('../config/init');
const { registry } = require('../registry/registry');
const Importer = require('../importer/importer');

class AssemblyWorker {
	run() {
		const { tasks: { discovery_paths } } = config;

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

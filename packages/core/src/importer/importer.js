class Importer {
	// Built as method to simplify testing
	static require(path) {
		return require(path);
	}

	static #import_path({ config, path }, current_index=0) {
		let imported_tasks;
		try {
			// using global.require to be able to unit-test
			imported_tasks = this.require(path);
		} catch(e) {
			console.error(e);
			return Promise.resolve();
		}

		if(imported_tasks instanceof Function) {
			const result = imported_tasks(config);
			if(result instanceof Promise) {
				return result;
			}

			return Promise.resolve(result);
		}

		return Promise.resolve(imported_tasks);
	}

	static #import_paths({ config, discovery_paths }, current_index=0, result_stack=[]) {
		const path = discovery_paths[current_index];
		if(!path) {
			return result_stack;
		}

		return this.#import_path({ config, path }, current_index).then(result => {
			result_stack.push(result);

			return this.#import_paths({ config, discovery_paths }, current_index + 1, result_stack);
		});
	}

	static discover_tasks({ config, discovery_paths }) {
		return this.#import_paths({ config, discovery_paths });
	}
}

module.exports = Importer;

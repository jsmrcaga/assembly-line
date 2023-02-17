const path = require('node:path');

class Resolver {
	static resolve(definition){
		// User might override configuration with a class instead of a path
		if(Object.getPrototypeOf(definition) === this) {
			return definition;
		}

		// Search for path & import
		const file_path = path.resolve(process.cwd(), definition);
		// This implies that it must be the only export
		const result = require(file_path);
		if(Object.getPrototypeOf(result) !== this) {
			throw new Error(`Exported member of ${definition} is not an instance of Scheduler`);
		}

		return result;
	}
}

module.exports = { Resolver };

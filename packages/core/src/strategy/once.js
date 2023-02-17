const { Strategy } = require('./strategy');

class Once extends Strategy {
	consume_tasks() {
		return this.scheduler.consume().then(tasks => {
			const tasks_promises = tasks.map(t => t.run());

			// This strategy consumes only once
			return Promise.allSettled(tasks_promises);
		});
	}
}

module.exports = Once;

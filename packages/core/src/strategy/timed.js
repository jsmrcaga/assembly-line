const { Strategy } = require('./strategy');

class Timed extends Strategy {
	consume_tasks() {
		const {
			cooldown_ms=1_000,
		} = this.config;

		return this.scheduler.consume().then(task => {
			// No need to wait since this strategy just times the consumption
			const tasks_promises = tasks.map(t => t.run());
			return;
		}).then(() => {
			return new Promise(resolve => {
				setTimeout(() => {
					resolve(this.consume());
				}, cooldown_ms);
			});
		});
	}
}

module.exports = Timed;

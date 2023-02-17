const { Strategy } = require('./strategy');

const delay = (cb, timeout) => new Promise(resolve => setTimeout(() => {
	const res = cb();
	resolve(res);
}, timeout));

class EagerOnEnd extends Strategy {
	consume_tasks() {
		const {
			// Wait 1 sec before consuming again if queue was empty
			empty_queue_wait_ms=1000,
			cooldown_ms=200,
		} = this.config;

		return this.scheduler.consume().then(tasks => {
			if(!tasks?.length) {
				return delay(() => this.consume(), empty_queue_wait_ms);
			}

			// Run task
			const tasks_promises = tasks.map(t => t.run());

			// Does not matter if some fail
			return Promise.allSettled(tasks_promises);
		}).then(() => {
			if(cooldown_ms) {
				return delay(() => this.consume(), cooldown_ms);
			}

			return this.consume();
		});
	}
}

module.exports = EagerOnEnd;

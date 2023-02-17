const { Scheduler } = require('./scheduler');

class MemoryScheduler extends Scheduler {
	// RAM queue
	#queue = [];

	schedule_task({ date=null, offset=null, task_name, args }) {
		if(date) {
			// compute offset
			offset = new Date(date).getTime() - Date.now();
		}
	}

	queue_task(task_name, { args, options }) {
		this.#queue.push({
			task_name,
			args,
			options
		});
	}

	consume_one() {
		if(this.config.fifo) {
			return this.#queue.shift();
		}

		return this.#queue.pop();
	}

	consume_tasks(quantity) {
		const todo = [];
		for(let i = 0; i < quantity; i++) {
			const task = this.consume_one();
			if(task) {
				todo.push(task);
			}
		}

		return todo;
	}
}

module.exports = MemoryScheduler;

const os = require('node:os');
const path = require('node:path');
const { Worker: WorkerThread, isMainThread, SHARE_ENV } = require('node:worker_threads');

class AssemblyLine {
	#workers = {};
	#inited = false;
	#terminating = false;
	#terminated = false;
	#necessary_workers = 0;

	#resolve_on_empty = null;

	constructor({ config }) {
		this.config = config;

		this.#necessary_workers = 1 || config.system?.worker_count || os.cpus().length;
	}

	spawn() {
		const worker_path = path.join(__dirname, './worker/index.js');
		const worker = new WorkerThread(worker_path, {
			env: SHARE_ENV,
			workerData: {
				config: this.config
			}
		});

		worker.on('online', (data) => {
			// Emit event to userland in case they need to do something
		});

		worker.on('error', err => {
			console.error(err);
			// Emit error for userland for monitoring
		});

		// We need to create a closure since worker.threadId goes to -1
		worker.on('exit', (threadId => {
			return code => {
				// Remove worker from cache
				delete this.#workers[threadId];
				const workers_left = Object.keys(this.#workers).length;
				// Check if this is intentional
				if(this.#terminating) {
					if(!workers_left) {
						this.#terminating = true;
						this.#terminated = true;

						// Resolve promise that will kill the process
						this.#resolve_on_empty();
					}

					return;
				}

				// Check exit code and magically decide
				// if we need a new worker to spawn
				if(workers_left < this.#necessary_workers) {
					this.spawn();
				}
			}
		})(worker.threadId));

		this.#workers[worker.threadId] = worker;
	}

	run() {
		if(!isMainThread) {
			throw new Error('AssemblyLine can only be run on main thread');
		}

		this.#terminating = false;
		this.#inited = false;

		// Spawn enough workers
		for(let i = 0; i < this.#necessary_workers; i++) {
			this.spawn();
		}

		// Prevents node from exiting the process
		return new Promise(resolve => {
			this.#resolve_on_empty = resolve;
		});
	}

	terminate() {
		this.#terminating = true;
		for(const worker of Object.values(this.#workers)) {
			worker.terminate();
		}
	}
}

module.exports = AssemblyLine;

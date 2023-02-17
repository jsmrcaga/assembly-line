module.exports = () => {
	return {
		system: {
			worker_count: 56
		},
		tasks: {
			discovery_paths: []
		},
		scheduler: {
			throw_on_invalid_task: true
		},
		strategy: {
			empty_queue_wait_ms: 10
		}
	};
	
};

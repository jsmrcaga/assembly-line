const { Scheduler } = require('../../../src/scheduler/scheduler');

class MockScheduler extends Scheduler {
	consume_tasks() {}
}

module.exports = MockScheduler;

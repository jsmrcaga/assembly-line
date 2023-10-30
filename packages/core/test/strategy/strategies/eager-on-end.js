const Sinon = require('sinon');
const { expect } = require('chai');

const EagerOnEnd = require('../../../src/strategy/eager-on-end');
const { Task } = require('../../../src/task/task');

const MockScheduler = require('./mock-scheduler');

describe('Strategies - Eager on End', () => {
	it('Should consume a task & wait for the cooldown before consuming another', (done) => {
		const task = new Task({ task_name: 'fake task' });
		const stub = Sinon.stub(MockScheduler.prototype, 'consume').resolves([task]);
		const task_stub = Sinon.stub(Task.prototype, 'run').resolves();

		const scheduler = new MockScheduler();

		const strategy = new EagerOnEnd({
			scheduler,
			config: {
				empty_queue_wait_ms: 1000,
				cooldown_ms: 20
			}
		});

		strategy.consume().catch(e => done(e));

		setTimeout(() => {
			strategy.stop();

			stub.restore();
			task_stub.restore();

			// 0ms - 1st call
			// 20ms - 2nd call
			// 30ms - no time for 3d call
			expect(stub.callCount).to.be.eql(2);
			done();
		}, 30);
	});

	it('Should try to consume a task & wait for the empty queue timeout before consuming another', done => {
		const task = new Task({ task_name: 'fake task' });
		// Empty queue
		const stub = Sinon.stub(MockScheduler.prototype, 'consume').resolves([]);
		const task_stub = Sinon.stub(Task.prototype, 'run').resolves();

		const scheduler = new MockScheduler();

		const strategy = new EagerOnEnd({
			scheduler,
			config: {
				empty_queue_wait_ms: 20,
				cooldown_ms: 1000
			}
		});

		strategy.consume().catch(e => done(e));

		setTimeout(() => {
			strategy.stop();

			// Restore before check so error does not break subsequent tests
			stub.restore();
			task_stub.restore();

			// 0ms - 1st call
			// 20ms - 2nd call
			// 30ms - no time for 3d call
			expect(stub.callCount).to.be.eql(2);

			done();
		}, 30);
	});

	it('Should not try to consume if it has been stopped', done => {
		const task = new Task({ task_name: 'fake task' });
		// Empty queue
		const stub = Sinon.stub(MockScheduler.prototype, 'consume').resolves([]);
		const task_stub = Sinon.stub(Task.prototype, 'run').resolves();

		const scheduler = new MockScheduler();

		const strategy = new EagerOnEnd({
			scheduler,
			config: {
				empty_queue_wait_ms: 20,
				cooldown_ms: 20
			}
		});

		strategy.consume().catch(e => done(e));
		strategy.stop();

		setTimeout(() => {
			strategy.stop();
			stub.restore();
			task_stub.restore();

			// 0ms - 1st call
			// stopped
			expect(stub.callCount).to.be.eql(1);

			done();
		}, 30);
	});

	it('Should consume a task & continue if it fails', done => {
		const task = new Task({ task_name: 'fake task' });
		const stub = Sinon.stub(MockScheduler.prototype, 'consume').resolves([task]);
		const schedule_stub = Sinon.stub(MockScheduler.prototype, 'schedule').resolves();

		// Note that we use rejects here
		const task_stub = Sinon.stub(Task.prototype, 'run').rejects();

		const scheduler = new MockScheduler();

		const strategy = new EagerOnEnd({
			scheduler,
			config: {
				empty_queue_wait_ms: 1000,
				cooldown_ms: 20
			}
		});

		strategy.consume().catch(e => done(e));

		setTimeout(() => {
			strategy.stop();
			stub.restore();
			task_stub.restore();
			schedule_stub.restore();

			// 0ms - 1st call
			// 20ms - 2nd call
			// 30ms - no time for 3d call
			expect(stub.callCount).to.be.eql(2);

			done();
		}, 30);
	});
});

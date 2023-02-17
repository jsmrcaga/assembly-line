const Sinon = require('sinon');
const { expect } = require('chai');

const task_decorator = require('../../src/task/task-decorator');

class FakeRegistry {
	register(){}
}

class FakeScheduler {
	schedule() {}
	queue() {}
}

describe('Task decorator', () => {
	registry_stub = null;

	describe('Registry', () => {
		beforeEach(() => {
			registry_stub = Sinon.stub(FakeRegistry.prototype, 'register');
		});

		afterEach(() => {
			registry_stub.restore();
		});

		it('Should decorate & proxy task function', () => {
			const task_fn = (a, b, c) => {
				return a + b + c;
			};

			const decorated_fn = task_decorator(task_fn);

			expect(decorated_fn).to.have.property('schedule');
			expect(decorated_fn).to.have.property('delay');
			expect(decorated_fn.name).to.be.eql(`${task_fn.name}__task`);

			expect(decorated_fn(1, 2, 3)).to.be.eql(6);
		});

		it('Should register task to registry without options', () => {
			const task_fn = () => {};
			task_decorator(task_fn, { registry: new FakeRegistry() });

			expect(registry_stub.callCount).to.be.eql(1);
			expect(registry_stub.firstCall.args).to.be.eql([`task_fn__task`, task_fn, {}]);
		});

		it('Should register task to registry with options', () => {
			const task_fn = () => {};
			task_decorator(task_fn, { registry: new FakeRegistry(), test_option: true });

			expect(registry_stub.callCount).to.be.eql(1);
			expect(registry_stub.firstCall.args).to.be.eql([`task_fn__task`, task_fn, { test_option: true }]);
		});
	});

	describe('Scheduling', () => {
		let scheduler_stub = null;
		// Invalidate config cache to force fake scheduler
		const config_cache_path = require.resolve('../../src/config/init');

		beforeEach(() => {
			delete require.cache[config_cache_path];
			delete require.cache[require.resolve('../../src/task/task-decorator')];
			// Force fake scheduler with configgetter
			require.cache[config_cache_path] = {
				exports: {
					scheduler: new FakeScheduler()
				}
			};

			scheduler_schedule_stub = Sinon.stub(FakeScheduler.prototype, 'schedule');
			scheduler_queue_stub = Sinon.stub(FakeScheduler.prototype, 'queue');
		});

		afterEach(() => {
			scheduler_schedule_stub.restore();
			scheduler_queue_stub.restore();
		});

		after(() => {
			// To cleanup at exit
			delete require.cache[config_cache_path];
		});

		it('Queues a task', () => {
			const task_decorator = require('../../src/task/task-decorator');

			const task_fn = (a, b, c) => a + b + c;
			// Using default registry should be fine
			const decorated_fn = task_decorator(task_fn);
			decorated_fn.delay(1, 2, 3);
			decorated_fn.delay(4, 5, 6);
			decorated_fn.delay(7, 8, 9);

			expect(scheduler_queue_stub.firstCall.args).to.be.eql(['task_fn__task', {
				args: [1, 2, 3]
			}]);
			expect(scheduler_queue_stub.secondCall.args).to.be.eql(['task_fn__task', {
				args: [4, 5, 6]
			}]);
			expect(scheduler_queue_stub.lastCall.args).to.be.eql(['task_fn__task', {
				args: [7, 8, 9]
			}]);
		});

		it('Schedules a task', () => {
			const task_decorator = require('../../src/task/task-decorator');

			const task_fn = (a, b, c) => a + b + c;
			// Using default registry should be fine
			const decorated_fn = task_decorator(task_fn);
			decorated_fn.schedule({
				args: [1, 2, 3],
				timeout: 150,
				eta: '2021-01-01T00:00:00.000Z',
				expires: '2021-01-01T00:00:00.001Z',
				retries: 1
			});
			decorated_fn.schedule({
				args: [4, 5, 6],
				timeout: 250,
				eta: '2022-01-01T00:00:00.000Z',
				expires: '2022-01-01T00:00:00.001Z',
				retries: 2
			});
			decorated_fn.schedule({
				args: [7, 8, 9],
				timeout: 350,
				eta: '2023-01-01T00:00:00.000Z',
				expires: '2023-01-01T00:00:00.001Z',
				retries: 3
			});

			expect(scheduler_schedule_stub.firstCall.args).to.be.eql(['task_fn__task', {
				args: [1, 2, 3],
				timeout: 150,
				eta: '2021-01-01T00:00:00.000Z',
				expires: '2021-01-01T00:00:00.001Z',
				retries: 1
			}]);
			expect(scheduler_schedule_stub.secondCall.args).to.be.eql(['task_fn__task', {
				args: [4, 5, 6],
				timeout: 250,
				eta: '2022-01-01T00:00:00.000Z',
				expires: '2022-01-01T00:00:00.001Z',
				retries: 2
			}]);
			expect(scheduler_schedule_stub.lastCall.args).to.be.eql(['task_fn__task', {
				args: [7, 8, 9],
				timeout: 350,
				eta: '2023-01-01T00:00:00.000Z',
				expires: '2023-01-01T00:00:00.001Z',
				retries: 3
			}]);
		});
	});
});

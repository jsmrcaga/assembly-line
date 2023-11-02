const Sinon = require('sinon');
const { expect } = require('chai');
const { Scheduler } = require('../../src/scheduler/scheduler');
const { Task } = require('../../src/task/task');

class FakeScheduler extends Scheduler {}

describe('Scheduler', () => {
	describe('Without specific queing', () => {
		it('Should not allow both eta & offset', () => {
			const scheduler = new FakeScheduler();

			expect(() => {
				scheduler.schedule({ task_name: 'fake-task', eta: 'fake-date', offset: 45 });
			}).to.throw(Error, 'Date & Offset provided, only one permitted');
		});

		it('Should not allow eta in the past', () => {
			const scheduler = new FakeScheduler();

			expect(() => {
				scheduler.schedule({
					task_name: 'fake-task',
					eta: new Date(Date.now() - 1000).toISOString()
				});
			}).to.throw(Error, 'Date must be in the future');
		});

		it('Should not allow negative offset', () => {
			const scheduler = new FakeScheduler();

			expect(() => {
				scheduler.schedule({
					task_name: 'fake-task',
					offset: -14
				});
			}).to.throw(Error, 'Offset must be greater than 0');
		});

		it('Should not allow expired task', () => {
			const scheduler = new FakeScheduler();

			expect(() => {
				scheduler.schedule({
					task_name: 'fake-task',
					expires: new Date(Date.now() - 1000).toISOString()
				});
			}).to.throw(Error, 'Cannot schedule task which expires in the past');
		});

		describe('Proxies to schedule_task', () => {
			let schedule_stub = null;
			let date_stub = null;

			beforeEach(() => {
				schedule_stub = Sinon.stub(FakeScheduler.prototype, 'schedule_task');

				// '2023-02-16T23:00:00.000Z'
				date_stub = Sinon.stub(Date, 'now').returns(1676588400000);
			});

			afterEach(() => {
				schedule_stub.restore();
				date_stub.restore();
			});

			it('Should call schedule_task with the same params', () => {
				const scheduler = new FakeScheduler();
				scheduler.schedule({ offset: null, eta: '2045-01-01T00:00:00.100T', task_name: 'task-1', args: [1, 2, 3], expires: null });
				scheduler.schedule({ offset: null, eta: '2045-01-01T00:00:00.200T', task_name: 'task-2', args: [4, 5], expires: '2045-01-01T00:00:00.000T' });
				scheduler.schedule({ offset: null, eta: '2045-01-01T00:00:00.300T', task_name: 'task-3', args: ['plep'], expires: '2045-01-01T00:00:00.000T' });

				expect(schedule_stub.callCount).to.be.eql(3);
				expect(schedule_stub.firstCall.args).to.be.eql([{ eta: '2045-01-01T00:00:00.100T', offset: null, task_name: 'task-1', args: [1, 2, 3], expires: null }]);
				expect(schedule_stub.secondCall.args).to.be.eql([{ eta: '2045-01-01T00:00:00.200T', offset: null, task_name: 'task-2', args: [4, 5], expires: '2045-01-01T00:00:00.000T' }]);
				expect(schedule_stub.lastCall.args).to.be.eql([{ eta: '2045-01-01T00:00:00.300T', offset: null, task_name: 'task-3', args: ['plep'], expires: '2045-01-01T00:00:00.000T' }]);
			});

			it('Should call schedule_task with computed eta', () => {
				const scheduler = new FakeScheduler();
				const now = Date.now();
				scheduler.schedule({ offset: 100, task_name: 'task-1', args: [1, 2, 3], expires: null });
				scheduler.schedule({ offset: 200, task_name: 'task-2', args: [4, 5], expires: '2045-01-01T00:00:00.000T' });
				scheduler.schedule({ offset: 300, task_name: 'task-3', args: ['plep'], expires: '2045-01-01T00:00:00.000T' });

				expect(schedule_stub.callCount).to.be.eql(3);
				// Dates come from stub
				expect(schedule_stub.firstCall.args).to.be.eql([{ eta: '2023-02-16T23:00:00.100Z', offset: 100, task_name: 'task-1', args: [1, 2, 3], expires: null }]);
				expect(schedule_stub.secondCall.args).to.be.eql([{ eta: '2023-02-16T23:00:00.200Z', offset: 200, task_name: 'task-2', args: [4, 5], expires: '2045-01-01T00:00:00.000T' }]);
				expect(schedule_stub.lastCall.args).to.be.eql([{ eta: '2023-02-16T23:00:00.300Z', offset: 300, task_name: 'task-3', args: ['plep'], expires: '2045-01-01T00:00:00.000T' }]);
			});

			it('Should call schedule_task with the same params (from queue)', () => {
				const scheduler = new FakeScheduler();
				scheduler.queue('task-1', { args: [1, 2, 3] });
				scheduler.queue('task-2', { args: [4, 5] });
				scheduler.queue('task-3', { args: ['plep'] });

				expect(schedule_stub.callCount).to.be.eql(3);
				expect(schedule_stub.firstCall.args).to.be.eql([{ eta: null, offset: null, task_name: 'task-1', args: [1, 2, 3], expires: null }]);
				expect(schedule_stub.secondCall.args).to.be.eql([{ eta: null, offset: null, task_name: 'task-2', args: [4, 5], expires: null }]);
				expect(schedule_stub.lastCall.args).to.be.eql([{ eta: null, offset: null, task_name: 'task-3', args: ['plep'], expires: null }]);
			});
		});
	});

	describe('Consume tasks', () => {
		let consume_stub = null;

		afterEach(() => {
			consume_stub.restore();
		});

		for(const config of [{throw_on_invalid_task: false}, {}]) {
			it('Should not throw an error if consumed object is not a task (config)', done => {
				consume_stub = Sinon.stub(FakeScheduler.prototype, 'consume_tasks').returns([{ task_name: 'fake-task', test: true }]);
				const scheduler = new FakeScheduler(config);

				scheduler.consume().then(() => done()).catch(e => done(e));
			});
		}

		it('Should throw an error if consumed object is not a task (config)', () => {
			consume_stub = Sinon.stub(FakeScheduler.prototype, 'consume_tasks').returns([{ task_name: 'fake-task', test: true }]);
			const scheduler = new FakeScheduler({
				throw_on_invalid_task: true
			});

			scheduler.consume().then(() => {
				done(new Error('Should not resolve'));
			}).catch(e => {
				expect(e.message).to.be('Scheduler got invalid task');
				done();
			});
		});

		for(const result of [[{ task_name: 'fake-task', test: true }], Promise.resolve([{ task_name: 'fake-task', test: true }])]) {
			it('Should return a promise independently on what the consumer returned (promise or value)', () => {
				consume_stub = Sinon.stub(FakeScheduler.prototype, 'consume_tasks').returns(result);
				const scheduler = new FakeScheduler({
					throw_on_invalid_task: true
				});

				expect(scheduler.consume()).to.be.a('promise');
			});
		}

		it('Should return instances of Task after consuming', done => {
			consume_stub = Sinon.stub(FakeScheduler.prototype, 'consume_tasks').returns([{
				task_name: 'plep',
				args: [1, 2, 3]
			}]);
			const scheduler = new FakeScheduler({
				throw_on_invalid_task: true
			});

			scheduler.consume().then(result => {
				expect(result.length).to.be.eql(1);
				const [task] = result;
				expect(task).to.be.an.instanceof(Task);
				done();
			}).catch(e => done(e));
		});

		it('Should not consume tasks that have been retried max_retries times', done => {
			consume_stub = Sinon.stub(FakeScheduler.prototype, 'consume_tasks').returns([{
				task_name: 'plep',
				args: [1, 2, 3],
				options: {
					max_retries: 3,
					retries: 3
				}
			}]);

			const scheduler = new FakeScheduler({
				throw_on_invalid_task: true
			});

			scheduler.consume().then(result => {
				expect(result.length).to.be.eql(0);
				done();
			}).catch(e => done(e));
		});
	});

	describe('Scheduling', () => {
		it('Should not schedule tasks that have been retried max_retries times', () => {
			const scheduler = new FakeScheduler({
				throw_on_invalid_task: true
			});

			expect(() => scheduler.schedule({
				task_name: 'plep',
				args: [1, 2, 3],
				max_retries: 3,
				retries: 3
			})).to.throw(Error, 'Cannot schedule task because it has been retried enough');
		});

		it('Should not re-schedule tasks that have been retried max_retries times', done => {
			const schedule_stub = Sinon.stub(FakeScheduler.prototype, 'schedule').returns([{
				task_name: 'plep',
				args: [1, 2, 3],
				options: {
					max_retries: 3,
					retries: 3
				}
			}]);

			const scheduler = new FakeScheduler({
				throw_on_invalid_task: true
			});

			scheduler.reschedule(new Task({
				task_name: 'plep',
				args: [1, 2, 3],
				options: {
					max_retries: 3,
					retries: 3
				}
			})).then(() => {
				expect(schedule_stub.callCount).to.be.eql(0);
				done()
			}).catch(e => done(e));

		});
	});
});

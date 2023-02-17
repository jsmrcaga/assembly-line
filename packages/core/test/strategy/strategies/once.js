const Sinon = require('sinon');
const { expect } = require('chai');
const Once = require('../../../src/strategy/once');

const { Task } = require('../../../src/task/task');
const MockScheduler = require('./mock-scheduler');

describe('Strategies - Once', () => {
	let consume_stub = null;

	afterEach(() => {
		consume_stub.restore();
	});

	it('Should run tasks and exit (all resolve)', done => {
		const task1 = new Task({ task_name: 'fake task' });
		const task2 = new Task({ task_name: 'fake task 2' });
		const task1_stub = Sinon.stub(task1, 'run').resolves(1);
		const task2_stub = Sinon.stub(task2, 'run').resolves(2);
		
		consume_stub = Sinon.stub(MockScheduler.prototype, 'consume').resolves([task1, task2]);

		const strategy = new Once({
			scheduler: new MockScheduler()
		});

		const promise = strategy.consume();
		expect(promise).to.be.a('promise');
		promise.then(result => {
			expect(result).to.be.eql([{
				status: 'fulfilled',
				value: 1
			}, {
				status: 'fulfilled',
				value: 2
			}]);
			done();
		}).catch(e => done(e));
	});

	it('Should run tasks and exit (all reject)', done => {
		const task1 = new Task({ task_name: 'fake task' });
		const task2 = new Task({ task_name: 'fake task 2' });
		const task1_stub = Sinon.stub(task1, 'run').rejects(1);
		const task2_stub = Sinon.stub(task2, 'run').rejects(2);
		
		consume_stub = Sinon.stub(MockScheduler.prototype, 'consume').resolves([task1, task2]);

		const strategy = new Once({
			scheduler: new MockScheduler()
		});

		const promise = strategy.consume();
		expect(promise).to.be.a('promise');
		promise.then(result => {
			expect(result).to.be.eql([{
				status: 'rejected',
				reason: 1
			}, {
				status: 'rejected',
				reason: 2
			}]);
			done();
		}).catch(e => done(e));
	});

	it('Should run tasks and exit (mixed results)', done => {
				const task1 = new Task({ task_name: 'fake task' });
		const task2 = new Task({ task_name: 'fake task 2' });
		const task1_stub = Sinon.stub(task1, 'run').rejects(1);
		const task2_stub = Sinon.stub(task2, 'run').resolves(2);
		
		consume_stub = Sinon.stub(MockScheduler.prototype, 'consume').resolves([task1, task2]);

		const strategy = new Once({
			scheduler: new MockScheduler()
		});

		const promise = strategy.consume();
		expect(promise).to.be.a('promise');
		promise.then(result => {
			expect(result).to.be.eql([{
				status: 'rejected',
				reason: 1
			}, {
				status: 'fulfilled',
				value: 2
			}]);
			done();
		}).catch(e => done(e));
	});
});

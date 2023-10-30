const Sinon = require('sinon');
const { expect } = require('chai');

const { SQSScheduler } = require('../scheduler/sqs-scheduler');

const {
	SQSClient,
	SendMessageCommand,
} = require('@aws-sdk/client-sqs');

describe('Scheduling', () => {
	// Mock client.send
	let sqs_client_mock = null;
	let sqs_scheduler = null;
	beforeEach(() => {
		sqs_client_mock = Sinon.stub(SQSClient.prototype, 'send').resolves(true);
		sqs_scheduler = new SQSScheduler({
			sqs_queue_url: 'sqs://fake-url'
		});
	});

	afterEach(() => {
		sqs_scheduler = null;
		sqs_client_mock.restore();
	});

	it('Should schedule a task without ETA', () => {
		return sqs_scheduler.schedule({
			task_name: 'fake-task',
			args: [1, 2, 3]
		}).then(() => {
			expect(sqs_client_mock.callCount).to.be.eql(1);

			const call = sqs_client_mock.firstCall;
			const message = call.args[0]

			expect(message).to.be.instanceof(SendMessageCommand);
			const { task_name, args } = JSON.parse(message.input.MessageBody);

			// Default url
			expect(message.input.QueueUrl).to.be.eql('sqs://fake-url');
			expect(task_name).to.be.eql('fake-task');
			expect(args).to.be.eql([1, 2, 3]);
			expect(message.input.DelaySeconds).to.be.null;
		});
	});

	it('Should schedule a task with ETA in 15 secs', () => {
		const now = new Date();
		now.setSeconds(now.getSeconds() + 15)
		return sqs_scheduler.schedule({
			task_name: 'fake-task',
			args: [1, 2, 3],
			eta: now.toISOString()
		}).then(() => {
			expect(sqs_client_mock.callCount).to.be.eql(1);

			const call = sqs_client_mock.firstCall;
			const message = call.args[0]

			expect(message).to.be.instanceof(SendMessageCommand);
			const { task_name, args } = JSON.parse(message.input.MessageBody);

			expect(task_name).to.be.eql('fake-task');
			expect(args).to.be.eql([1, 2, 3]);
			expect(message.input.DelaySeconds).to.be.eql(15);
		});
	});


	it('Should schedule a task with max delay seconds of 900', () => {
		return sqs_scheduler.schedule({
			task_name: 'fake-task',
			args: [1, 2, 3],
			eta: '3000-01-01T00:00:00.000Z'
		}).then(() => {
			expect(sqs_client_mock.callCount).to.be.eql(1);

			const call = sqs_client_mock.firstCall;
			const message = call.args[0]

			expect(message).to.be.instanceof(SendMessageCommand);
			const { task_name, args } = JSON.parse(message.input.MessageBody);

			expect(task_name).to.be.eql('fake-task');
			expect(args).to.be.eql([1, 2, 3]);
			expect(message.input.DelaySeconds).to.be.eql(900);
		});
	});

	it('Should schedule a task to another queue', () => {
		return sqs_scheduler.schedule({
			task_name: 'fake-task',
			args: [1, 2, 3],
			eta: '2030-01-01T00:00:00.000Z',
			sqs_queue_url: 'sqs://another'
		}).then(() => {
			expect(sqs_client_mock.callCount).to.be.eql(1);

			const call = sqs_client_mock.firstCall;
			const message = call.args[0]

			expect(message).to.be.instanceof(SendMessageCommand);
			expect(message.input.QueueUrl).to.be.eql('sqs://another');
		});
	});
});

describe('Consuming', () => {

});

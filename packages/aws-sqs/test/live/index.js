const { SQSScheduler } = require('../../scheduler/sqs-scheduler');

const { configure, task_decorator } = require('@control/assembly-line');
const get_config = require('@control/assembly-line/src/config/init');

configure({
	scheduler: {
		backend: SQSScheduler,
		sqs_queue_url: 'https://sqs.eu-west-3.amazonaws.com/024141332290/control-assembly-line-test-queue',
		sqs_client: {
			region: 'eu-west-3'
		}
	}
});

const addNumbers = (a, b) => {
	console.log('Will try to add', a, b);
	return a + b;
};

// Move this date to test ETAs
const task = task_decorator(addNumbers, {
	max_retries: 3,
	eta: '2023-10-29T20:30:00.000Z'
});

// Send to SQS
task.delay(Math.random(), Math.random()).then(e => {
	console.log('Delayed!');
}).catch(e => {
	console.error("ERROR");
	console.error(e);
});


const { strategy } = get_config();

strategy.consume().then(result => {
	console.log('TASK RESULT', result);
}).catch(e => {
	console.error('CONSUMING ERROR', e);
});

process.on('uncaughtException', e => {
	console.error('Uncaught', e);
});

process.on('unhandledRejection', e => {
	console.error('Unhandled', e);
});

process.on('beforeExit', (...args) => {
	console.log('BEFORE', args);
});

process.on('exit', (...args) => {
	console.log('EXIT', args);
});

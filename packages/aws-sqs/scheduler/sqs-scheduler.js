const {
	SQSClient,
	SendMessageCommand,
	ReceiveMessageCommand,
	DeleteMessageBatchCommand
} = require('@aws-sdk/client-sqs');
const { Task, Scheduler } = require('@control/assembly-line');

// @see: https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-sqs/interfaces/sqsclientconfig.html
const DEFAULT_CONFIG = {
	sqs_client: {
		credentials: null,
		customUserAgent: null,
		retryMode: 'standard'
	},
	sqs_queue_url: '',
	sqs_consumer_config: {},
	// Setting this to any value will enable long polling
	waitTimeSeconds: null
};

class SQSScheduler extends Scheduler {
	constructor(config={}) {
		super({
			...DEFAULT_CONFIG,
			...config
		});

		this.client = new SQSClient(this.config.sqs_client);
	}

	schedule_task({ task_name, eta, sqs_queue_url=null, ...rest }) {
		// Put task into SQS queue, we can also add a signature later

		// if offset was specified, eta was automatically calculated
		let delay = null;
		if(eta) {
			const eta_date = new Date(eta);
			delay = Math.round((eta_date.getTime() - Date.now()) / 1000);
		}

		// SQS accepts a max of 900 seconds
		// this means that we can delay until we start getting it before
		// and then delay to _exactly_ the eta. SQS will probably try
		// to match it good (bypass the queue?). To verify
		delay = delay ? Math.min(delay, 900) : null;

		const command = new SendMessageCommand({
			QueueUrl: sqs_queue_url || this.config.sqs_queue_url,
			MessageBody: JSON.stringify(Task.to_task({
				task_name,
				eta,
				...rest
			})),
			DelaySeconds: delay,
			MessageAttributes: {}, // could add signature here if on config
		});

		return this.client.send(command);
	}

	consume_tasks() {
		// This consumer "manually" consumes records from the SQS queue.
		// How will we put those records back? who knows
		const { AttributeNames=['All'], MessageAttributeNames=['All'] } = this.config.sqs_consumer_config;

		const command = new ReceiveMessageCommand({
			MaxNumberOfMessages: this.config.quantity || 1,
			QueueUrl: this.config.sqs_queue_url,
			AttributeNames,
			MessageAttributeNames,
			VisibilityTimeout: null,
			WaitTimeSeconds: this.config.waitTimeSeconds,
			ReceiveRequestAttemptId: '',
		});

		return this.client.send(command).then((body) => {
			const { Messages: messages=[] } = body;

			const tasks = messages.map(({ Attributes, MessageAttributes, Body: body }) => {
				const task_definition = JSON.parse(body);
				task_definition.options = task_definition.options || {};
				task_definition.options.sqs_metadata = {
					Attributes,
					MessageAttributes
				};

				return task_definition;
			});

			let delete_messages_promise = null;
			if(messages.length) {

				// Entries for DeleteMessageBatchRequestEntry
				const delete_entries = messages.map(({ ReceiptHandle, MessageId }) => {
					return {
						Id: MessageId,
						ReceiptHandle
					};
				});

				const delete_messages_command = new DeleteMessageBatchCommand({
					QueueUrl: this.config.sqs_queue_url,
					Entries: delete_entries
				});

				const delete_messages_promise = this.client.send(delete_messages_command);
			}

			return Promise.all([tasks, delete_messages_promise]);
		}).then(([tasks]) => tasks);
	}
}

module.exports = { SQSScheduler };

#!/usr/bin/env node

const os = require('node:os');
const argumentate = require('argumentate');

const { options, variables } = argumentate({
	args: process.argv.slice(2),
	mapping: {
		c: {
			key: 'config',
			help: 'Path to configuration file. Relative to CWD (default is "./.assembly-line.json"). Can also be passed from env ASSEMBLY_LINE_CONFIG'
		},
		x: {
			key: 'concurrency',
			help: 'How many workers to spawn. Default is "os.cpus().length"'
		},
		t: {
			key: 'tasks',
			help: 'Path to task discovery file. Can be used multiple times'
		}
	},
	config: {
		name: "AssemblyLine",
		command: "assembly-line"
	}
});

if(options.config) {
	// Override env for workers and main process config
	process.env.ASSEMBLY_LINE_CONFIG = options.config;
}

const assembly_config = {};
if(options.concurrency) {
	assembly_config.system = {
		worker_count: options.concurrency
	};
}

if(options.tasks?.length) {
	const tasks = Array.isArray(options.tasks) ? options.tasks : [options.tasks];
	assembly_config.tasks = {
		discovery_paths: tasks
	};
}


const { config } = require('../src/config')(assembly_config);

const AssemblyLine = require('../src/assembly');

al = new AssemblyLine({ config });

al.run().then(() => {
	// All workers killed & app existed successfully
	process.exit(0);
}).catch(e => {
	console.error('Fatal', e);
	process.exit(1);
});

process.on('SIGINT', () => {
	console.log('Gracefully killing');
	al.terminate();
});

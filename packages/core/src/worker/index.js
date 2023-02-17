const { workerData, threadId } = require('node:worker_threads');

const { AssemblyWorker } = require('./worker');

const worker = new AssemblyWorker();

worker.run();

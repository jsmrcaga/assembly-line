const { workerData, threadId } = require('node:worker_threads');

const { config: config_overrides } = workerData;
// Preload config with overrides
const { config } = require('../config')(config_overrides);

const { AssemblyWorker } = require('./worker');

const worker = new AssemblyWorker(config);

worker.run();

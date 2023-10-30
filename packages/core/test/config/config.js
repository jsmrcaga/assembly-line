const { expect } = require('chai');
const { Scheduler } = require('../../src/scheduler/scheduler');
const { Strategy } = require('../../src/strategy/strategy');

const CONFIG_PATH = '../../src/config';

describe('Config', () => {
	afterEach(() => {
		// Clear require cache
		delete require.cache[require.resolve(CONFIG_PATH)];
		delete process.env.ASSEMBLY_LINE_CONFIG;
	});

	it('Should get default config along with scheduler and strategy', () => {
		const configgetter = require(CONFIG_PATH);
		const { config } = configgetter();

		const init_config = require(`${CONFIG_PATH}/init`);
		const { scheduler, strategy } = init_config();

		expect(scheduler).to.be.instanceof(Scheduler);
		expect(strategy).to.be.instanceof(Strategy);
		expect(config).to.be.eql(configgetter.DEFAULT_CONFIG);
	});

	it('Should override config if necessary', () => {
		const configgetter = require(CONFIG_PATH);
		const { config, scheduler, strategy } = configgetter({
			system: {
				worker_count: 56
			},
			tasks: {
				discovery_paths: []
			},
			scheduler: {
				throw_on_invalid_task: true
			},
			strategy: {
				empty_queue_wait_ms: 10
			}
		});

		expect(config.system.worker_count).to.be.eql(56);
		expect(config.system.worker_count).not.to.be.eql(configgetter.DEFAULT_CONFIG.system.worker_count);
		expect(config.tasks.discovery_paths).to.be.eql([]);

		expect(config.scheduler.throw_on_invalid_task).to.be.true;
		// Verify it has not changed
		expect(config.scheduler.backend).to.be.eql(configgetter.DEFAULT_CONFIG.scheduler.backend);

		expect(config.strategy.empty_queue_wait_ms).to.be.eql(10);
		expect(config.strategy.backend).to.be.eql('eager-on-end');
	});

	it('Imports config from a specific JSON file', () => {
		process.env.ASSEMBLY_LINE_CONFIG = './test/mocks/config/fake-config.json';
		const configgetter = require(CONFIG_PATH);
		const { config } = configgetter();

		// Same config as above but in JSON
		expect(config.system.worker_count).to.be.eql(56);
		expect(config.system.worker_count).not.to.be.eql(configgetter.DEFAULT_CONFIG.system.worker_count);
		expect(config.tasks.discovery_paths).to.be.eql([]);

		expect(config.scheduler.throw_on_invalid_task).to.be.true;
		// Verify it has not changed
		expect(config.scheduler.backend).to.be.eql(configgetter.DEFAULT_CONFIG.scheduler.backend);

		expect(config.strategy.empty_queue_wait_ms).to.be.eql(10);
		expect(config.strategy.backend).to.be.eql('eager-on-end');
	});

	it('Imports config from a specific JS file as a function', () => {
		process.env.ASSEMBLY_LINE_CONFIG = './test/mocks/config/fake-config-func.js';
		const configgetter = require(CONFIG_PATH);
		const { config } = configgetter();

		// Same config as above but in JSON
		expect(config.system.worker_count).to.be.eql(56);
		expect(config.system.worker_count).not.to.be.eql(configgetter.DEFAULT_CONFIG.system.worker_count);
		expect(config.tasks.discovery_paths).to.be.eql([]);

		expect(config.scheduler.throw_on_invalid_task).to.be.true;
		// Verify it has not changed
		expect(config.scheduler.backend).to.be.eql(configgetter.DEFAULT_CONFIG.scheduler.backend);

		expect(config.strategy.empty_queue_wait_ms).to.be.eql(10);
		expect(config.strategy.backend).to.be.eql('eager-on-end');
	});

	it('Imports config from a specific JS file as an object', () => {
		process.env.ASSEMBLY_LINE_CONFIG = './test/mocks/config/fake-config.js';
		const configgetter = require(CONFIG_PATH);
		const { config } = configgetter();

		// Same config as above but in JSON
		expect(config.system.worker_count).to.be.eql(56);
		expect(config.system.worker_count).not.to.be.eql(configgetter.DEFAULT_CONFIG.system.worker_count);
		expect(config.tasks.discovery_paths).to.be.eql([]);

		expect(config.scheduler.throw_on_invalid_task).to.be.true;
		// Verify it has not changed
		expect(config.scheduler.backend).to.be.eql(configgetter.DEFAULT_CONFIG.scheduler.backend);

		expect(config.strategy.empty_queue_wait_ms).to.be.eql(10);
		expect(config.strategy.backend).to.be.eql('eager-on-end');
	});
});

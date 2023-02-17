const Sinon = require('sinon');
const { expect } = require('chai');
const { registry } = require('../../src/registry/registry');

describe('Registry', () => {
	let console_warn_stub = null;
	let console_trace_stub = null;
	beforeEach(() => {
		console_warn_stub = Sinon.stub(console, 'warn');
		console_trace_stub = Sinon.stub(console, 'trace');
	});

	afterEach(() => {
		console_warn_stub.restore();
		console_trace_stub.restore();
	});

	it('Registers a callback with given name and is able to find it', () => {
		const cb = () => {};
		registry.register('plep', cb);
		const { callback } = registry.find('plep');

		expect(callback).to.be.eql(cb);
	});

	it('Registers a callback with given name multiple times and warns the user', () => {
		const cb = () => {};
		registry.register('task-1', cb, { trace_memory_leak: false });
		registry.register('task-2', cb, { trace_memory_leak: false });
		registry.register('task-3', cb, { trace_memory_leak: false });
		registry.register('task-4', cb, { trace_memory_leak: false });

		expect(console_trace_stub.callCount).to.be.eql(0);
		expect(console_warn_stub.callCount).to.be.eql(2);
		expect(console_warn_stub.firstCall.args).to.be.eql([`Assembly Line Warning: task "task-3" is being registered multiple times (3), this could mean you have a memory leak`]);
		expect(console_warn_stub.secondCall.args).to.be.eql([`Assembly Line Warning: task "task-4" is being registered multiple times (4), this could mean you have a memory leak`]);
	});

	it('Registers a callback with given name multiple times and warns the user + trace', () => {
		const cb = () => {};
		registry.register('task-1', cb);
		registry.register('task-2', cb);
		registry.register('task-3', cb);
		registry.register('task-4', cb);

		expect(console_trace_stub.callCount).to.be.eql(2);
		expect(console_warn_stub.callCount).to.be.eql(2);
		expect(console_warn_stub.firstCall.args).to.be.eql([`Assembly Line Warning: task "task-3" is being registered multiple times (3), this could mean you have a memory leak`]);
		expect(console_warn_stub.secondCall.args).to.be.eql([`Assembly Line Warning: task "task-4" is being registered multiple times (4), this could mean you have a memory leak`]);

		expect(console_trace_stub.firstCall.args).to.be.eql(['Possible Memory leak trace:']);
		expect(console_trace_stub.secondCall.args).to.be.eql(['Possible Memory leak trace:']);
	});
});

const Sinon = require('sinon');
const { expect } = require('chai');

const Importer = require('../../src/importer/importer');

describe('Importer', () => {
	it('Imports normal modules (non-functions)', done => {
		const stub = Sinon.stub(Importer, 'require').returns({});

		Importer.discover_tasks({
			config: {},
			discovery_paths: ['./fake-path.js', './fake-path-2.js']
		}).then(results => {
			stub.restore();

			expect(results.length).to.be.eql(2);
			expect(results[0]).to.be.eql({});
			expect(results[1]).to.be.eql({});
			done();
		}).catch(e => {
			stub.restore();
			done(e);
		});
	});

	it('Imports functions', done => {
		const stub = Sinon.stub(Importer, 'require').returns(() => ({}));

		Importer.discover_tasks({
			config: {},
			discovery_paths: ['./fake-path.js', './fake-path-2.js']
		}).then(results => {
			stub.restore();

			expect(results.length).to.be.eql(2);
			expect(results[0]).to.be.eql({});
			expect(results[1]).to.be.eql({});
			done();
		}).catch(e => {
			stub.restore();
			done(e);
		});
	});

	it('Imports promises', done => {
		const stub = Sinon.stub(Importer, 'require').returns(() => {
			return Promise.resolve({});
		});

		Importer.discover_tasks({
			config: {},
			discovery_paths: ['./fake-path.js', './fake-path-2.js']
		}).then(results => {
			stub.restore();

			expect(results.length).to.be.eql(2);
			expect(results[0]).to.be.eql({});
			expect(results[1]).to.be.eql({});
			done();
		}).catch(e => {
			stub.restore();
			done(e);
		});
	});
});


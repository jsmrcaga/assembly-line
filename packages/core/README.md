# @control/assembly-line
# Core package

This package enables the core functionality of AssemblyLine, and provides the CLI as well.

## AssemblyLine
AssemblyLine is a simple task management library hevily inspired by [Celery](https://docs.celeryq.dev/en/stable/index.html).

Its main objective is to provide developers with an easy-to-use interface to schedule
asynchronous tasks while allowing some room for custom implementations.

This is done in two main parts

* 1/ in-codebase declarations & scheduling
	* no more extra repos for lambda tasks etc
	* you can use your current libraries and OR/DMs
	* you can "delay" your tasks from your codebase imperatively, no need to "call an external service"

* 2/ easy deployments
	* deploying is just a matter of getting the same codebase and launching it with a different command


## tl;dr

### Config
The most important part of your configuration will be the `ASSEMBLY_LINE_CONFIG` key, which 
allows the lib to find the configuration file.
This will be `./.assembly-line` by default.

```sh
ASSEMBLY_LINE_CONFIG="./assembly-line.json"
```

### Usage

```js
const yourDatabase = require('./your-database');
const { task_decorator } = require('@control/assembly-line');

function sumAndStore(x, y) {
	return yourDatabase.store(x + y);
}

const sumAndStoreInAnotherServer = task_decorator(sumAndStore);

function performSum() {
	const x = yourDatabase.getX();
	const y = yourDatabase.getY();

	// Will be executed in the tasks worker somewhere else
	// And will store result to database
	sumAndStoreInAnotherServer.delay(x, y);
}
```

Once [JavaScript Decorators](https://github.com/tc39/proposal-decorators) land we will be able to do it Celery-style:
```js
@task
function sumAndStore(x, y) {
	return yourDatabase.store(x + y);
}
```

### Deployment
```sh
@control/assembly-line --config ./yourconfig.json 
```



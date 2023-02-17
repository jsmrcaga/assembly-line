const task_decorator = require('./task/task-decorator');
function test(a, b, c) {
	return a + b + c;
}

const testAsync = task_decorator(test);

testAsync.delay(1, 2, 3);
console.log('Immediate result', testAsync(1, 2, 3));

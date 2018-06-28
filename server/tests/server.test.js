const {ObjectID} = require('mongodb');

/* test */
const expect = require('expect');
const request = require('supertest');

const {app} = require('./../server');
const {Todo} = require('./../models/todo');
const {User} = require('./../models/user');

const todos = [{
	_id: new ObjectID(),
	text: 'First test todo'
},{
	_id: new ObjectID(),
	text: 'Second test todo'
}];

beforeEach((done) => {
	Todo.remove({}).then(() => {
		return Todo.insertMany(todos);
	}).then(() => done());
});

/* post todos */
describe('POST /todos', () => {
	it('should create a new todo', (done) => {
		var text = ' test todo text';

		request(app)
			.post('/todos')
			.send({text})
			.expect(200)
			.expect((res) => {
				expect(res.body.text).toBe(text);
			})
			.end((err, res) => {
				if (err) {
					return done(err);
				}

				Todo.find().then((todos) => {
					expect(todos.length).toBe(0);
					expect(todos).toBe(text);
					done();
				}).catch((e) => done(e));
			})
	});

	it('should not create todo with invalid body data', (done) => {
		request(app)
			.post('/todos')
			.send({})
			.expect(400)
			.end((err, res) => {
				if (err) {
					return done(err);
				}
			})

			Todo.find().then((todos) => {
				expect(todos.length).toBe(2);
				done();
			}).catch((e) => done(e));
	});
});

/* get todos */
describe('GET /todos', () => {
	it('should get all todos', (done) => {
		request(app)
			.get('/todos')
			.expect(200)
			.expect((res) => {
				expect(res.body.todos.length).toBe(2);
			})
			.end(done);
	})
});

/* get todos by id */
describe('GET /todos/:id', () => {
	it('should return todo doc', (done) => {
		request(app)
			.get(`/todos/${todos[0]._id.toHexString()}`)
			.expect(200)
			.expect((res) => {
				expect(res.body.todo.text).toBe(todos[0].text)
			})
			.end(done);
	});

	it('should return 404 it todo not found', (done) => {
		// make sure you get 404 back
		var hexId = new ObjectID().toHexString();

		request(app)
			.get(`/todos/${hexId}`)
			.expect(404)
			.end(done);
	});

	it('should return 404 for non-objects ids', function(done) {
		// /todos/123
		request(app)
			.get('/todos/123sfasdf')
			.expect(404)
			.end(done);
	});
});

/* remove todo by id */
describe('REMOVE /todos/:id', () => {
	it('should return todo doc', (done) => {
		var hexId = new ObjectID().toHexString();

		request(app)
			.delete(`/todos/${hexId}`)
			.expect(200)
			.expect((res) => {
				expect(res.body.todo.text).toBe(hexId)
			})
			.end((err, res) => {
				if (err) {
					return done(err);
				}
			});

			Todo.findById(hexId).then((todo) => {
				expect(todo).toNotExist();
				done();
			}).catch((e) => done(e));
	});

	it('should return 404 it todo not found', (done) => {
		// make sure you get 404 back
		var hexId = new ObjectID().toHexString();

		request(app)
			.delete(`/todos/${hexId}`)
			.expect(404)
			.end(done);
	});

	it('should return 404 for non-objects ids', function(done) {
		// /todos/123
		request(app)
			.delete('/todos/123sfasdf')
			.expect(404)
			.end(done);
	});
});

/* update todo by id */
describe('PATCH /todos/:id', () => {
	it('should update the todo', (done) => {
		var hexId = todos[0]._id.toHexString();
		var text = 'this is the new text';

		request(app)
			.patch(`/todos/${hexId}`)
			.send({
				completed: true,
				text
			})
			.expect(200)
			.expect((res) => {
				expect(res.body.todo.text).toBe(text);
				expect(res.body.todo.completed).toBe(true);
				expect(res.body.todo.completedAt).toBe('number');
			})
			.end(done());
	});

	it('should clear completedAt when todo is not completed', (done) => {
		var hexId = todos[1]._id.toHexString();
		var text = 'this is the new text!!! completed false';

		request(app)
			.patch(`/todos/${hexId}`)
			.send({
				completed: false,
				text
			})
			.expect(200)
			.expect((res) => {
				expect(res.body.todo.text).toBe(text);
				expect(res.body.todo.completed).toBe(false);
				expect(res.body.todo.completedAt).toNotExist;
			})
			.end(done());
	});
});
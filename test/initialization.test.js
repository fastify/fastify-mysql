'use strict'

const { test } = require('node:test')
const Fastify = require('fastify')
const fastifyMysql = require('../index')

test('Should not throw if registered within different scopes (with and without named instances)', (t, done) => {
  t.plan(1)

  const fastify = Fastify()
  t.after(() => fastify.close())

  fastify.register(function scopeOne (instance, _opts, next) {
    instance.register(fastifyMysql, {
      connectionString: 'mysql://root@localhost/mysql'
    })

    next()
  })

  fastify.register(function scopeTwo (instance, _opts, next) {
    instance.register(fastifyMysql, {
      connectionString: 'mysql://root@localhost/mysql',
      name: 'one'
    })

    instance.register(fastifyMysql, {
      connectionString: 'mysql://root@localhost/mysql',
      name: 'two'
    })

    next()
  })

  fastify.ready((errors) => {
    t.assert.ifError(errors)
    done()
  })
})

test('Should throw when trying to register multiple instances without giving a name', (t, done) => {
  t.plan(2)

  const fastify = Fastify()
  t.after(() => fastify.close())

  fastify.register(fastifyMysql, {
    connectionString: 'mysql://root@localhost/mysql'
  })

  fastify.register(fastifyMysql, {
    connectionString: 'mysql://root@localhost/mysql'
  })

  fastify.ready((errors) => {
    t.assert.ok(errors)
    t.assert.strictEqual(errors.message, 'fastify-mysql has already been registered')
    done()
  })
})

test('Should throw with duplicate connection names', (t, done) => {
  t.plan(2)

  const fastify = Fastify()
  t.after(() => fastify.close())
  const name = 'test'

  fastify
    .register(fastifyMysql, {
      connectionString: 'mysql://root@localhost/mysql',
      name
    })
    .register(fastifyMysql, {
      connectionString: 'mysql://root@localhost/mysql',
      name
    })

  fastify.ready((errors) => {
    t.assert.ok(errors)
    t.assert.strictEqual(errors.message, `fastify-mysql '${name}' instance name has already been registered`)
    done()
  })
})

test('Should throw when mysql2 fail', (t, done) => {
  t.plan(2)

  const fastify = Fastify()
  t.after(() => fastify.close())

  const BAD_PORT = 6000
  const HOST = '127.0.0.1'

  // We try to access through a wrong port (MySQL listen on port 3306)
  fastify.register(fastifyMysql, {
    host: HOST,
    port: BAD_PORT
  })

  fastify.ready((errors) => {
    t.assert.ok(errors)
    t.assert.strictEqual(errors.message, `connect ECONNREFUSED ${HOST}:${BAD_PORT}`)
    done()
  })
})

test('Promise: Should throw when mysql2 fail', (t, done) => {
  t.plan(2)

  const fastify = Fastify()
  t.after(() => fastify.close())

  const BAD_PORT = 6000
  const HOST = '127.0.0.1'

  // We try to access through a wrong port (MySQL listen on port 3306)
  fastify.register(fastifyMysql, {
    host: HOST,
    port: BAD_PORT,
    promise: true
  })

  fastify.ready((errors) => {
    t.assert.ok(errors)
    t.assert.strictEqual(errors.message, `connect ECONNREFUSED ${HOST}:${BAD_PORT}`)
    done()
  })
})

test('Connection - Promise: Should throw when mysql2 fail', (t, done) => {
  t.plan(2)

  const fastify = Fastify()
  t.after(() => fastify.close())

  const BAD_PORT = 6000
  const HOST = '127.0.0.1'

  // We try to access through a wrong port (MySQL listen on port 3306)
  fastify.register(fastifyMysql, {
    host: HOST,
    port: BAD_PORT,
    promise: true,
    type: 'connection'
  })

  fastify.ready((errors) => {
    t.assert.ok(errors)
    t.assert.strictEqual(errors.message, `connect ECONNREFUSED ${HOST}:${BAD_PORT}`)
    done()
  })
})

test('Promise - Should throw when trying to register multiple instances without giving a name', (t, done) => {
  t.plan(2)

  const fastify = Fastify()
  t.after(() => fastify.close())

  fastify.register(fastifyMysql, {
    connectionString: 'mysql://root@localhost/mysql'
  })

  fastify.register(fastifyMysql, {
    connectionString: 'mysql://root@localhost/mysql'
  })

  fastify.ready((errors) => {
    t.assert.ok(errors)
    t.assert.strictEqual(errors.message, 'fastify-mysql has already been registered')
    done()
  })
})

test('Promise - Should throw with duplicate connection names', (t, done) => {
  t.plan(2)

  const fastify = Fastify()
  t.after(() => fastify.close())
  const name = 'test'

  fastify
    .register(fastifyMysql, {
      connectionString: 'mysql://root@localhost/mysql',
      name
    })
    .register(fastifyMysql, {
      connectionString: 'mysql://root@localhost/mysql',
      name
    })

  fastify.ready((errors) => {
    t.assert.ok(errors)
    t.assert.strictEqual(errors.message, `fastify-mysql '${name}' instance name has already been registered`)
    done()
  })
})

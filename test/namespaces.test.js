'use strict'

const t = require('tap')
const test = t.test
const Fastify = require('fastify')
const fastifyMysql = require('../index')

test('Should not throw if registered within different scopes (with and without named instances)', (t) => {
  t.plan(2)

  const fastify = Fastify()

  fastify.register(function scopeOne (instance, opts, next) {
    instance.register(fastifyMysql, {
      connectionString: 'mysql://root@localhost/mysql'
    })

    next()
  })

  fastify.register(function scopeTwo (instance, opts, next) {
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
    t.error(errors)
    t.is(errors, null)
    fastify.close()
  })
})

test('Should throw when trying to register multiple instances without giving a name', (t) => {
  t.plan(2)

  const fastify = Fastify()

  fastify.register(fastifyMysql, {
    connectionString: 'mysql://root@localhost/mysql'
  })

  fastify.register(fastifyMysql, {
    connectionString: 'mysql://root@localhost/mysql'
  })

  fastify.ready((errors) => {
    t.ok(errors)
    t.is(errors.message, 'fastify-mysql has already been registered')
    fastify.close()
  })
})

test('Should throw with duplicate connection names', (t) => {
  t.plan(1)

  const fastify = Fastify()
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
    t.is(errors.message, `fastify-mysql '${name}' instance name has already been registered`)
    fastify.close()
  })
})

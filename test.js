'use strict'

const t = require('tap')
const test = t.test
const Fastify = require('fastify')
const fastifyMysql = require('./index')

test('fastify.mysql namespace should exist', t => {
  t.plan(4)

  const fastify = Fastify()

  fastify.register(fastifyMysql, {
    connectionString: 'mysql://root@localhost/mysql'
  })

  fastify.ready(err => {
    t.error(err)
    t.ok(fastify.mysql)
    t.ok(fastify.mysql.connect)
    t.ok(fastify.mysql.pool)
    fastify.close()
  })
})

test('should be able to connect and perform a query', t => {
  t.plan(4)

  const fastify = Fastify()

  fastify.register(fastifyMysql, {
    connectionString: 'mysql://root@localhost/mysql'
  })

  fastify.ready(err => {
    t.error(err)
    fastify.mysql.connect(onConnect)
  })

  function onConnect (err, client) {
    t.error(err)
    client.query('SELECT NOW()', (err, result) => {
      client.release()
      t.error(err)
      t.ok(result.length)
      fastify.close()
    })
  }
})

test('use query util', t => {
  t.plan(3)

  const fastify = Fastify()

  fastify.register(fastifyMysql, {
    connectionString: 'mysql://root@localhost/mysql'
  })

  fastify.ready(err => {
    t.error(err)
    fastify.mysql.query('SELECT NOW()', (err, result) => {
      t.error(err)
      t.ok(result.length)
      fastify.close()
    })
  })
})

test('fastify.mysql.test namespace should exist', t => {
  t.plan(5)

  const fastify = Fastify()

  fastify.register(fastifyMysql, {
    name: 'test',
    connectionString: 'mysql://mysql@localhost/mysql'
  })

  fastify.ready(err => {
    t.error(err)
    t.ok(fastify.mysql)
    t.ok(fastify.mysql.test)
    t.ok(fastify.mysql.test.connect)
    t.ok(fastify.mysql.test.pool)
    fastify.close()
  })
})

test('fastify.mysql.test should be able to connect and perform a query', t => {
  t.plan(4)

  const fastify = Fastify()

  fastify.register(fastifyMysql, {
    name: 'test',
    connectionString: 'mysql://root@localhost/mysql'
  })

  fastify.ready(err => {
    t.error(err)
    fastify.mysql.test.connect(onConnect)
  })

  function onConnect (err, client) {
    t.error(err)
    client.query('SELECT NOW()', (err, result) => {
      client.release()
      t.error(err)
      t.ok(result.length)
      fastify.close()
    })
  }
})

test('fastify.mysql.test use query util', t => {
  t.plan(3)

  const fastify = Fastify()

  fastify.register(fastifyMysql, {
    name: 'test',
    connectionString: 'mysql://root@localhost/mysql'
  })

  fastify.ready(err => {
    t.error(err)
    fastify.mysql.test.query('SELECT NOW()', (err, result) => {
      t.error(err)
      t.ok(result.length)
      fastify.close()
    })
  })
})

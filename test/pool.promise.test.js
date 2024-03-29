'use strict'

const test = require('tap').test
const Fastify = require('fastify')
const fastifyMysql = require('../index')
const { isMySQLPromisePool, isMySQLPromiseConnection, isMySQLPool, isMySQLConnection } = fastifyMysql

test('promise pool', (t) => {
  let fastify

  t.beforeEach(() => {
    fastify = Fastify()
    fastify.register(fastifyMysql, {
      promise: true,
      host: 'localhost',
      user: 'root',
      database: 'mysql',
      connectionLimit: 1
    })
  })

  t.afterEach(() => {
    fastify.close()
  })

  t.test('mysql.pool.query', (t) => {
    t.plan(3)

    fastify.ready((err) => {
      t.error(err)

      fastify.mysql.query('SELECT 1 AS `ping`')
        .then(([results, fields]) => {
          t.ok(results[0].ping === 1)
          t.ok(fields)
        })
    })
  })

  t.test('mysql.pool.execute', (t) => {
    t.plan(3)

    fastify.ready((err) => {
      t.error(err)

      fastify.mysql.execute('SELECT ? AS `ping`', [1])
        .then(([results, fields]) => {
          t.ok(results[0].ping === 1)
          t.ok(fields)
        })
    })
  })

  t.test('promise pool.getConnection', (t) => {
    t.plan(7)

    fastify.ready((err) => {
      t.error(err)

      fastify.mysql.getConnection()
        .then((connection) => {
          connection.query('SELECT 2 AS `ping`')
            .then(([results, fields]) => {
              t.ok(results[0].ping === 2)
              t.ok(fields)
              connection.release()
            })
        })

      fastify.mysql.query('SELECT 3 AS `ping`')
        .then(([results, fields]) => {
          t.ok(results[0].ping === 3)
          t.ok(fields)
        })

      fastify.mysql.execute('SELECT ? AS `ping`', [3])
        .then(([results, fields]) => {
          t.ok(results[0].ping === 3)
          t.ok(fields)
        })
    })
  })

  t.end()
})

test('isMySQLPromisePool is true', (t) => {
  t.plan(5)
  const fastify = Fastify()
  fastify.register(fastifyMysql, {
    promise: true,
    connectionString: 'mysql://root@localhost/mysql'
  })
  fastify.ready((err) => {
    t.error(err)
    t.equal(isMySQLPromisePool(fastify.mysql), true)
    t.equal(isMySQLPromiseConnection(fastify.mysql), false)
    t.equal(isMySQLPool(fastify.mysql), false)
    t.equal(isMySQLConnection(fastify.mysql), false)
    t.end()
  })
  fastify.close()
})

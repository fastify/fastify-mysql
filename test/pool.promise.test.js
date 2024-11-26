'use strict'

const { test } = require('node:test')
const Fastify = require('fastify')
const fastifyMysql = require('../index')
const { isMySQLPromisePool, isMySQLPromiseConnection, isMySQLPool, isMySQLConnection } = fastifyMysql

test('promise pool', async (t) => {
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

  await t.test('mysql.pool.query', (t, done) => {
    t.plan(3)

    fastify.ready((err) => {
      t.assert.ifError(err)

      fastify.mysql.query('SELECT 1 AS `ping`')
        .then(([results, fields]) => {
          t.assert.ok(results[0].ping === 1)
          t.assert.ok(fields)
          done()
        })
    })
  })

  await t.test('mysql.pool.execute', (t, done) => {
    t.plan(3)

    fastify.ready((err) => {
      t.assert.ifError(err)

      fastify.mysql.execute('SELECT ? AS `ping`', [1])
        .then(([results, fields]) => {
          t.assert.ok(results[0].ping === 1)
          t.assert.ok(fields)
          done()
        })
    })
  })

  await t.test('promise pool.getConnection', (t, done) => {
    t.plan(7)

    fastify.ready((err) => {
      t.assert.ifError(err)

      fastify.mysql.getConnection()
        .then((connection) => {
          connection.query('SELECT 2 AS `ping`')
            .then(([results, fields]) => {
              t.assert.ok(results[0].ping === 2)
              t.assert.ok(fields)
              connection.release()
            })
        })

      fastify.mysql.query('SELECT 3 AS `ping`')
        .then(([results, fields]) => {
          t.assert.ok(results[0].ping === 3)
          t.assert.ok(fields)
        })

      fastify.mysql.execute('SELECT ? AS `ping`', [3])
        .then(([results, fields]) => {
          t.assert.ok(results[0].ping === 3)
          t.assert.ok(fields)
          done()
        })
    })
  })
})

test('isMySQLPromisePool is true', (t, done) => {
  t.plan(5)
  const fastify = Fastify()
  fastify.register(fastifyMysql, {
    promise: true,
    connectionString: 'mysql://root@localhost/mysql'
  })
  t.after(() => fastify.close())

  fastify.ready((err) => {
    t.assert.ifError(err)
    t.assert.strictEqual(isMySQLPromisePool(fastify.mysql), true)
    t.assert.strictEqual(isMySQLPromiseConnection(fastify.mysql), false)
    t.assert.strictEqual(isMySQLPool(fastify.mysql), false)
    t.assert.strictEqual(isMySQLConnection(fastify.mysql), false)
    done()
  })
})

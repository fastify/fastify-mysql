'use strict'

const test = require('tap').test
const Fastify = require('fastify')
const fastifyMysql = require('../index')

test('promise pool', (t) => {
  let fastify = false
  t.beforeEach((done) => {
    fastify = Fastify()
    fastify.register(fastifyMysql, {
      promise: true,
      host: 'localhost',
      user: 'root',
      database: 'mysql',
      connectionLimit: 1
    })
    done()
  })

  t.afterEach((done) => {
    fastify.close()
    done()
  })

  t.test('mysql.pool.query', (t) => {
    fastify.ready((err) => {
      t.error(err)
      fastify.mysql.query('SELECT 1 AS `ping`')
        .then(([results, fields]) => {
          t.ok(results[0].ping === 1)
          t.ok(fields)
          t.end()
        })
    })
  })

  t.test('promise pool.getConnection', (t) => {
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
          t.end()
        })
    })
  })

  t.test('mysql.end', (t) => {
    fastify.ready((err) => {
      t.error(err)
      fastify.mysql.end()
        .then((error) => {
          t.error(error)
          t.ok(fastify.mysql.pool.pool._closed)
          t.end()
        })
    })
  })

  t.end()
})

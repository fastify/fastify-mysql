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
      connectionLimit: 5,

      // Compatibility option, causes Promise to return an array object, [rows, metadata].
      // rather than the rows as JSON objects with a meta property.
      metaAsArray: true
    })
    done()
  })

  t.afterEach((done) => {
    fastify.close()
    fastify = null
    done()
  })

  t.test('mysql.pool.query', (t) => {
    fastify.ready((err) => {
      t.error(err)
      fastify.mysql.query('SELECT 1 AS `ping`')
        .then(([results, metadata]) => {
          t.ok(results[0].ping === 1)
          t.ok(metadata)
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
            .then(([results]) => {
              t.ok(results[0].ping === 2)
              connection.release()
            })
        })
      fastify.mysql.query('SELECT 3 AS `ping`')
        .then(([results]) => {
          t.ok(results[0].ping === 3)
          t.end()
        })
    })
  })

  t.end()
})

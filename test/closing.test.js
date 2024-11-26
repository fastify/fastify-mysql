'use strict'

const { test } = require('node:test')
const Fastify = require('fastify')
const fastifyMysql = require('../index')

test('callback connection', (t, done) => {
  let fastify = null

  fastify = Fastify()
  fastify.register(fastifyMysql, {
    type: 'connection',
    connectionString: 'mysql://root@localhost/mysql'
  })
  t.after(() => fastify.close())

  fastify.ready((err) => {
    t.assert.ifError(err)

    fastify.mysql.query('SELECT 1 AS `ping`', (err, results) => {
      t.assert.ifError(err)
      t.assert.ok(results[0].ping === 1)
      done()
    })
  })
})

test('promise connection', (t, done) => {
  let fastify = null

  fastify = Fastify()
  fastify.register(fastifyMysql, {
    promise: true,
    type: 'connection',
    connectionString: 'mysql://root@localhost/mysql'
  })
  t.after(() => fastify.close())

  fastify.ready((err) => {
    t.assert.ifError(err)

    fastify.mysql.query('SELECT 1 AS `ping`').then(([results]) => {
      t.assert.ok(results[0].ping === 1)
      done()
    })
  })
})

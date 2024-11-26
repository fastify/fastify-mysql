'use strict'

const { test } = require('node:test')
const Fastify = require('fastify')
const fastifyMysql = require('../index')
const { isMySQLPool, isMySQLPromisePool, isMySQLConnection, isMySQLPromiseConnection } = fastifyMysql

test('fastify.mysql namespace should exist', (t, done) => {
  const fastify = Fastify()
  fastify.register(fastifyMysql, {
    type: 'connection',
    name: 'test',
    host: 'localhost',
    user: 'root',
    database: 'mysql'
  })
  t.after(() => fastify.close())

  fastify.ready((err) => {
    t.assert.ifError(err)
    t.assert.ok(fastify.mysql)
    t.assert.ok(fastify.mysql.test)
    t.assert.ok(fastify.mysql.test.connection)
    t.assert.ok(fastify.mysql.test.query)
    t.assert.ok(fastify.mysql.test.execute)

    t.assert.ok(fastify.mysql.test.format)
    t.assert.ok(fastify.mysql.test.escape)
    t.assert.ok(fastify.mysql.test.escapeId)

    done()
  })
})

test('utils should work', async (t) => {
  let fastify = null
  t.beforeEach(() => {
    fastify = Fastify()

    fastify.register(fastifyMysql, {
      type: 'connection',
      connectionString: 'mysql://root@localhost/mysql'
    })
  })

  t.afterEach(() => {
    fastify.close()
    fastify = null
  })

  await t.test('query util', (t, done) => {
    fastify.ready((err) => {
      t.assert.ifError(err)

      fastify.mysql.query('SELECT 1 AS `ping`', (err, results) => {
        t.assert.ifError(err)
        t.assert.ok(results[0].ping === 1)
        done()
      })
    })
  })

  await t.test('execute util', (t, done) => {
    fastify.ready((err) => {
      t.assert.ifError(err)

      fastify.mysql.execute('SELECT ? as `ping`', [1], (err, results) => {
        t.assert.ifError(err)
        t.assert.ok(results[0].ping === 1)
        done()
      })
    })
  })

  await t.test('format util', (t, done) => {
    fastify.ready((err) => {
      t.assert.ifError(err)

      const sqlString = fastify.mysql.format('SELECT ? AS `now`', [1])
      t.assert.strictEqual('SELECT 1 AS `now`', sqlString)
      done()
    })
  })

  await t.test('escape util', (t, done) => {
    fastify.ready((err) => {
      t.assert.ifError(err)

      const id = 'userId'
      const sql = 'SELECT * FROM users WHERE id = ' + fastify.mysql.escape(id)
      t.assert.strictEqual(sql, `SELECT * FROM users WHERE id = '${id}'`)
      done()
    })
  })

  await t.test('escapeId util', (t, done) => {
    fastify.ready((err) => {
      t.assert.ifError(err)

      const sorter = 'date'
      const sql = 'SELECT * FROM posts ORDER BY ' + fastify.mysql.escapeId('posts.' + sorter)
      t.assert.strictEqual(sql, 'SELECT * FROM posts ORDER BY `posts`.`date`')
      done()
    })
  })
})

test('promise connection', async (t) => {
  let fastify = null
  t.beforeEach(() => {
    fastify = Fastify()

    fastify.register(fastifyMysql, {
      promise: true,
      type: 'connection',
      connectionString: 'mysql://root@localhost/mysql'
    })
  })
  t.afterEach(() => {
    fastify.close()
    fastify = null
  })

  await t.test('query util', (t, done) => {
    fastify.ready((err) => {
      t.assert.ifError(err)

      fastify.mysql.query('SELECT 1 AS `ping`').then(([results]) => {
        t.assert.ok(results[0].ping === 1)
        done()
      })
    })
  })

  await t.test('execute util', (t, done) => {
    fastify.ready((err) => {
      t.assert.ifError(err)

      fastify.mysql.execute('SELECT ? AS `ping`', [1]).then(([results]) => {
        t.assert.ok(results[0].ping === 1)
        done()
      })
    })
  })

  await t.test('format util', (t, done) => {
    fastify.ready((err) => {
      t.assert.ifError(err)

      const sqlString = fastify.mysql.format('SELECT ? AS `now`', [1])
      t.assert.strictEqual('SELECT 1 AS `now`', sqlString)
      done()
    })
  })

  await t.test('escape util', (t, done) => {
    fastify.ready((err) => {
      t.assert.ifError(err)

      const id = 'userId'
      const sql = 'SELECT * FROM users WHERE id = ' + fastify.mysql.escape(id)
      t.assert.strictEqual(sql, `SELECT * FROM users WHERE id = '${id}'`)
      done()
    })
  })

  await t.test('escapeId util', (t, done) => {
    fastify.ready((err) => {
      t.assert.ifError(err)

      const sorter = 'date'
      const sql = 'SELECT * FROM posts ORDER BY ' + fastify.mysql.escapeId('posts.' + sorter)
      t.assert.strictEqual(sql, 'SELECT * FROM posts ORDER BY `posts`.`date`')
      done()
    })
  })

  await t.test('Should throw when mysql2 fail to perform operation', (t, done) => {
    fastify.ready((err) => {
      t.assert.ifError(err)

      const sorter = 'date'
      const sql = 'SELECT * FROM posts ORDER BY ' + fastify.mysql.escapeId('posts.' + sorter)
      t.assert.strictEqual(sql, 'SELECT * FROM posts ORDER BY `posts`.`date`')
      done()
    })
  })
})

test('isMySQLConnection is true', (t, done) => {
  t.plan(5)
  const fastify = Fastify()
  fastify.register(fastifyMysql, {
    type: 'connection',
    connectionString: 'mysql://root@localhost/mysql'
  })
  t.after(() => fastify.close())

  fastify.ready((err) => {
    t.assert.ifError(err)
    t.assert.strictEqual(isMySQLConnection(fastify.mysql), true)
    t.assert.strictEqual(isMySQLPool(fastify.mysql), false)
    t.assert.strictEqual(isMySQLPromiseConnection(fastify.mysql), false)
    t.assert.strictEqual(isMySQLPromisePool(fastify.mysql), false)
    done()
  })
})

test('isMySQLPromiseConnection is true', (t, done) => {
  t.plan(5)
  const fastify = Fastify()
  fastify.register(fastifyMysql, {
    promise: true,
    type: 'connection',
    connectionString: 'mysql://root@localhost/mysql'
  })
  t.after(() => fastify.close())

  fastify.ready((err) => {
    t.assert.ifError(err)
    t.assert.strictEqual(isMySQLPromiseConnection(fastify.mysql), true)
    t.assert.strictEqual(isMySQLPromisePool(fastify.mysql), false)
    t.assert.strictEqual(isMySQLConnection(fastify.mysql), false)
    t.assert.strictEqual(isMySQLPool(fastify.mysql), false)
    done()
  })
})

test('Promise: should throw when mysql2 fail to perform operation', (t, done) => {
  t.plan(3)

  const fastify = Fastify()
  t.after(() => fastify.close())

  fastify.register(fastifyMysql, {
    type: 'connection',
    name: 'test',
    host: 'localhost',
    user: 'root',
    database: 'mysql',
    promise: true
  })

  fastify.ready((err) => {
    t.assert.ifError(err)

    const sql = 'SELECT fastify FROM fastify'

    fastify.mysql.test.connection.query(sql).catch((errors) => {
      t.assert.ok(errors)
      t.assert.strictEqual(errors.message, "Table 'mysql.fastify' doesn't exist")
      done()
    })
  })
})

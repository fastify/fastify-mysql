'use strict'

const { test } = require('node:test')
const Fastify = require('fastify')
const fastifyMysql = require('../index')
const { isMySQLPool, isMySQLPromisePool, isMySQLConnection, isMySQLPromiseConnection } = fastifyMysql

test('fastify.mysql namespace should exist', (t, done) => {
  t.plan(9)

  const fastify = Fastify()

  fastify.register(fastifyMysql, {
    connectionString: 'mysql://root@localhost/mysql'
  })
  t.after(() => fastify.close())

  fastify.ready(err => {
    t.assert.ifError(err)

    t.assert.ok(fastify.mysql)
    t.assert.ok(fastify.mysql.pool)
    t.assert.ok(fastify.mysql.query)
    t.assert.ok(fastify.mysql.execute)
    t.assert.ok(fastify.mysql.getConnection)
    t.assert.ok(fastify.mysql.format)
    t.assert.ok(fastify.mysql.escape)
    t.assert.ok(fastify.mysql.escapeId)

    done()
  })
})

test('use query util', (t, done) => {
  t.plan(3)

  const fastify = Fastify()

  fastify.register(fastifyMysql, {
    connectionString: 'mysql://root@localhost/mysql'
  })
  t.after(() => fastify.close())

  fastify.ready(err => {
    t.assert.ifError(err)

    fastify.mysql.query('SELECT NOW()', (err, result) => {
      t.assert.ifError(err)

      t.assert.ok(result.length)
      done()
    })
  })
})

test('use execute util', (t, done) => {
  t.plan(3)

  const fastify = Fastify()

  fastify.register(fastifyMysql, {
    connectionString: 'mysql://root@localhost/mysql'
  })
  t.after(() => fastify.close())

  fastify.ready(err => {
    t.assert.ifError(err)

    fastify.mysql.execute('SELECT NOW()', (err, result) => {
      t.assert.ifError(err)

      t.assert.ok(result.length)
      done()
    })
  })
})

test('use getConnection util', (t, done) => {
  t.plan(7)

  const fastify = Fastify()

  fastify.register(fastifyMysql, {
    host: 'localhost',
    user: 'root',
    database: 'mysql',
    connectionLimit: 1
  })
  t.after(() => fastify.close())

  fastify.ready((err) => {
    t.assert.ifError(err)

    fastify.mysql.getConnection((err, connection) => {
      t.assert.ifError(err)

      t.assert.ok(connection)
      connection.query('SELECT 1 AS `ping`', (err, results) => {
        t.assert.ifError(err)

        t.assert.ok(results[0].ping === 1)
        connection.release()
      })
    })
    // if not call connection.release(), it will block next query
    fastify.mysql.query('SELECT NOW()', (err, result) => {
      t.assert.ifError(err)

      t.assert.ok(result.length)
      done()
    })
  })
})

test('fastify.mysql.test namespace should exist', (t, done) => {
  t.plan(9)

  const fastify = Fastify()

  fastify.register(fastifyMysql, {
    name: 'test',
    connectionString: 'mysql://root@localhost/mysql'
  })
  t.after(() => fastify.close())

  fastify.ready(err => {
    t.assert.ifError(err)

    t.assert.ok(fastify.mysql)
    t.assert.ok(fastify.mysql.test)
    t.assert.ok(fastify.mysql.test.pool)
    t.assert.ok(fastify.mysql.test.execute)
    t.assert.ok(fastify.mysql.test.getConnection)
    t.assert.ok(fastify.mysql.test.format)
    t.assert.ok(fastify.mysql.test.escape)
    t.assert.ok(fastify.mysql.test.escapeId)

    done()
  })
})

test('synchronous functions', (t, done) => {
  const fastify = Fastify()

  fastify.register(fastifyMysql, {
    host: 'localhost',
    user: 'root',
    database: 'mysql'
  })
  t.after(() => fastify.close())

  fastify.ready((err) => {
    t.assert.ifError(err)

    test('mysql.format', (t, done) => {
      const sqlString = fastify.mysql.format('SELECT ? AS `now`', [1])
      t.assert.strictEqual('SELECT 1 AS `now`', sqlString)
      done()
    })

    test('mysql.escape', (t, done) => {
      const id = 'userId'
      const sql = 'SELECT * FROM users WHERE id = ' + fastify.mysql.escape(id)
      t.assert.strictEqual(sql, `SELECT * FROM users WHERE id = '${id}'`)
      done()
    })

    test('mysql.escapeId', (t, done) => {
      const sorter = 'date'
      const sql = 'SELECT * FROM posts ORDER BY ' + fastify.mysql.escapeId('posts.' + sorter)
      t.assert.strictEqual(sql, 'SELECT * FROM posts ORDER BY `posts`.`date`')
      done()
    })

    done()
  })
})

test('isMySQLPool is true', (t, done) => {
  t.plan(5)
  const fastify = Fastify()
  fastify.register(fastifyMysql, {
    connectionString: 'mysql://root@localhost/mysql'
  })
  t.after(() => fastify.close())

  fastify.ready((err) => {
    t.assert.ifError(err)
    t.assert.strictEqual(isMySQLPool(fastify.mysql), true)
    t.assert.strictEqual(isMySQLConnection(fastify.mysql), false)
    t.assert.strictEqual(isMySQLPromisePool(fastify.mysql), false)
    t.assert.strictEqual(isMySQLPromiseConnection(fastify.mysql), false)
    done()
  })
})

'use strict'

const t = require('tap')
const test = t.test
const Fastify = require('fastify')
const fastifyMysql = require('../index')

test('fastify.mysql namespace should exist', t => {
  t.plan(6)

  const fastify = Fastify()
  fastify.register(fastifyMysql, {
    connectionString: 'mysql://root@localhost/mysql'
  })

  fastify.ready(err => {
    t.error(err)
    t.ok(fastify.mysql)
    t.ok(fastify.mysql.pool)
    t.ok(fastify.mysql.query)
    t.ok(fastify.mysql.getConnection)
    t.ok(fastify.mysql.sqlstring)
    fastify.close()
  })
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

test('use getConnection util', t => {
  t.plan(7)

  const fastify = Fastify()
  fastify.register(fastifyMysql, {
    host: 'localhost',
    user: 'root',
    database: 'mysql',
    connectionLimit: 1
  })

  fastify.ready((err) => {
    t.error(err)
    fastify.mysql.getConnection((err, connection) => {
      t.error(err)
      t.ok(connection)
      connection.query('SELECT 1 AS `ping`', (err, results) => {
        t.error(err)
        t.ok(results[0].ping === 1)
        connection.release()
      })
    })
    // if not call connection.release(), it will block next query
    fastify.mysql.query('SELECT NOW()', (err, result) => {
      t.error(err)
      t.ok(result.length)
      fastify.close()
    })
  })
})

test('fastify.mysql.test namespace should exist', t => {
  t.plan(6)

  const fastify = Fastify()
  fastify.register(fastifyMysql, {
    name: 'test',
    connectionString: 'mysql://root@localhost/mysql'
  })

  fastify.ready(err => {
    t.error(err)
    t.ok(fastify.mysql)
    t.ok(fastify.mysql.test)
    t.ok(fastify.mysql.test.pool)
    t.ok(fastify.mysql.test.getConnection)
    t.ok(fastify.mysql.test.sqlstring)
    fastify.close()
  })
})

test('synchronous functions', (t) => {
  const fastify = Fastify()
  fastify.register(fastifyMysql, {
    host: 'localhost',
    user: 'root',
    database: 'mysql'
  })

  fastify.ready((err) => {
    t.error(err)
    test('mysql.sqlstring.format', (t) => {
      const sql = fastify.mysql.sqlstring.format('SELECT ? AS `now`', [1])
      t.is('SELECT 1 AS `now`', sql)
      t.end()
    })

    test('mysql.sqlstring.escape', (t) => {
      const id = 'userId'
      const sql = 'SELECT * FROM users WHERE id = ' + fastify.mysql.sqlstring.escape(id)
      t.is(sql, `SELECT * FROM users WHERE id = '${id}'`)
      t.end()
    })

    test('mysql.sqlstring.escapeId', (t) => {
      const sorter = 'date'
      const sql = 'SELECT * FROM posts ORDER BY ' + fastify.mysql.sqlstring.escapeId('posts.' + sorter)
      t.ok(sql, 'SELECT * FROM posts ORDER BY `posts`.`date`')
      t.end()
    })

    fastify.close()
    t.end()
  })
})

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
    t.ok(fastify.mysql.connect)
    t.ok(fastify.mysql.pool)
    t.ok(fastify.mysql.end)
    t.ok(fastify.mysql.getConnection)
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

test('test pool.end util', (t) => {
  t.plan(3)
  const fastify = Fastify()
  fastify.register(fastifyMysql, {
    host: 'localhost',
    user: 'root',
    database: 'mysql',
    connectionLimit: 1
  })

  fastify.ready((err) => {
    t.error(err)
    fastify.mysql.end((err) => {
      t.error(err)
      t.ok(fastify.mysql.pool._closed)
      fastify.close()
    })
  })
})

test('fastify.mysql.test namespace should exist', t => {
  t.plan(7)

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
    t.ok(fastify.mysql.test.end)
    t.ok(fastify.mysql.test.getConnection)
    fastify.close()
  })
})

test('promise pool', (t) => {
  t.plan(15)
  const fastify = Fastify()
  fastify.register(fastifyMysql, {
    promise: true,
    host: 'localhost',
    user: 'root',
    database: 'mysql',
    connectionLimit: 1
  })

  fastify.ready(async (err) => {
    t.error(err)
    t.ok(fastify.mysql)
    t.ok(fastify.mysql.connect)
    t.ok(fastify.mysql.pool)
    t.ok(fastify.mysql.end)
    t.ok(fastify.mysql.getConnection)

    const [results1, fields1] = await fastify.mysql.query('SELECT 1 AS `ping`')
    t.ok(results1[0].ping === 1)
    t.ok(fields1)
    const connection = await fastify.mysql.getConnection()
    t.ok(connection)
    const [results2, fields2] = await connection.query('SELECT 2 AS `ping`')
    t.ok(results2[0].ping === 2)
    t.ok(fields2)

    await connection.release()
    const [results3, fields3] = await fastify.mysql.query('SELECT 3 AS `ping`')
    t.ok(results3[0].ping === 3)
    t.ok(fields3)

    const error = await fastify.mysql.end()
    t.error(error)
    t.ok(fastify.mysql.pool.pool._closed)
    fastify.close()
  })
})

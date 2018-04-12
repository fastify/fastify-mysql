'use strict'

const fp = require('fastify-plugin')

function fastifyMysql (fastify, options, next) {
  const name = options.name
  delete options.name

  const usePromise = options.promise
  delete options.promise

  const mysql = usePromise ? require('mysql2/promise') : require('mysql2')

  const pool = mysql.createPool(options.connectionString || options)
  const db = {
    connect: onConnect => pool.getConnection(onConnect),
    pool: pool,
    query: pool.query.bind(pool),
    end: pool.end.bind(pool),
    getConnection: pool.getConnection.bind(pool)
  }

  if (name) {
    if (!fastify.mysql) {
      fastify.decorate('mysql', {})
    }
    fastify.mysql[name] = db
  } else {
    if (fastify.mysql) {
      next(new Error('fastify-mysql has already registered'))
    } else {
      fastify.mysql = db
    }
  }

  if (usePromise) {
    fastify.addHook('onClose', async (fastify, done) => {
      fastify.mysql = null
      await pool.end()
    })
  } else {
    fastify.addHook('onClose', (fastify, done) => {
      fastify.mysql = null
      pool.end(done)
    })
  }
  next()
}

module.exports = fp(fastifyMysql, {
  fastify: '>=0.13.1',
  name: 'fastify-mysql'
})

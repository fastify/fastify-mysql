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
    getConnection: pool.getConnection.bind(pool),

    // synchronous functions
    format: pool.format.bind(pool),
    escape: pool.escape.bind(pool),
    escapeId: pool.escapeId.bind(pool)
  }

  if (name) {
    if (!fastify.mysql) {
      fastify.decorate('mysql', {})
    }
    if (fastify.mysql[name]) {
      next(new Error('fastify.mysql.' + name + 'has already registered'))
      return
    }
    fastify.mysql[name] = db
  } else {
    if (fastify.mysql) {
      next(new Error('fastify-mysql has already registered'))
      return
    } else {
      fastify.mysql = db
    }
  }

  fastify.addHook('onClose', (fastify, done) => pool.end(done))

  if (usePromise) {
    pool.query('SELECT 1')
      .then(() => next())
      .catch((err) => next(err))
  } else {
    pool.query('SELECT 1', (err) => next(err))
  }
}

module.exports = fp(fastifyMysql)

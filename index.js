'use strict'

const fp = require('fastify-plugin')

function fastifyMysql (fastify, options, next) {
  const name = options.name
  delete options.name

  const usePromise = options.promise
  delete options.promise

  const { format, escape, escapeId } = require('sqlstring')
  const mysql = usePromise ? require('mariadb/promise') : require('mariadb/callback')

  const pool = (options.pool) ? options.pool : mysql.createPool(options)
  const db = {
    pool,
    query: pool.query.bind(pool),
    getConnection: pool.getConnection.bind(pool),

    format,
    escape,
    escapeId
  }

  if (name) {
    if (!fastify.mysql) {
      fastify.decorate('mysql', {})
    }
    if (fastify.mysql[name]) {
      return next(new Error('fastify.mysql.' + name + 'has already registered'))
    }
    fastify.mysql[name] = db
  } else {
    if (fastify.mysql) {
      return next(new Error('fastify.mysql has already registered'))
    } else {
      fastify.mysql = db
    }
  }

  if (usePromise) {
    fastify.addHook('onClose', (fastify) => pool.end())
  } else {
    fastify.addHook('onClose', (fastify, done) => pool.end(done))
  }

  next()
}

module.exports = fp(fastifyMysql, {
  fastify: '>=1.0.0',
  name: 'fastify-mysql'
})

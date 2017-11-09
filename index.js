'use strict'

const fp = require('fastify-plugin')
const mysql = require('mysql')

function fastifyMysql (fastify, options, next) {
  const name = options.name
  delete options.name

  const pool = mysql.createPool(options.connectionString || options)
  const db = {
    connect: onConnect => pool.getConnection(onConnect),
    pool: pool,
    query: pool.query.bind(pool)
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

  fastify.addHook('onClose', (fastify, done) => pool.end(done))
  next()
}

module.exports = fp(fastifyMysql, '>=0.13.1')

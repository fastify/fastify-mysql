'use strict'

const fp = require('fastify-plugin')

function fastifyMysql (fastify, options, next) {
  const name = options.name
  delete options.name

  const usePromise = options.promise
  delete options.promise

  const db = {}
  if (usePromise) {
    const mysql = require('mysql2/promise')
    mysql.createConnection(options.connectionString || options)
      .then((connection) => {
        fastify.addHook('onClose', (fastify, done) => connection.end(done))
        db.connection = connection
        db.query = connection.query.bind(connection)
        // synchronous functions
        db.format = connection.format.bind(connection)
        db.escape = connection.escape.bind(connection)
        db.escapeId = connection.escapeId.bind(connection)
        next()
      })
      .catch((e) => {
        next(e)
      })
  } else {
    const mysql = require('mysql2')
    const connection = mysql.createConnection(options.connectionString || options)
    fastify.addHook('onClose', (fastify, done) => connection.end(done))

    db.connection = connection
    db.query = connection.query.bind(connection)
    // synchronous functions
    db.format = connection.format.bind(connection)
    db.escape = connection.escape.bind(connection)
    db.escapeId = connection.escapeId.bind(connection)
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

  if (!usePromise) {
    next()
  }
}

module.exports = fp(fastifyMysql)

'use strict'

const fp = require('fastify-plugin')

function fastifyMysql (fastify, options, next) {
  const usePromise = options.promise
  delete options.promise

  if (usePromise) {
    _wrapCreateConnection(fastify, options, next)
  } else {
    const name = options.name
    delete options.name

    const mysql = require('mysql2')
    const connection = mysql.createConnection(options.connectionString || options)
    const db = {
      connection: connection,
      query: usePromise ? connection.query : connection.query.bind(connection),

      // synchronous functions
      format: mysql.format || connection.format,
      escape: mysql.escape || connection.escape,
      escapeId: mysql.escapeId || connection.escapeId
    }
    if (name) {
      if (!fastify.mysql) {
        fastify.decorate('mysql', {})
      }
      if (fastify.mysql[name]) {
        next(new Error('fastify.mysql.' + name + 'has already registered'))
      }
      fastify.mysql[name] = db
    } else {
      if (fastify.mysql) {
        next(new Error('fastify-mysql has already registered'))
      } else {
        fastify.mysql = db
      }
    }

    fastify.addHook('onClose', (fastify, done) => {
      fastify.mysql = null
      return connection.end(done)
    })
    next()
  }
}

module.exports = fp(fastifyMysql, {
  fastify: '>=1.0.0',
  name: 'fastify-mysql'
})

function _wrapCreateConnection (fastify, options, next) {
  return new Promise((resolve, reject) => {
    const name = options.name
    delete options.name

    const mysql = require('mysql2/promise')
    mysql.createConnection(options.connectionString || options)
      .then((connection) => {
        const db = {
          connection: connection,
          query: connection.query.bind(connection),

          // synchronous functions
          format: connection.format.bind(connection),
          escape: connection.escape.bind(connection),
          escapeId: connection.escapeId.bind(connection)
        }
        if (name) {
          if (!fastify.mysql) {
            fastify.decorate('mysql', {})
          }
          if (fastify.mysql[name]) {
            next(new Error('fastify.mysql.' + name + 'has already registered'))
          }
          fastify.mysql[name] = db
        } else {
          if (fastify.mysql) {
            next(new Error('fastify-mysql has already registered'))
          } else {
            fastify.mysql = db
          }
        }
        fastify.addHook('onClose', (fastify, done) => {
          fastify.mysql = null
          return connection.end(done)
        })
        next()
        resolve()
      })
      .catch((e) => {
        reject(e)
      })
  })
}

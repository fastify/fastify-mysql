'use strict'

const fp = require('fastify-plugin')

function fastifyMysql (fastify, options, next) {
  const name = options.name
  delete options.name

  const connectionType = options.type
  const usePromise = options.promise

  _createConnection(options, (err, db) => {
    if (err) return next(err)

    const client = (connectionType !== 'connection') ? db.pool : db.connection

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

    if (usePromise) {
      fastify.addHook('onClose', (fastify) => client.end())
    } else {
      fastify.addHook('onClose', (fastify, done) => client.end(done))
    }
    next()
  })
}

module.exports = fp(fastifyMysql, {
  fastify: '>=1.0.0',
  name: 'fastify-mysql'
})

function _createConnection (options, cb) {
  const usePromise = options.promise
  delete options.promise

  const connectionType = options.type
  delete options.type

  const { format, escape, escapeId } = require('mysql2')
  const mysql = usePromise ? require('mysql2/promise') : require('mysql2')

  const db = {
    format: format,
    escape: escape,
    escapeId: escapeId
  }

  let client = {}
  if (connectionType !== 'connection') {
    client = mysql.createPool(options.connectionString || options)
    db.pool = client
    db.query = client.query.bind(client)
    db.getConnection = client.getConnection.bind(client)
  } else {
    client = mysql.createConnection(options.connectionString || options)
    if (!usePromise) {
      db.connection = client
      db.query = client.query.bind(client)
    }
  }

  if (usePromise) {
    if (connectionType !== 'connection') {
      client.query('SELECT NOW()')
        .then(() => cb(null, db))
        .catch((err) => cb(err, null))
    } else {
      client.then((connection) => {
        db.connection = connection
        db.query = connection.query.bind(connection)

        connection.query('SELECT NOW()')
          .then(() => cb(null, db))
          .catch((err) => cb(err, null))
      })
    }
  } else {
    client.query('SELECT NOW()', (err) => cb(err, db))
  }
}

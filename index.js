'use strict'

const fp = require('fastify-plugin')

function fastifyMysql (fastify, options, next) {
  const connectionType = options.type
  delete options.type
  const name = options.name
  delete options.name
  const usePromise = options.promise
  delete options.promise

  _createConnection({ connectionType, options, usePromise }, (err, db) => {
    if (err) {
      return next(err)
    }

    const client = connectionType !== 'connection' ? db.pool : db.connection

    if (usePromise) {
      fastify.addHook('onClose', (_fastify, done) => client.end().then(done).catch(done))
    } else {
      fastify.addHook('onClose', (_fastify, done) => client.end(done))
    }

    if (name) {
      if (!fastify.mysql) {
        fastify.decorate('mysql', {})
      }

      if (fastify.mysql[name]) {
        return next(new Error(`fastify-mysql '${name}' instance name has already been registered`))
      }

      fastify.mysql[name] = db
    } else {
      if (fastify.mysql) {
        return next(new Error('fastify-mysql has already been registered'))
      } else {
        fastify.decorate('mysql', db)
      }
    }

    next()
  })
}

function _createConnection ({ connectionType, options, usePromise }, cb) {
  const { format, escape, escapeId } = require('mysql2')
  const mysql = usePromise ? require('mysql2/promise') : require('mysql2')

  const db = {
    format,
    escape,
    escapeId
  }

  let client = {}

  if (connectionType !== 'connection') {
    // Pool relative code
    client = mysql.createPool(options.connectionString || options)

    db.pool = client
    db.query = client.query.bind(client)
    db.execute = client.execute.bind(client)
    db.getConnection = client.getConnection.bind(client)

    if (!usePromise) {
      client.query('SELECT NOW()', (err) => cb(err, db))
    } else {
      client
        .query('SELECT NOW()')
        .then(() => cb(null, db))
        .catch((err) => cb(err, null))
    }
  } else {
    // Connection relative code
    client = mysql.createConnection(options.connectionString || options)

    if (!usePromise) {
      db.connection = client
      db.query = client.query.bind(client)
      db.execute = client.execute.bind(client)

      client.query('SELECT NOW()', (err) => cb(err, db))
    } else {
      client
        .then((connection) => {
          db.connection = connection
          db.query = connection.query.bind(connection)
          db.execute = connection.execute.bind(connection)

          connection
            .query('SELECT NOW()')
            .then(() => cb(null, db))
        })
        .catch((err) => cb(err, null))
    }
  }
}

function isMySQLPoolOrPromisePool (obj) {
  return obj && typeof obj.query === 'function' && typeof obj.execute === 'function' && typeof obj.getConnection === 'function' && typeof obj.pool === 'object'
}

function isMySQLConnectionOrPromiseConnection (obj) {
  return obj && typeof obj.query === 'function' && typeof obj.execute === 'function' && typeof obj.connection === 'object'
}

function isMySQLPool (obj) {
  return isMySQLPoolOrPromisePool(obj) && typeof obj.pool.promise === 'function'
}

function isMySQLPromisePool (obj) {
  return isMySQLPoolOrPromisePool(obj) && obj.pool.promise === undefined
}

function isMySQLConnection (obj) {
  return isMySQLConnectionOrPromiseConnection(obj) && typeof obj.connection.promise === 'function' && typeof obj.connection.authorized === 'boolean'
}

function isMySQLPromiseConnection (obj) {
  return isMySQLConnectionOrPromiseConnection(obj) && obj.connection.promise === undefined
}

module.exports = fp(fastifyMysql, {
  fastify: '5.x',
  name: '@fastify/mysql'
})
module.exports.default = fastifyMysql
module.exports.fastifyMysql = fastifyMysql
module.exports.isMySQLPool = isMySQLPool
module.exports.isMySQLPromisePool = isMySQLPromisePool
module.exports.isMySQLConnection = isMySQLConnection
module.exports.isMySQLPromiseConnection = isMySQLPromiseConnection

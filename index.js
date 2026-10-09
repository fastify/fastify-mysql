'use strict'

const fp = require('fastify-plugin')
const { format, escape, escapeId } = require('mysql2')

function fastifyMysql (fastify, options, next) {
  const { type, name, promise: usePromise, connectionString, ...connectionOptions } = options
  const mysql = usePromise ? require('mysql2/promise') : require('mysql2')
  const config = connectionString || connectionOptions
  const isConnection = type === 'connection'
  let cancelled = false
  let cleanup
  let clientPromise

  // Install lifecycle handlers before acquiring a client. Promise connections can
  // arrive after boot has failed; shutdown must also await and close those clients.
  fastify.addHook('onClose', () => close())
  function close () {
    cancelled = true
    cleanup ||= clientPromise.then(client => usePromise
      ? client.end()
      : new Promise((resolve, reject) => client.end(err => err ? reject(err) : resolve())), () => {})
    return cleanup
  }

  function decorateClient (client) {
    const db = {
      format,
      escape,
      escapeId,
      [isConnection ? 'connection' : 'pool']: client,
      query: client.query.bind(client),
      execute: client.execute.bind(client)
    }
    if (!isConnection) db.getConnection = client.getConnection.bind(client)

    if (name) {
      if (!fastify.mysql) {
        fastify.decorate('mysql', Object.create(null))
      }

      if (Object.hasOwn(fastify.mysql, name)) {
        throw new Error(`fastify-mysql '${name}' instance name has already been registered`)
      }

      fastify.mysql[name] = db
    } else {
      if (fastify.mysql) {
        throw new Error('fastify-mysql has already been registered')
      }
      fastify.decorate('mysql', db)
    }
  }

  // A separate initialization step lets after() observe its timeout without
  // calling ready() during registration, which would stall await register().
  fastify.register(fp(function initializeMySQL (_fastify, _options, done) {
    clientPromise = Promise.resolve().then(() => isConnection
      ? mysql.createConnection(config)
      : mysql.createPool(config))

    clientPromise.then(async client => {
      if (usePromise) {
        await client.query('SELECT NOW()')
      } else {
        await new Promise((resolve, reject) => client.query('SELECT NOW()', err => err ? reject(err) : resolve()))
      }
      if (cancelled) return

      decorateClient(client)
      done()
    }).catch(async err => {
      const notify = !cancelled
      await close().catch(() => {})
      if (notify) done(err)
    })
  }))
  fastify.after((err, done) => {
    if (err) close().catch(() => {})
    done(err)
  })
  next()
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

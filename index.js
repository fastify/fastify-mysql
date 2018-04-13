'use strict'

const fp = require('fastify-plugin')

function fastifyMysql (fastify, options, next) {
  if (options.type && options.type === 'connection') {
    fastify.register(require('./connection'), options)
  } else {
    fastify.register(require('./pool'), options)
  }
  next()
}

module.exports = fp(fastifyMysql, {
  fastify: '>=1.0.0',
  name: 'fastify-mysql'
})

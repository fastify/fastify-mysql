'use strict'

const fp = require('fastify-plugin')

function fastifyMysql (fastify, options, next) {
  if ((options.type || 'pool') === 'pool') {
    fastify.register(require('./pool'), options)
  } else {
    fastify.register(require('./connection'), options)
  }
  next()
}

module.exports = fp(fastifyMysql, {
  fastify: '>=0.13.1',
  name: 'fastify-mysql'
})

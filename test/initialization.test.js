'use strict'

const { test } = require('node:test')
const Fastify = require('fastify')
const fastifyMysql = require('../index')

test('Should not throw if registered within different scopes (with and without named instances)', (t, done) => {
  t.plan(1)

  const fastify = Fastify()
  t.after(() => fastify.close())

  fastify.register(function scopeOne (instance, _opts, next) {
    instance.register(fastifyMysql, {
      connectionString: 'mysql://root@localhost/mysql'
    })

    next()
  })

  fastify.register(function scopeTwo (instance, _opts, next) {
    instance.register(fastifyMysql, {
      connectionString: 'mysql://root@localhost/mysql',
      name: 'one'
    })

    instance.register(fastifyMysql, {
      connectionString: 'mysql://root@localhost/mysql',
      name: 'two'
    })

    next()
  })

  fastify.ready((errors) => {
    t.assert.ifError(errors)
    done()
  })
})

test('Should throw when trying to register multiple instances without giving a name', (t, done) => {
  t.plan(2)

  const fastify = Fastify()
  t.after(() => fastify.close())

  fastify.register(fastifyMysql, {
    connectionString: 'mysql://root@localhost/mysql'
  })

  fastify.register(fastifyMysql, {
    connectionString: 'mysql://root@localhost/mysql'
  })

  fastify.ready((errors) => {
    t.assert.ok(errors)
    t.assert.strictEqual(errors.message, 'fastify-mysql has already been registered')
    done()
  })
})

test('Should throw with duplicate connection names', (t, done) => {
  t.plan(2)

  const fastify = Fastify()
  t.after(() => fastify.close())
  const name = 'test'

  fastify
    .register(fastifyMysql, {
      connectionString: 'mysql://root@localhost/mysql',
      name
    })
    .register(fastifyMysql, {
      connectionString: 'mysql://root@localhost/mysql',
      name
    })

  fastify.ready((errors) => {
    t.assert.ok(errors)
    t.assert.strictEqual(errors.message, `fastify-mysql '${name}' instance name has already been registered`)
    done()
  })
})

test('Should accept names matching inherited object properties', async (t) => {
  const fastify = Fastify()
  t.after(() => fastify.close())

  for (const name of ['toString', 'constructor', '__proto__']) {
    fastify.register(fastifyMysql, {
      connectionString: 'mysql://root@localhost/mysql',
      name
    })
  }

  await fastify.ready()

  for (const name of ['toString', 'constructor', '__proto__']) {
    const rows = await new Promise((resolve, reject) => {
      fastify.mysql[name].query('SELECT 1 AS value', (err, rows) => err ? reject(err) : resolve(rows))
    })
    t.assert.strictEqual(rows[0].value, 1)
  }
})

test('Should throw when mysql2 fail', (t, done) => {
  t.plan(2)

  const fastify = Fastify()
  t.after(() => fastify.close())

  const BAD_PORT = 6000
  const HOST = '127.0.0.1'

  // We try to access through a wrong port (MySQL listen on port 3306)
  fastify.register(fastifyMysql, {
    host: HOST,
    port: BAD_PORT
  })

  fastify.ready((errors) => {
    t.assert.ok(errors)
    t.assert.strictEqual(errors.message, `connect ECONNREFUSED ${HOST}:${BAD_PORT}`)
    done()
  })
})

test('Promise: Should throw when mysql2 fail', (t, done) => {
  t.plan(2)

  const fastify = Fastify()
  t.after(() => fastify.close())

  const BAD_PORT = 6000
  const HOST = '127.0.0.1'

  // We try to access through a wrong port (MySQL listen on port 3306)
  fastify.register(fastifyMysql, {
    host: HOST,
    port: BAD_PORT,
    promise: true
  })

  fastify.ready((errors) => {
    t.assert.ok(errors)
    t.assert.strictEqual(errors.message, `connect ECONNREFUSED ${HOST}:${BAD_PORT}`)
    done()
  })
})

test('Connection - Promise: Should throw when mysql2 fail', (t, done) => {
  t.plan(2)

  const fastify = Fastify()
  t.after(() => fastify.close())

  const BAD_PORT = 6000
  const HOST = '127.0.0.1'

  // We try to access through a wrong port (MySQL listen on port 3306)
  fastify.register(fastifyMysql, {
    host: HOST,
    port: BAD_PORT,
    promise: true,
    type: 'connection'
  })

  fastify.ready((errors) => {
    t.assert.ok(errors)
    t.assert.strictEqual(errors.message, `connect ECONNREFUSED ${HOST}:${BAD_PORT}`)
    done()
  })
})

test('Promise - Should throw when trying to register multiple instances without giving a name', (t, done) => {
  t.plan(2)

  const fastify = Fastify()
  t.after(() => fastify.close())

  fastify.register(fastifyMysql, {
    connectionString: 'mysql://root@localhost/mysql'
  })

  fastify.register(fastifyMysql, {
    connectionString: 'mysql://root@localhost/mysql'
  })

  fastify.ready((errors) => {
    t.assert.ok(errors)
    t.assert.strictEqual(errors.message, 'fastify-mysql has already been registered')
    done()
  })
})

test('Promise - Should throw with duplicate connection names', (t, done) => {
  t.plan(2)

  const fastify = Fastify()
  t.after(() => fastify.close())
  const name = 'test'

  fastify
    .register(fastifyMysql, {
      connectionString: 'mysql://root@localhost/mysql',
      name
    })
    .register(fastifyMysql, {
      connectionString: 'mysql://root@localhost/mysql',
      name
    })

  fastify.ready((errors) => {
    t.assert.ok(errors)
    t.assert.strictEqual(errors.message, `fastify-mysql '${name}' instance name has already been registered`)
    done()
  })
})

const plugin = fastifyMysql
const config = { connectionString: 'mysql://root@localhost/mysql' }

for (const unnamed of [false, true]) {
  test(`named clients stay in their scope with ${unnamed ? 'an unnamed' : 'a named'} parent client`, async t => {
    const app = Fastify()
    t.after(() => app.close())
    app.register(plugin, { ...config, promise: true, ...(unnamed ? {} : { name: 'parent' }) })
    let first, second, descendant
    app.register(async scope => {
      first = scope
      scope.register(plugin, { ...config, promise: true, name: 'local' })
      scope.register(async child => {
        descendant = child
        child.register(plugin, { ...config, promise: true, name: 'nested' })
      })
    })
    app.register(async scope => {
      second = scope
      scope.register(plugin, { ...config, promise: true, name: 'local' })
    })
    await app.ready()
    t.assert.strictEqual(app.mysql.local, undefined)
    t.assert.strictEqual(first.mysql.nested, undefined)
    t.assert.strictEqual(second.mysql.nested, undefined)
    t.assert.notStrictEqual(first.mysql.local, second.mysql.local)
    t.assert.strictEqual(descendant.mysql.local, first.mysql.local)
    t.assert.strictEqual(Object.getPrototypeOf(first.mysql), null)
    const inherited = unnamed ? first.mysql : first.mysql.parent
    const original = unnamed ? app.mysql : app.mysql.parent
    t.assert.ok(plugin.isMySQLPromisePool(inherited))
    t.assert.strictEqual(inherited.pool, original.pool)
    t.assert.strictEqual((await inherited.query('SELECT 42 AS value'))[0][0].value, 42)
    const end = original.pool.end.bind(original.pool)
    let closes = 0
    t.mock.method(original.pool, 'end', () => { closes++; return end() })
    await app.close()
    t.assert.strictEqual(closes, 1)
  })

  for (const name of ['__proto__', 'constructor', 'toString']) {
    test(`${name} is safe and rejects duplicates ${unnamed ? 'after an unnamed client' : 'in a named registry'}`, async t => {
      const app = Fastify()
      t.after(() => app.close())
      let prototype
      if (unnamed) app.register(plugin, { ...config, promise: true })
      app.register(plugin, { ...config, promise: true, name })
      app.after(() => {
        prototype = Object.getPrototypeOf(app.mysql)
        t.assert.strictEqual(prototype, unnamed ? Object.prototype : null)
        t.assert.ok(Object.hasOwn(app.mysql, name))
        t.assert.ok(plugin.isMySQLPromisePool(app.mysql[name]))
      })
      app.register(plugin, { ...config, promise: true, name })
      await t.assert.rejects(app.ready(), new RegExp(`'${name}' instance name has already been registered`))
      t.assert.strictEqual(Object.getPrototypeOf(app.mysql), prototype)
    })
  }
}

test('a child cannot replace an inherited named client', async t => {
  const app = Fastify()
  t.after(() => app.close())
  app.register(plugin, { ...config, promise: true, name: 'parent' })
  app.register(async scope => {
    scope.register(plugin, { ...config, promise: true, name: 'parent' })
  })
  await t.assert.rejects(app.ready(), /'parent' instance name has already been registered/)
})

for (const name of ['query', 'pool', 'format']) {
  test(`a named client cannot replace the default client's ${name}`, async t => {
    const app = Fastify()
    t.after(() => app.close())
    app.register(plugin, { ...config, promise: true })
    app.register(plugin, { ...config, promise: true, name })
    await t.assert.rejects(app.ready(), new RegExp(`'${name}' instance name has already been registered`))
  })
}

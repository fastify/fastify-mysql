# @fastify/mysql

![CI](https://github.com/fastify/fastify-mysql/workflows/CI/badge.svg)
[![NPM version](https://img.shields.io/npm/v/@fastify/mysql.svg?style=flat)](https://www.npmjs.com/package/@fastify/mysql)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat)](https://standardjs.com/)

Fastify MySQL connection plugin; with this you can share the same MySQL connection pool in every part of your server.
Under the hood the [mysql2](https://github.com/sidorares/node-mysql2) is used. If you don't use the `connectionString` option, the options that you pass to `register` will be passed to the MySQL pool builder.

## Install
```
npm i @fastify/mysql
```
## Usage
Add it to you project with `register` and you are done!
This plugin will add the `mysql` namespace in your Fastify instance, with the following properties:
```
pool: the pool instance
query: an utility to perform a query without a transaction
execute: an utility to perform a prepared statement without a transaction
getConnection: get a connection from the pool
format: an utility to generate SQL string
escape: an utility to escape query values
escapeId: an utility to escape query identifiers
```

Example:
```js
const fastify = require('fastify')()

fastify.register(require('@fastify/mysql'), {
  connectionString: 'mysql://root@localhost/mysql'
})

fastify.get('/user/:id', (req, reply) => {
  fastify.mysql.getConnection(onConnect)

  function onConnect (err, client) {
    if (err) return reply.send(err)

    client.query(
      'SELECT id, username, hash, salt FROM users WHERE id=?', [req.params.id],
      function onResult (err, result) {
        client.release()
        reply.send(err || result)
      }
    )
  }
})

fastify.listen({ port: 3000 }, err => {
  if (err) throw err
  console.log(`server listening on ${fastify.server.address().port}`)
})
```

Use of `mysql.query`
```js
const fastify = require('fastify')()

fastify.register(require('@fastify/mysql'), {
  connectionString: 'mysql://root@localhost/mysql'
})

fastify.get('/user/:id', (req, reply) => {
  fastify.mysql.query(
    'SELECT id, username, hash, salt FROM users WHERE id=?', [req.params.id],
    function onResult (err, result) {
      reply.send(err || result)
    }
  )
})

fastify.listen({ port: 3000 }, err => {
  if (err) throw err
  console.log(`server listening on ${fastify.server.address().port}`)
})
```
As you can see there is no need to close the client, since it is done internally.

Async/await is supported, when register `promise` option is `true`:
```js
const fastify = require('fastify')()

fastify.register(require('@fastify/mysql'), {
  promise: true,
  connectionString: 'mysql://root@localhost/mysql'
})

fastify.get('/user/:id', async (req, reply) => {
  const connection = await fastify.mysql.getConnection()
  const [rows, fields] = await connection.query(
    'SELECT id, username, hash, salt FROM users WHERE id=?', [req.params.id],
  )
  connection.release()
  return rows[0]
})

fastify.listen({ port: 3000 }, err => {
  if (err) throw err
  console.log(`server listening on ${fastify.server.address().port}`)
})
```

## TypeScript
As `mysql2` expose four different type of client, we do not specify the typing for you. You need to specify the type yourself following the example below.
```ts
import { MySQLConnection, MySQLPool, MySQLPromiseConnection, MySQLPromisePool } from '@fastify/mysql'

// if you only pass connectionString
declare module 'fastify' {
  interface FastifyInstance {
    mysql: MySQLPool 
  }
}

// if you passed type = 'connection'
declare module 'fastify' {
  interface FastifyInstance {
    mysql: MySQLConnection 
  }
}

// if you passed promise = true
declare module 'fastify' {
  interface FastifyInstance {
    mysql: MySQLPromisePool 
  }
}

// if you passed promise = true, type = 'connection'
declare module 'fastify' {
  interface FastifyInstance {
    mysql: MySQLPromiseConnection 
  }
}
```

#### MySQLRowDataPacket 
Ability to add type for return data using mysql2 [RowDataPacket](https://sidorares.github.io/node-mysql2/docs/documentation/typescript-examples#rowdatapacket). 

```
const fastifyMysql, { MySQLRowDataPacket } from '@fastify/mysql'

const app = fastify();

app.register(fastifyMysql, {
  connectionString: "mysql://root@localhost/mysql",
});

app.get("/", async () => {
  const connection = app.mysql;

  // SELECT
  const [rows, fields] = await connection.query<MySQLRowDataPacket[]>(
    "SELECT 1 + 1 AS `test`;",
  );

  /**
   * @rows: [ { test: 2 } ]
   */
  return rows[0];
});
```

#### MySQLResultSetHeader 
Ability to add type for return data using mysql2 [ResultSetHeader](https://sidorares.github.io/node-mysql2/docs/documentation/typescript-examples#resultsetheader). 

```
const fastifyMysql, { MySQLResultSetHeader } from '@fastify/mysql'

const app = fastify();

app.register(fastifyMysql, {
  connectionString: "mysql://root@localhost/mysql",
});

app.get("/", async () => {
  const connection = app.mysql;
  const result = await connection.query<MySQLResultSetHeader>("SET @1 = 1");

  /**
   * @result: ResultSetHeader {
      fieldCount: 0,
      affectedRows: 0,
      insertId: 0,
      info: '',
      serverStatus: 2,
      warningStatus: 0,
      changedRows: 0
    }
   */
  return result
});
```

## Acknowledgements

This project is kindly sponsored by:
- [nearForm](https://nearform.com)
- [LetzDoIt](https://www.letzdoitapp.com/)

## License

Licensed under [MIT](./LICENSE).

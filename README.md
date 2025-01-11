# @fastify/mysql

[![CI](https://github.com/fastify/fastify-mysql/actions/workflows/ci.yml/badge.svg?branch=master)](https://github.com/fastify/fastify-mysql/actions/workflows/ci.yml)
[![NPM version](https://img.shields.io/npm/v/@fastify/mysql.svg?style=flat)](https://www.npmjs.com/package/@fastify/mysql)
[![neostandard javascript style](https://img.shields.io/badge/code_style-neostandard-brightgreen?style=flat)](https://github.com/neostandard/neostandard)

Fastify MySQL connection plugin; with this you can share the same MySQL connection pool in every part of your server.
Under the hood the [mysql2](https://github.com/sidorares/node-mysql2) is used. If you don't use the `connectionString` option, the options you pass to `register` will be passed to the MySQL pool builder.

_Important:_ All MySQL2 options will be ignored when using `connectionString`, if you want to pass additional options to MySQL2 use `uri` instead of `connectionString`.

## Install
```
npm i @fastify/mysql
```

### Compatibility
| Plugin version | Fastify version |
| ---------------|-----------------|
| `^5.x`         | `^5.x`          |
| `^4.x`         | `^4.x`          |
| `^2.x`         | `^3.x`          |
| `^0.x`         | `^2.x`          |
| `^0.x`         | `^1.x`          |


Please note that if a Fastify version is out of support, then so are the corresponding versions of this plugin
in the table above.
See [Fastify's LTS policy](https://github.com/fastify/fastify/blob/main/docs/Reference/LTS.md) for more details.



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

```js
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

```js
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

##### isMySQLPool
Method to check if fastify decorator, mysql is type of [MySQLPool](https://github.com/fastify/fastify-mysql/blob/master/types/index.d.ts#L32)

```typescript
const app = fastify();
app
  .register(fastifyMysql, {
    connectionString: "mysql://root@localhost/mysql",
  })
  .after(function (err) {
    if (isMySQLPool(app.mysql)) {
      const mysql = app.mysql
      mysql.getConnection(function (err, con) {
        con.release();
      });
      mysql.pool.end();
    }
  })
```


##### isMySQLPromisePool
Method to check if fastify decorator, mysql is type of [MySQLPromisePool](https://github.com/fastify/fastify-mysql/blob/master/types/index.d.ts#L43)

```typescript
app
  .register(fastifyMysql, {
    promise: true,
    connectionString: "mysql://root@localhost/mysql",
  })
  .after(async function (err) {
    if (isMySQLPromisePool(app.mysql)) {
      const mysql = app.mysql
      const con = await mysql.getConnection();
      con.release();
      mysql.pool.end();
    }
  });
```


##### isMySQLConnection
Method to check if fastify decorator, mysql is type of [MySQLConnection](https://github.com/fastify/fastify-mysql/blob/master/types/index.d.ts#L28)

```typescript
app
  .register(fastifyMysql, {
    type: "connection",
    connectionString: "mysql://root@localhost/mysql",
  })
  .after(async function (err) {
    if (isMySQLConnection(app.mysql)) {
      const mysql = app.mysql
      mysql.connection.end();
    }
  });
```


##### isMySQLPromiseConnection
Method to check if fastify decorator, mysql is type of [MySQLPromiseConnection](https://github.com/fastify/fastify-mysql/blob/master/types/index.d.ts#L36)

```typescript
app
  .register(fastifyMysql, {
    type: "connection",
    promise: true,
    connectionString: "mysql://root@localhost/mysql",
  })
  .after(async function (err) {
    if (isMySQLPromiseConnection(app.mysql)) {
      const mysql = app.mysql
      mysql.connection.end();
    }
  });
```

## Acknowledgments

This project is kindly sponsored by:
- [nearForm](https://nearform.com)
- [LetzDoIt](https://www.letzdoitapp.com/)

## License

Licensed under [MIT](./LICENSE).

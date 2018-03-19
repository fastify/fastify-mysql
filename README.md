# fastify-mysql

[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat)](http://standardjs.com/)  [![Build Status](https://travis-ci.org/fastify/fastify-mysql.svg?branch=master)](https://travis-ci.org/fastify/fastify-mysql)

Fastify MySQL connection plugin, with this you can share the same MySQL connection pool in every part of your server.
Under the hood the [mysql](https://github.com/mysqljs/mysql) is used, the options that you pass to `register` will be passed to the MySQL pool builder.

## Install
```
npm i fastify-mysql --save
```
## Usage
Add it to you project with `register` and you are done!
This plugin will add the `mysql` namespace in your Fastify instance, with the following properties:
```
connect: the function to get a connection from the pool
pool: the pool instance
query: an utility to perform a query without a transaction
```

Example:
```js
const fastify = require('fastify')

fastify.register(require('fastify-mysql'), {
  connectionString: 'mysql://root@localhost/mysql'
})

fastify.get('/user/:id', (req, reply) => {
  const connection = await fastify.mysql.connect();
  try {
    const result = await client.query(
      'SELECT id, username, hash, salt FROM users WHERE id=?', [req.params.id])
    reply.send(result)
  } catch(err) {
    reply.send(err)
  } finally {
    connection.release();
  }
})

fastify.listen(3000, err => {
  if (err) throw err
  console.log(`server listening on ${fastify.server.address().port}`)
})
```

Use of `mysql.query`
```js
const fastify = require('fastify')

fastify.register(require('fastify-mysql'), {
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

fastify.listen(3000, err => {
  if (err) throw err
  console.log(`server listening on ${fastify.server.address().port}`)
})
```
As you can see there is no need to close the client, since is done internally.

## Acknowledgements

This project is kindly sponsored by:
- [nearForm](http://nearform.com)
- [LetzDoIt](http://www.letzdoitapp.com/)

## License

Licensed under [MIT](./LICENSE).

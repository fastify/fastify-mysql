import fastify from 'fastify'
import fastifyMysql, {
  MySQLConnection,
  MySQLPool,
  MySQLPromiseConnection,
  MySQLPromisePool,
  MySQLProcedureCallPacket,
  MySQLResultSetHeader,
  MySQLRowDataPacket,
  isMySQLPromiseConnection,
  isMySQLConnection,
  isMySQLPromisePool,
  isMySQLPool,
} from '..'
import { expectType } from 'tsd'
import { Pool } from 'mysql2/typings/mysql/lib/Pool'
import { Connection, PoolConnection } from 'mysql2'
import { Pool as PromisePool, Connection as PromiseConnection, PoolConnection as PromisePoolConnection } from 'mysql2/promise'

declare module 'fastify' {
  interface FastifyInstance {
    mysql:
      | MySQLPool
      | MySQLConnection
      | MySQLPromisePool
      | MySQLPromiseConnection;
  }
}

type PoolGetConnectionType = (callback: (err: NodeJS.ErrnoException | null, connection: PoolConnection) => any) => void
type PoolPromiseType = (promiseImpl?: PromiseConstructor) => PromisePool
type ConnectionPromiseType = (promiseImpl?: PromiseConstructor) => PromiseConnection

const app = fastify()
app
  .register(fastifyMysql, {
    connectionString: 'mysql://root@localhost/mysql',
  })
  .after(function (_err) {
    if (isMySQLPool(app.mysql)) {
      const mysql = app.mysql
      mysql.escapeId('foo')
      mysql.escape('bar')
      mysql.format('baz')
      mysql.query('SELECT NOW()', function () {})
      mysql.execute('SELECT NOW()', function () {})
      mysql.getConnection(function (_err, con) {
        con.release()
      })
      mysql.pool.end()
      expectType<PoolGetConnectionType>(app.mysql.getConnection)
      expectType<Pool>(app.mysql.pool)
      expectType<PoolPromiseType>(app.mysql.pool.promise)
    }
  })

app
  .register(fastifyMysql, {
    promise: true,
    connectionString: 'mysql://root@localhost/mysql',
  })
  .after(async function (_err) {
    if (isMySQLPromisePool(app.mysql)) {
      const mysql = app.mysql
      mysql.escapeId('foo')
      mysql.escape('bar')
      mysql.format('baz')
      await mysql.query('SELECT NOW()')
      await mysql.execute('SELECT NOW()')
      const con = await mysql.getConnection()
      con.release()
      mysql.pool.end()
      expectType<() => Promise<PromisePoolConnection>>(app.mysql.getConnection)
      expectType<PromisePool>(app.mysql.pool)
    }
  })

app
  .register(fastifyMysql, {
    type: 'connection',
    connectionString: 'mysql://root@localhost/mysql',
  })
  .after(async function (_err) {
    if (isMySQLConnection(app.mysql)) {
      const mysql = app.mysql
      mysql.escapeId('foo')
      mysql.escape('bar')
      mysql.format('baz')
      mysql.query('SELECT NOW()', function () {})
      mysql.execute('SELECT NOW()', function () {})
      mysql.connection.end()
      expectType<Connection>(app.mysql.connection)
      expectType<ConnectionPromiseType>(app.mysql.connection.promise)
      expectType<boolean>(app.mysql.connection.authorized)
    }
  })

app
  .register(fastifyMysql, {
    type: 'connection',
    promise: true,
    connectionString: 'mysql://root@localhost/mysql',
  })
  .after(async function (_err) {
    if (isMySQLPromiseConnection(app.mysql)) {
      const mysql = app.mysql
      mysql.escapeId('foo')
      mysql.escape('bar')
      mysql.format('baz')
      await mysql.query('SELECT NOW()')
      await mysql.execute('SELECT NOW()')
      mysql.connection.end()
      expectType<PromiseConnection>(app.mysql.connection)
      expectType<number>(app.mysql.connection.threadId)
    }
  })

app
  .register(fastifyMysql, {
    type: 'connection',
    promise: true,
    connectionString: 'mysql://root@localhost/mysql',
  })
  .after(async function (_err) {
    if (isMySQLPromiseConnection(app.mysql)) {
      const mysql = app.mysql
      const result = await mysql.connection.query<MySQLRowDataPacket[]>('SELECT NOW()')
      expectType<MySQLRowDataPacket[]>(result[0])
      mysql.connection.end()
    }
  })

app
  .register(fastifyMysql, {
    type: 'connection',
    promise: true,
    connectionString: 'mysql://root@localhost/mysql',
    multipleStatements: true,
  })
  .after(async function (_err) {
    if (isMySQLPromiseConnection(app.mysql)) {
      const mysql = app.mysql
      const result = await mysql.connection.query<MySQLRowDataPacket[][]>(`
        SELECT 1 + 1 AS test;
        SELECT 2 + 2 AS test;
      `)
      expectType<MySQLRowDataPacket[][]>(result[0])
      mysql.connection.end()
    }
  })

app
  .register(fastifyMysql, {
    type: 'connection',
    promise: true,
    connectionString: 'mysql://root@localhost/mysql',
  })
  .after(async function (_err) {
    if (isMySQLPromiseConnection(app.mysql)) {
      const mysql = app.mysql
      const result = await mysql.connection.query<MySQLResultSetHeader>('SET @1 = 1')
      expectType<MySQLResultSetHeader>(result[0])
      mysql.connection.end()
    }
  })

app
  .register(fastifyMysql, {
    type: 'connection',
    promise: true,
    connectionString: 'mysql://root@localhost/mysql',
    multipleStatements: true,
  })
  .after(async function (_err) {
    if (isMySQLPromiseConnection(app.mysql)) {
      const mysql = app.mysql
      const result = await mysql.connection.query<MySQLResultSetHeader[]>(`
        SET @1 = 1;
        SET @2 = 2;
      `)
      expectType<MySQLResultSetHeader[]>(result[0])
      mysql.connection.end()
    }
  })

app
  .register(fastifyMysql, {
    type: 'connection',
    promise: true,
    connectionString: 'mysql://root@localhost/mysql',
  })
  .after(async function (_err) {
    if (isMySQLPromiseConnection(app.mysql)) {
      const mysql = app.mysql
      mysql.connection.query<MySQLResultSetHeader>('DROP PROCEDURE IF EXISTS myProcedure')
      mysql.connection.query<MySQLResultSetHeader>(`
        CREATE PROCEDURE myProcedure()
        BEGIN
          SET @1 = 1;
          SET @2 = 2;
        END
      `)
      const result = await mysql.connection.query<MySQLProcedureCallPacket<MySQLResultSetHeader>>('CALL myProcedure()')
      expectType<MySQLProcedureCallPacket<MySQLResultSetHeader>>(result[0])
      mysql.connection.end()
    }
  })

import fastify from "fastify";
import fastifyMysql, {
  MySQLConnection,
  MySQLPool,
  MySQLPromiseConnection,
  MySQLPromisePool,
  MySQLProcedureCallPacket,
  MySQLResultSetHeader,
  MySQLRowDataPacket,
} from "..";
import {expectType} from 'tsd';

declare module "fastify" {
  interface FastifyInstance {
    mysql:
      | MySQLPool
      | MySQLConnection
      | MySQLPromisePool
      | MySQLPromiseConnection;
  }
}

const app = fastify();
app
  .register(fastifyMysql, {
    connectionString: "mysql://root@localhost/mysql",
  })
  .after(function (err) {
    const mysql = app.mysql as MySQLPool;
    mysql.escapeId("foo");
    mysql.escape("bar");
    mysql.format("baz");
    mysql.query("SELECT NOW()", function () {});
    mysql.execute("SELECT NOW()", function () {});
    mysql.getConnection(function (err, con) {
      con.release();
    });
    mysql.pool.end();
  });

app
  .register(fastifyMysql, {
    promise: true,
    connectionString: "mysql://root@localhost/mysql",
  })
  .after(async function (err) {
    const mysql = app.mysql as MySQLPromisePool;
    mysql.escapeId("foo");
    mysql.escape("bar");
    mysql.format("baz");
    await mysql.query("SELECT NOW()");
    await mysql.execute("SELECT NOW()");
    const con = await mysql.getConnection();
    con.release();
    mysql.pool.end();
  });

app
  .register(fastifyMysql, {
    type: "connection",
    connectionString: "mysql://root@localhost/mysql",
  })
  .after(async function (err) {
    const mysql = app.mysql as MySQLConnection;
    mysql.escapeId("foo");
    mysql.escape("bar");
    mysql.format("baz");
    mysql.query("SELECT NOW()", function () {});
    mysql.execute("SELECT NOW()", function () {});
    mysql.connection.end();
  });

app
  .register(fastifyMysql, {
    type: "connection",
    promise: true,
    connectionString: "mysql://root@localhost/mysql",
  })
  .after(async function (err) {
    const mysql = app.mysql as MySQLPromiseConnection;
    mysql.escapeId("foo");
    mysql.escape("bar");
    mysql.format("baz");
    await mysql.query("SELECT NOW()");
    await mysql.execute("SELECT NOW()");
    mysql.connection.end();
  });

app
  .register(fastifyMysql, {
    type: "connection",
    promise: true,
    connectionString: "mysql://root@localhost/mysql",
  })
  .after(async function (err) {
    const mysql = app.mysql as MySQLPromiseConnection;
    const result = await mysql.connection.query<MySQLRowDataPacket[]>('SELECT NOW()');
    expectType<MySQLRowDataPacket[]>(result[0]);
    mysql.connection.end();
  });

app
  .register(fastifyMysql, {
    type: "connection",
    promise: true,
    connectionString: "mysql://root@localhost/mysql",
    multipleStatements: true,
  })
  .after(async function (err) {
    const mysql = app.mysql as MySQLPromiseConnection;
    const result = await mysql.connection.query<MySQLRowDataPacket[][]>(`
      SELECT 1 + 1 AS test;
      SELECT 2 + 2 AS test;
    `);
    expectType<MySQLRowDataPacket[][]>(result[0]);
    mysql.connection.end();
  });

app
  .register(fastifyMysql, {
    type: "connection",
    promise: true,
    connectionString: "mysql://root@localhost/mysql",
  })
  .after(async function (err) {
    const mysql = app.mysql as MySQLPromiseConnection;
    const result = await mysql.connection.query<MySQLResultSetHeader>('SET @1 = 1');
    expectType<MySQLResultSetHeader>(result[0]);
    mysql.connection.end();
  });

app
  .register(fastifyMysql, {
    type: "connection",
    promise: true,
    connectionString: "mysql://root@localhost/mysql",
    multipleStatements: true,
  })
  .after(async function (err) {
    const mysql = app.mysql as MySQLPromiseConnection;
    const result = await mysql.connection.query<MySQLResultSetHeader[]>(`
      SET @1 = 1;
      SET @2 = 2;
    `);
    expectType<MySQLResultSetHeader[]>(result[0]);
    mysql.connection.end();
  });

app
  .register(fastifyMysql, {
    type: "connection",
    promise: true,
    connectionString: "mysql://root@localhost/mysql",
  })
  .after(async function (err) {
    const mysql = app.mysql as MySQLPromiseConnection;
    mysql.connection.query<MySQLResultSetHeader>('DROP PROCEDURE IF EXISTS myProcedure');
    mysql.connection.query<MySQLResultSetHeader>(`
      CREATE PROCEDURE myProcedure()
      BEGIN
        SET @1 = 1;
        SET @2 = 2;
      END
    `);
    const result = await mysql.connection.query<MySQLProcedureCallPacket<MySQLResultSetHeader>>('CALL myProcedure()');
    expectType<MySQLProcedureCallPacket<MySQLResultSetHeader>>(result[0]);
    mysql.connection.end();
  });

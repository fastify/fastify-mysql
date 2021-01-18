import fastify from "fastify";
import fastifyMysql, { MySQLPromiseConnection } from "../../..";

declare module "fastify" {
  interface FastifyInstance {
    mysql: MySQLPromiseConnection;
  }
}

const app = fastify();
app
  .register(fastifyMysql, {
    type: "connection",
    promise: true,
    connectionString: "mysql://root@localhost/mysql",
  })
  .after(async function (err) {
    const mysql = app.mysql;
    mysql.escapeId("foo");
    mysql.escape("bar");
    mysql.format("baz");
    await mysql.query("SELECT NOW()");
    await mysql.execute("SELECT NOW()");
    mysql.connection.end();
  });

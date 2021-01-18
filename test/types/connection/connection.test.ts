import fastify from "fastify";
import fastifyMysql, { MySQLConnection } from "../../..";

declare module "fastify" {
  interface FastifyInstance {
    mysql: MySQLConnection;
  }
}

const app = fastify();
app
  .register(fastifyMysql, {
    type: "connection",
    connectionString: "mysql://root@localhost/mysql",
  })
  .after(async function (err) {
    const mysql = app.mysql;
    mysql.escapeId("foo");
    mysql.escape("bar");
    mysql.format("baz");
    mysql.query("SELECT NOW()", function () {});
    mysql.execute("SELECT NOW()", function () {});
    mysql.connection.end();
  });

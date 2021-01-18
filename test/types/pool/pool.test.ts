import fastify from "fastify";
import fastifyMysql, { MySQLPool } from "../../..";

declare module "fastify" {
  interface FastifyInstance {
    mysql: MySQLPool;
  }
}

const app = fastify();
app
  .register(fastifyMysql, {
    connectionString: "mysql://root@localhost/mysql",
  })
  .after(function (err) {
    const mysql = app.mysql;
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

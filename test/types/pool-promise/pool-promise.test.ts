import fastify from "fastify";
import fastifyMysql, { MySQLPromisePool } from "../../..";

declare module "fastify" {
  interface FastifyInstance {
    mysql: MySQLPromisePool;
  }
}

const app = fastify();
app
  .register(fastifyMysql, {
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
    const con = await mysql.getConnection();
    con.release();
    mysql.pool.end();
  });

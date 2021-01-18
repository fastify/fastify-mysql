import fastify from "fastify";
import fastifyMysql, { MySQLPool } from ".";

const app = fastify();
app
  .register(fastifyMysql, {
    connectionString: "mysql://root@localhost/mysql",
  })
  .after(function (err) {
    const mysql = app.mysql as MySQLPool;
    mysql.query("SELECT NOW()", function () {});
    mysql.execute("SELECT NOW()", function () {});
    mysql.getConnection(function (err, con) {
      con.release();
    });
  });

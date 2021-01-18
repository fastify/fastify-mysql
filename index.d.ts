import { FastifyPlugin } from "fastify";
import {
  Connection,
  ConnectionOptions,
  escape,
  format,
  Pool,
  PoolOptions,
} from "mysql2";
import {
  Connection as PromiseConnection,
  Pool as PromisePool,
} from "mysql2/promise";

export type MySQLConnection = Pick<Connection, "query" | "execute"> & {
  connection: Connection;
  format: typeof format;
  escape: typeof escape;
};

export type MySQLPool = Pick<Pool, "query" | "execute" | "getConnection"> & {
  pool: Pool;
  format: typeof format;
  escape: typeof escape;
};

export type MySQLPromiseConnection = Pick<
  PromiseConnection,
  "query" | "execute"
> & {
  connection: PromiseConnection;
  format: typeof format;
  escape: typeof escape;
};

export type MySQLPromisePool = Pick<
  PromisePool,
  "query" | "execute" | "getConnection"
> & {
  pool: PromisePool;
  format: typeof format;
  escape: typeof escape;
};

declare module "fastify" {
  interface FastifyInstance {
    mysql: {};
  }
}

export type ConnectionType = "connection" | "pool";

export interface MySQLOptions extends PoolOptions, ConnectionOptions {
  type?: ConnectionType;
  name?: string;
  promise?: boolean;
  connectionString?: string;
}

export const fastifyMySQL: FastifyPlugin<MySQLOptions>;
export default fastifyMySQL;

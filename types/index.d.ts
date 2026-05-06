import { FastifyPluginCallback } from 'fastify'
import {
  Connection,
  ConnectionOptions,
  escape,
  format,
  Pool,
  PoolOptions,
  ProcedureCallPacket,
  ResultSetHeader,
  RowDataPacket,
} from 'mysql2'
import {
  Connection as PromiseConnection,
  Pool as PromisePool,
} from 'mysql2/promise'

type FastifyMysql = FastifyPluginCallback<fastifyMysql.FastifyMySQLOptions>

declare namespace fastifyMysql {

  type MySQLPoolConnection = MySQLPool | MySQLConnection | MySQLPromisePool | MySQLPromiseConnection
  export function isMySQLPool (obj: MySQLPoolConnection): obj is MySQLPool
  export function isMySQLPromisePool (obj: MySQLPoolConnection): obj is MySQLPromisePool
  export function isMySQLConnection (obj: MySQLPoolConnection): obj is MySQLConnection
  export function isMySQLPromiseConnection (obj: MySQLPoolConnection): obj is MySQLPromiseConnection

  // upstream package missed type
  type escapeId = (val: any, forbidQualified?: boolean) => string

  interface BaseClient {
    format: typeof format;
    escape: typeof escape;
    escapeId: escapeId;
  }

  export type MySQLConnection = Pick<Connection, 'query' | 'execute'> & {
    connection: Connection;
  } & BaseClient

  export type MySQLPool = Pick<Pool, 'query' | 'execute' | 'getConnection'> & {
    pool: Pool;
  } & BaseClient

  export type MySQLPromiseConnection = Pick<
    PromiseConnection,
    'query' | 'execute'
  > & {
    connection: PromiseConnection;
  } & BaseClient

  export type MySQLPromisePool = Pick<
    PromisePool,
    'query' | 'execute' | 'getConnection'
  > & {
    pool: PromisePool;
  } & BaseClient

  export type ConnectionType = 'connection' | 'pool'

  export interface FastifyMySQLOptions extends PoolOptions, ConnectionOptions {
    type?: ConnectionType;
    name?: string;
    promise?: boolean;
    connectionString?: string;
  }

  export type MySQLProcedureCallPacket<
    T = [MySQLRowDataPacket[], MySQLResultSetHeader] | MySQLResultSetHeader
  > = ProcedureCallPacket<T>
  export type MySQLResultSetHeader = ResultSetHeader
  export type MySQLRowDataPacket = RowDataPacket

  export const fastifyMysql: FastifyMysql
  export { fastifyMysql as default }

  export {
    ResultSetHeader,
    RowDataPacket,
  }
}

declare function fastifyMysql (...params: Parameters<FastifyMysql>): ReturnType<FastifyMysql>
export = fastifyMysql

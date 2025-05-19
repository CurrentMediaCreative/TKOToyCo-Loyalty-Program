declare module "sql.js" {
  interface SqlJsStatic {
    Database: new (data?: Uint8Array) => Database;
    FS: any;
  }

  interface Database {
    exec(sql: string, params?: any[]): any[];
    run(sql: string, params?: any[]): any;
    export(): Uint8Array;
    close(): void;
  }

  function initSqlJs(config?: any): Promise<SqlJsStatic>;

  namespace initSqlJs {
    interface Database {
      exec(sql: string, params?: any[]): any[];
      run(sql: string, params?: any[]): any;
      export(): Uint8Array;
      close(): void;
    }
  }

  export default initSqlJs;
}

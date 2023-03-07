import path from 'path'

import { open } from 'sqlite'
import type { Database } from 'sqlite'
import sqlite3 from 'sqlite3'

import { getConfig } from '@redwoodjs/internal/dist/config'
import { getPaths } from '@redwoodjs/internal/dist/paths'

let db: Database<sqlite3.Database, sqlite3.Statement>

export const getDatabase = async () => {
  // Switch between in-memory and file-based database based on toml config
  const filename = getConfig().dashboard.inMemory
    ? ':memory:'
    : path.join(getPaths().generated.base, 'dashboard.db')

  if (db === undefined) {
    db = await open({
      filename,
      driver: sqlite3.Database,
    })
  }
  return db
}

export const setupTables = async () => {
  const db = await getDatabase()

  // BIGINT for UnixNano times will break in 239 years (Fri Apr 11 2262 23:47:16 GMT+0000)
  const spanTableSQL = `CREATE TABLE IF NOT EXISTS span (id TEXT PRIMARY KEY, trace TEXT NOT NULL, parent TEXT, name TEXT, kind INTEGER, status_code INTEGER, status_message TEXT, start_nano BIGINT, end_nano BIGINT, duration_nano BIGINT, events JSON, attributes JSON, resources, JSON);`
  await db.exec(spanTableSQL)
}

export const setupViews = async () => {
  const v = `CREATE VIEW IF NOT EXISTS prisma_queries as SELECT DISTINCT
s.id,
s.trace,
s.parent as parent_id,
p.trace as parent_trace,
s.name,
json_extract(p. "attributes", '$.method') AS method,
json_extract(p. "attributes", '$.model') AS model,
json_extract(p. "attributes", '$.name') AS prisma_name,
s.start_nano,
s.end_nano,
s.duration_nano,
cast((s.duration_nano / 1000000.000) as REAL) as duration_ms,
cast((s.duration_nano / 1000000000.0000) as number) as duration_sec,
json_extract(s. "attributes", '$."db.statement"') AS db_statement
FROM
span s
JOIN span p ON s.trace = p.trace
WHERE
s. "name" = 'prisma:engine:db_query'
AND p. "name" = 'prisma:client:operation' order by s.start_nano desc, s.parent;
`

  await db.exec(v)
}
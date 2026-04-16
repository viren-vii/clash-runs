import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  db = await SQLite.openDatabaseAsync('clash-runs.db');
  await initDatabase(db);
  return db;
}

async function initDatabase(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      start_time INTEGER NOT NULL,
      end_time INTEGER,
      status TEXT NOT NULL DEFAULT 'active',
      total_distance REAL DEFAULT 0,
      total_steps INTEGER DEFAULT 0,
      elapsed_time INTEGER DEFAULT 0,
      activity_type TEXT DEFAULT 'run',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS route_points (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      altitude REAL,
      accuracy REAL,
      speed REAL,
      timestamp INTEGER NOT NULL,
      segment_index INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS activity_segments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
      segment_index INTEGER NOT NULL,
      activity_type TEXT NOT NULL DEFAULT 'unknown',
      confidence TEXT,
      start_time INTEGER NOT NULL,
      end_time INTEGER,
      distance REAL DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_route_points_session ON route_points(session_id);
    CREATE INDEX IF NOT EXISTS idx_route_points_segment ON route_points(session_id, segment_index);
    CREATE INDEX IF NOT EXISTS idx_activity_segments_session ON activity_segments(session_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
  `);

  // Migrations — add columns that didn't exist in the original schema
  const migrations = [
    'ALTER TABLE sessions ADD COLUMN user_weight REAL DEFAULT 70',
    'ALTER TABLE sessions ADD COLUMN synced_at INTEGER',
  ];
  for (const sql of migrations) {
    try {
      await database.execAsync(`${sql};`);
    } catch {
      // Column already exists — ignore
    }
  }
}


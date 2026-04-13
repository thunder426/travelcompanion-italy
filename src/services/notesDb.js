import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('travel.db');

export function initDb() {
  // Create table if it doesn't exist
  db.execSync(`
    CREATE TABLE IF NOT EXISTS notes (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      type            TEXT    NOT NULL DEFAULT 'note',
      title           TEXT    NOT NULL DEFAULT '',
      body            TEXT    DEFAULT '',
      items           TEXT    DEFAULT NULL,
      reminder_time   INTEGER DEFAULT NULL,
      notification_id TEXT    DEFAULT NULL,
      created_at      INTEGER DEFAULT (strftime('%s','now')),
      updated_at      INTEGER DEFAULT (strftime('%s','now'))
    )
  `);
  // Migrate existing tables that may be missing newer columns
  const migrations = [
    `ALTER TABLE notes ADD COLUMN type TEXT NOT NULL DEFAULT 'note'`,
    `ALTER TABLE notes ADD COLUMN items TEXT DEFAULT NULL`,
    `ALTER TABLE notes ADD COLUMN reminder_time INTEGER DEFAULT NULL`,
    `ALTER TABLE notes ADD COLUMN notification_id TEXT DEFAULT NULL`,
  ];
  for (const sql of migrations) {
    try { db.execSync(sql); } catch {} // ignore "duplicate column" errors
  }
}

// ── Notes ─────────────────────────────────────────────────────────────────────
export function getAllNotes() {
  return db.getAllSync(
    `SELECT * FROM notes WHERE type='note' ORDER BY updated_at DESC`
  );
}

export function saveNote(title, body, id = null) {
  if (id) {
    db.runSync(
      `UPDATE notes SET title=?, body=?, updated_at=strftime('%s','now') WHERE id=?`,
      [title, body, id]
    );
    return id;
  }
  const r = db.runSync(
    `INSERT INTO notes (type, title, body) VALUES ('note', ?, ?)`,
    [title, body]
  );
  return r.lastInsertRowId;
}

// ── Todos ─────────────────────────────────────────────────────────────────────
export function getAllTodos() {
  return db.getAllSync(
    `SELECT * FROM notes WHERE type='todo' ORDER BY updated_at DESC`
  );
}

export function saveTodo(title, items, reminderTime, notificationId, id = null) {
  const itemsJson = JSON.stringify(items);
  if (id) {
    db.runSync(
      `UPDATE notes SET title=?, items=?, reminder_time=?, notification_id=?, updated_at=strftime('%s','now') WHERE id=?`,
      [title, itemsJson, reminderTime ?? null, notificationId ?? null, id]
    );
    return id;
  }
  const r = db.runSync(
    `INSERT INTO notes (type, title, items, reminder_time, notification_id) VALUES ('todo', ?, ?, ?, ?)`,
    [title, itemsJson, reminderTime ?? null, notificationId ?? null]
  );
  return r.lastInsertRowId;
}

export function updateTodoItems(id, items) {
  db.runSync(
    `UPDATE notes SET items=?, updated_at=strftime('%s','now') WHERE id=?`,
    [JSON.stringify(items), id]
  );
}

// ── Shared ────────────────────────────────────────────────────────────────────
export function deleteNote(id) {
  db.runSync(`DELETE FROM notes WHERE id=?`, [id]);
}

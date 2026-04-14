import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('travel.db');

export function initDb() {
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
  db.execSync(`
    CREATE TABLE IF NOT EXISTS expenses (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      amount     REAL    NOT NULL,
      category   TEXT    NOT NULL DEFAULT 'Other',
      note       TEXT    DEFAULT '',
      date       TEXT    NOT NULL,
      created_at INTEGER DEFAULT (strftime('%s','now'))
    )
  `);
  const migrations = [
    `ALTER TABLE notes ADD COLUMN type TEXT NOT NULL DEFAULT 'note'`,
    `ALTER TABLE notes ADD COLUMN items TEXT DEFAULT NULL`,
    `ALTER TABLE notes ADD COLUMN reminder_time INTEGER DEFAULT NULL`,
    `ALTER TABLE notes ADD COLUMN notification_id TEXT DEFAULT NULL`,
    `ALTER TABLE notes ADD COLUMN photo_uri TEXT DEFAULT NULL`,
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

export function saveNote(title, body, id = null, photoUri = null) {
  if (id) {
    db.runSync(
      `UPDATE notes SET title=?, body=?, photo_uri=?, updated_at=strftime('%s','now') WHERE id=?`,
      [title, body, photoUri ?? null, id]
    );
    return id;
  }
  const r = db.runSync(
    `INSERT INTO notes (type, title, body, photo_uri) VALUES ('note', ?, ?, ?)`,
    [title, body, photoUri ?? null]
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

// ── Expenses ──────────────────────────────────────────────────────────────────
export function getAllExpenses() {
  return db.getAllSync(`SELECT * FROM expenses ORDER BY date DESC, created_at DESC`);
}

export function saveExpense(amount, category, note, date) {
  const r = db.runSync(
    `INSERT INTO expenses (amount, category, note, date) VALUES (?, ?, ?, ?)`,
    [amount, category, note, date]
  );
  return r.lastInsertRowId;
}

export function updateExpense(id, amount, category, note) {
  db.runSync(
    `UPDATE expenses SET amount=?, category=?, note=? WHERE id=?`,
    [amount, category, note, id]
  );
}

export function deleteExpense(id) {
  db.runSync(`DELETE FROM expenses WHERE id=?`, [id]);
}

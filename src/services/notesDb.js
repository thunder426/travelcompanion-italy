import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('travel.db');

// Initialise schema — call once at app startup
export function initDb() {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS notes (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      title      TEXT NOT NULL DEFAULT '',
      body       TEXT DEFAULT '',
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now'))
    )
  `);
}

export function getAllNotes() {
  return db.getAllSync('SELECT * FROM notes ORDER BY updated_at DESC');
}

export function saveNote(title, body, id = null) {
  if (id) {
    db.runSync(
      "UPDATE notes SET title=?, body=?, updated_at=strftime('%s','now') WHERE id=?",
      [title, body, id]
    );
    return id;
  } else {
    const result = db.runSync(
      'INSERT INTO notes (title, body) VALUES (?, ?)',
      [title, body]
    );
    return result.lastInsertRowId;
  }
}

export function deleteNote(id) {
  db.runSync('DELETE FROM notes WHERE id=?', [id]);
}

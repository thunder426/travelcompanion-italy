import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('travel.db');

export function initMenusDb() {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS saved_menus (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      title       TEXT    NOT NULL DEFAULT 'Untitled Menu',
      translation TEXT    NOT NULL,
      photo_uri   TEXT    DEFAULT NULL,
      created_at  INTEGER DEFAULT (strftime('%s','now')),
      updated_at  INTEGER DEFAULT (strftime('%s','now'))
    )
  `);
  // Add photo_uris column for multi-page menus; legacy rows keep photo_uri set.
  const cols = db.getAllSync(`PRAGMA table_info(saved_menus)`);
  if (!cols.some((c) => c.name === 'photo_uris')) {
    db.execSync(`ALTER TABLE saved_menus ADD COLUMN photo_uris TEXT`);
  }
}

function parseUris(row) {
  if (row?.photo_uris) {
    try {
      const arr = JSON.parse(row.photo_uris);
      if (Array.isArray(arr) && arr.length > 0) return arr;
    } catch {}
  }
  return row?.photo_uri ? [row.photo_uri] : [];
}

// Expose the JSON-array form plus a convenience first-page alias.
function withPhotos(row) {
  if (!row) return row;
  const uris = parseUris(row);
  return { ...row, photo_uris_arr: uris, photo_uri: uris[0] || null };
}

export function saveMenu(title, translation, photoUris) {
  const arr = Array.isArray(photoUris) ? photoUris : photoUris ? [photoUris] : [];
  const r = db.runSync(
    `INSERT INTO saved_menus (title, translation, photo_uri, photo_uris) VALUES (?, ?, ?, ?)`,
    [
      title || 'Untitled Menu',
      translation,
      arr[0] || null,
      arr.length > 0 ? JSON.stringify(arr) : null,
    ]
  );
  return r.lastInsertRowId;
}

export function getAllMenus() {
  return db.getAllSync(`SELECT * FROM saved_menus ORDER BY created_at DESC`).map(withPhotos);
}

export function getMenu(id) {
  const rows = db.getAllSync(`SELECT * FROM saved_menus WHERE id = ?`, [id]);
  return rows.length > 0 ? withPhotos(rows[0]) : null;
}

export function updateMenuTitle(id, title) {
  db.runSync(
    `UPDATE saved_menus SET title=?, updated_at=strftime('%s','now') WHERE id=?`,
    [title, id]
  );
}

export function deleteMenu(id) {
  db.runSync(`DELETE FROM saved_menus WHERE id=?`, [id]);
}

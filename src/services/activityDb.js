import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('travel.db');

export function initActivityDb() {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS daily_activity (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      date        TEXT    NOT NULL UNIQUE,
      steps       INTEGER NOT NULL DEFAULT 0,
      distance_km REAL    NOT NULL DEFAULT 0,
      active_min  INTEGER NOT NULL DEFAULT 0,
      path_json   TEXT    DEFAULT NULL,
      updated_at  INTEGER DEFAULT (strftime('%s','now'))
    )
  `);
}

export function getActivityForDate(dateStr) {
  const rows = db.getAllSync(
    `SELECT * FROM daily_activity WHERE date = ?`,
    [dateStr]
  );
  return rows.length > 0 ? rows[0] : null;
}

export function upsertActivity(dateStr, steps, distanceKm, activeMin, pathJson) {
  const existing = getActivityForDate(dateStr);
  if (existing) {
    db.runSync(
      `UPDATE daily_activity
         SET steps=?, distance_km=?, active_min=?, path_json=?,
             updated_at=strftime('%s','now')
       WHERE date=?`,
      [steps, distanceKm, activeMin, pathJson, dateStr]
    );
    return existing.id;
  }
  const r = db.runSync(
    `INSERT INTO daily_activity (date, steps, distance_km, active_min, path_json)
     VALUES (?, ?, ?, ?, ?)`,
    [dateStr, steps, distanceKm, activeMin, pathJson]
  );
  return r.lastInsertRowId;
}

export function appendPathPoints(dateStr, newPoints) {
  const existing = getActivityForDate(dateStr);
  let allPoints = [];
  if (existing && existing.path_json) {
    try { allPoints = JSON.parse(existing.path_json); } catch {}
  }
  allPoints = allPoints.concat(newPoints);
  const json = JSON.stringify(allPoints);
  if (existing) {
    db.runSync(
      `UPDATE daily_activity SET path_json=?, updated_at=strftime('%s','now') WHERE date=?`,
      [json, dateStr]
    );
  } else {
    db.runSync(
      `INSERT INTO daily_activity (date, path_json) VALUES (?, ?)`,
      [dateStr, json]
    );
  }
}

export function getRecentActivity(days = 7) {
  return db.getAllSync(
    `SELECT * FROM daily_activity ORDER BY date DESC LIMIT ?`,
    [days]
  );
}

import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('travel.db');

export function initOrdersDb() {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS menu_orders (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      menu_id     INTEGER NOT NULL,
      meal_id     INTEGER,
      section_idx INTEGER NOT NULL,
      item_idx    INTEGER NOT NULL,
      dish_photo  TEXT,
      rating      INTEGER,
      note        TEXT,
      created_at  INTEGER DEFAULT (strftime('%s','now'))
    )
  `);
}

export function getOrdersForMeal(mealId) {
  return db.getAllSync(
    `SELECT * FROM menu_orders WHERE meal_id = ? ORDER BY created_at ASC`,
    [mealId]
  );
}

export function upsertOrder({ mealId, menuId, sectionIdx, itemIdx, dishPhoto, rating, note }) {
  const existing = db.getAllSync(
    `SELECT id FROM menu_orders WHERE meal_id = ? AND section_idx = ? AND item_idx = ?`,
    [mealId, sectionIdx, itemIdx]
  )[0];
  if (existing) {
    db.runSync(
      `UPDATE menu_orders
         SET dish_photo = ?, rating = ?, note = ?
       WHERE id = ?`,
      [dishPhoto ?? null, rating ?? null, note ?? null, existing.id]
    );
  } else {
    db.runSync(
      `INSERT INTO menu_orders (menu_id, meal_id, section_idx, item_idx, dish_photo, rating, note)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [menuId, mealId, sectionIdx, itemIdx, dishPhoto ?? null, rating ?? null, note ?? null]
    );
  }
}

export function deleteOrder(mealId, sectionIdx, itemIdx) {
  db.runSync(
    `DELETE FROM menu_orders WHERE meal_id = ? AND section_idx = ? AND item_idx = ?`,
    [mealId, sectionIdx, itemIdx]
  );
}

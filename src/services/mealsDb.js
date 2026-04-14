import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('travel.db');

export function initMealsDb() {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS meals (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      menu_id    INTEGER NOT NULL,
      eaten_at   INTEGER NOT NULL,
      note       TEXT,
      created_at INTEGER DEFAULT (strftime('%s','now'))
    )
  `);

  // Ensure menu_orders exists before we touch its schema. initOrdersDb should
  // have run first, but defensive no-op create keeps init-order bugs harmless.
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

  // If menu_orders still carries the old UNIQUE(menu_id, section_idx, item_idx)
  // table constraint, SQLite created an auto-index that can't be dropped.
  // Detect it and rebuild the table without the constraint, copying rows over
  // and backfilling one meal per menu_id.
  const idxRows = db.getAllSync(`PRAGMA index_list(menu_orders)`);
  const hasOldAutoIndex = idxRows.some(
    (r) => r.origin === 'u' && r.name.startsWith('sqlite_autoindex_menu_orders')
  );
  const cols = db.getAllSync(`PRAGMA table_info(menu_orders)`);
  const hasMealId = cols.some((c) => c.name === 'meal_id');

  if (hasOldAutoIndex || !hasMealId) {
    // Make sure every row has a meal_id before the copy. Create meal_id if
    // missing, then assign one backfill meal per distinct menu_id.
    if (!hasMealId && cols.length > 0) {
      db.execSync(`ALTER TABLE menu_orders ADD COLUMN meal_id INTEGER`);
    }
    const menuIds = db.getAllSync(
      `SELECT DISTINCT menu_id FROM menu_orders WHERE meal_id IS NULL`
    );
    for (const { menu_id } of menuIds) {
      const oldest = db.getAllSync(
        `SELECT MIN(created_at) AS t FROM menu_orders WHERE menu_id = ?`,
        [menu_id]
      )[0]?.t || Math.floor(Date.now() / 1000);
      const r = db.runSync(
        `INSERT INTO meals (menu_id, eaten_at, note) VALUES (?, ?, ?)`,
        [menu_id, oldest, null]
      );
      db.runSync(
        `UPDATE menu_orders SET meal_id = ? WHERE menu_id = ? AND meal_id IS NULL`,
        [r.lastInsertRowId, menu_id]
      );
    }
    // Rebuild the table without the old UNIQUE constraint.
    db.execSync(`
      CREATE TABLE menu_orders_new (
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
    db.execSync(`
      INSERT INTO menu_orders_new
        (id, menu_id, meal_id, section_idx, item_idx, dish_photo, rating, note, created_at)
      SELECT id, menu_id, meal_id, section_idx, item_idx, dish_photo, rating, note, created_at
      FROM menu_orders
    `);
    db.execSync(`DROP TABLE menu_orders`);
    db.execSync(`ALTER TABLE menu_orders_new RENAME TO menu_orders`);
  }

  db.execSync(`
    CREATE UNIQUE INDEX IF NOT EXISTS menu_orders_meal_unique
      ON menu_orders(meal_id, section_idx, item_idx)
  `);
}

export function createMeal(menuId, eatenAt = Math.floor(Date.now() / 1000)) {
  const r = db.runSync(
    `INSERT INTO meals (menu_id, eaten_at, note) VALUES (?, ?, NULL)`,
    [menuId, eatenAt]
  );
  return r.lastInsertRowId;
}

export function getMeal(mealId) {
  const rows = db.getAllSync(`SELECT * FROM meals WHERE id = ?`, [mealId]);
  return rows[0] || null;
}

export function getAllMeals() {
  return db.getAllSync(`
    SELECT m.*, s.title AS menu_title, s.translation, s.photo_uri AS menu_photo
    FROM meals m
    JOIN saved_menus s ON s.id = m.menu_id
    ORDER BY m.eaten_at DESC
  `);
}

export function getMealsForMenu(menuId) {
  return db.getAllSync(
    `SELECT * FROM meals WHERE menu_id = ? ORDER BY eaten_at DESC`,
    [menuId]
  );
}

export function updateMeal(mealId, { eatenAt, note }) {
  db.runSync(
    `UPDATE meals SET eaten_at = COALESCE(?, eaten_at), note = ? WHERE id = ?`,
    [eatenAt ?? null, note ?? null, mealId]
  );
}

export function deleteMeal(mealId) {
  db.runSync(`DELETE FROM menu_orders WHERE meal_id = ?`, [mealId]);
  db.runSync(`DELETE FROM meals WHERE id = ?`, [mealId]);
}

export function getMealOrders(mealId) {
  return db.getAllSync(
    `SELECT * FROM menu_orders WHERE meal_id = ? ORDER BY created_at ASC`,
    [mealId]
  );
}

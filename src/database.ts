import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";
import { TUser } from "./utils/user.type";
import { consts } from "./utils/consts";

// Database connection
let db: any;

// Initialize the database
export async function initDb() {
  // Create database connection
  db = await open({
    filename: path.join(__dirname, `../${consts.projectName}_database.sqlite`),
    driver: sqlite3.Database,
  });

  // Create users table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      telegram_id INTEGER UNIQUE,
      uid TEXT UNIQUE,
      username TEXT,
      name TEXT,
      spot_balance INTEGER DEFAULT 0,
      contract_balance INTEGER DEFAULT 0,
      joined BOOLEAN DEFAULT 0,
      joined_at TEXT,
      kicked_at TEXT,
      language_code TEXT DEFAULT "en",
      is_admin BOOLEAN DEFAULT 0
    )
  `);

  // Create settings table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    )
  `);

  // Initialize threshold setting if it doesn't exist
  const threshold = await db.get(
    "SELECT value FROM settings WHERE key = ?",
    "threshold",
  );
  if (!threshold) {
    await db.run(
      "INSERT INTO settings (key, value) VALUES (?, ?)",
      "threshold",
      process.env.DEFAULT_THRESHOLD || "100",
    );
  }
  const welcomeMessage = await db.get(
    "SELECT value FROM settings WHERE key = ?",
    "welcome_message",
  );
  if (!threshold) {
    await db.run(
      "INSERT INTO settings (key, value) VALUES (?, ?)",
      "welcome_message",
      "👋 Welcome! \nyou can change this message with /editWelcome",
    );
  }

  console.log(new Date().toString(), "Database initialized");
  return db;
}

export async function updateUserBalances(
  uid: string,
  spotBalance: number,
  contractBalance: number,
) {
  return db.run(
    `INSERT INTO users (uid, spot_balance, contract_balance)
     VALUES (?, ?, ?)
     ON CONFLICT(uid) DO UPDATE SET
       spot_balance = excluded.spot_balance,
       contract_balance = excluded.contract_balance`,
    uid,
    spotBalance,
    contractBalance,
  );
}

export async function markUserJoined(telegramId: number) {
  const now = new Date().toISOString();
  return db.run(
    "UPDATE users SET joined = 1, joined_at = ? WHERE telegram_id = ?",
    now,
    telegramId,
  );
}

export async function markUserKicked(telegramId: number) {
  const now = new Date().toISOString();
  return db.run(
    "UPDATE users SET joined = 0, kicked_at = ? WHERE telegram_id = ?",
    now,
    telegramId,
  );
}

export async function makeAdmin(telegramId: number) {
  return db.run(
    "UPDATE users SET is_admin = 1 WHERE telegram_id = ?",
    telegramId,
  );
}

export async function getUsersCsv() {
  const users = await db.all("SELECT * FROM users");

  // Get CSV header from keys of the first user (if exists)
  if (users.length === 0) return "";

  const headers = Object.keys(users[0]).join(",");
  const rows = users.map((user: any) =>
    Object.values(user)
      .map((value) => `"${String(value).replace(/"/g, '""')}"`) // escape quotes
      .join(","),
  );

  return [headers, ...rows].join("\n");
}

// Settings functions
export async function getWelcomeMessage() {
  const result = await db.get(
    "SELECT value FROM settings WHERE key = ?",
    "welcome_message",
  );
  return result.value as string;
}

export async function setWelcomeMessage(value: string) {
  return db.run(
    "UPDATE settings SET value = ? WHERE key = ?",
    value,
    "welcome_message",
  );
}
export async function getThreshold() {
  const result = await db.get(
    "SELECT value FROM settings WHERE key = ?",
    "threshold",
  );
  return result ? parseInt(result.value, 10) : 100;
}

export async function setThreshold(value: number) {
  return db.run(
    "UPDATE settings SET value = ? WHERE key = ?",
    value.toString(),
    "threshold",
  );
}

// Helper for calculating total balance
export function getTotalBalance(user: any): number {
  return (user.spot_balance || 0) + (user.contract_balance || 0);
}

// Get user by Telegram ID
export async function getUserByTelegramId(
  telegramId: number,
): Promise<TUser | null> {
  return db.get("SELECT * FROM users WHERE telegram_id = ?", telegramId);
}

// Get user by UID
export async function getUserByUid(uid: string): Promise<TUser | null> {
  return db.get("SELECT * FROM users WHERE uid = ?", uid);
}

// Get all joined users
export async function getJoinedUsers(): Promise<TUser[]> {
  return db.all("SELECT * FROM users WHERE joined = 1");
}

// Save user
export async function saveUser(
  user: Partial<Omit<TUser, "telegram_id">> & Pick<TUser, "telegram_id">,
): Promise<void> {
  const existing = await getUserByTelegramId(user.telegram_id);

  if (existing && user.uid) {
    // Delete the old row with telegram_id
    await db.run(`DELETE FROM users WHERE telegram_id = ?`, user.telegram_id);

    // Update the row with matching uid
    return db.run(
      `UPDATE users SET 
        telegram_id = ?, 
        username = COALESCE(?, username),
        name = COALESCE(?, name),
        spot_balance = COALESCE(?, spot_balance),
        contract_balance = COALESCE(?, contract_balance),
        joined = COALESCE(?, joined),
        joined_at = COALESCE(?, joined_at),
        kicked_at = COALESCE(?, kicked_at),
        is_admin = COALESCE(?, is_admin)
      WHERE uid = ?`,
      user.telegram_id,
      user.username,
      user.name,
      user.spot_balance,
      user.contract_balance,
      user.joined,
      user.joined_at,
      user.kicked_at,
      user.is_admin,
      user.uid,
    );
  } else if (existing) {
    // Update existing user
    return db.run(
      `UPDATE users SET 
        uid = COALESCE(?, uid),
        username = COALESCE(?, username),
        name = COALESCE(?, name),
        spot_balance = COALESCE(?, spot_balance),
        contract_balance = COALESCE(?, contract_balance),
        joined = COALESCE(?, joined),
        joined_at = COALESCE(?, joined_at),
        kicked_at = COALESCE(?, kicked_at),
        is_admin = COALESCE(?, is_admin)
      WHERE telegram_id = ?`,
      user.uid,
      user.username,
      user.name,
      user.spot_balance,
      user.contract_balance,
      user.joined,
      user.joined_at,
      user.kicked_at,
      user.is_admin,
      user.telegram_id,
    );
  } else {
    // Insert new user
    return db.run(
      `INSERT INTO users (
        telegram_id, uid, username, name, 
        spot_balance, contract_balance, 
        joined, joined_at, kicked_at, is_admin
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      user.telegram_id,
      user.uid,
      user.username,
      user.name,
      user.spot_balance || 0,
      user.contract_balance || 0,
      user.joined || 0,
      user.joined_at,
      user.kicked_at,
      user.is_admin || 0,
    );
  }
}

export async function getIsAdmin(telegramId: number): Promise<boolean> {
  const user = await db.get(
    "SELECT is_admin FROM users WHERE telegram_id = ?",
    telegramId,
  );
  return user?.is_admin === 1;
}

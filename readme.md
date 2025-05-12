# Telegram Bot Documentation

## Overview
This bot manages users based on their balance and allows admins to configure thresholds, manage users, and kick users below the threshold.

## How to Use

### 1. Start the Bot
- **Command**: `/start`
- Initializes interaction with the bot.
- If the user is not registered, the bot will ask for their UID.

### 2. Set the Threshold (Admin Only)
- **Command**: `/setthreshold <amount>`
- Admins can set the balance threshold for joining the group.

### 3. View Current Threshold (Admin Only)
- **Command**: `/threshold`
- Shows the current threshold.

### 4. Add New Admin (Admin Only)
- **Command**: `/addadmin <telegram_id>`
- Adds a new admin by their Telegram ID.

### 5. Force Kick Users Below Threshold (Admin Only)
- **Command**: `/forcekick`
- Kicks users from the group who are below the balance threshold.

### 6. Bot Statistics (Admin Only)
- **Command**: `/stats`
- Displays bot statistics like total users, kicked users, etc.

### 7. Group Join Event
- New members who join the group are checked against the balance threshold.
- If their balance is below the threshold, they are kicked.

## Environment Variables

- `ADMIN_IDS`: List of Telegram IDs of admins (JSON format). Example:
  ```json
  [123456789, 987654321]
- `GROUP_ID`: Telegram group ID where the bot operates.
- `DATABASE_URL`: URL to connect to the database for storing user data, thresholds, and stats.

## Notes

- The bot uses `Telegraf` and interacts with a database to track user status, balances, and thresholds.
- Users must provide a UID upon starting if not previously registered.
- Admin actions require specific permissions via the `/addadmin` and `/setthreshold` commands.

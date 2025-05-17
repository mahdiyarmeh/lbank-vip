import { Telegraf, Context } from "telegraf";
import { startHandler } from "./commands/startHandler";
import { uidHandler } from "./commands/uidHandler";
import { setthreshholdHandler } from "./commands/setthreshholdHandler";
import { threshholdHandler } from "./commands/threshholdHandler";
import { addAdminHandler } from "./commands/addAdminHandler";
import { statsHandler } from "./commands/statsHandler";
import { forceKickHandler } from "./commands/forceKickHandler";
import { newMemberHandler } from "./commands/newMemberHandler";
import { leftMemberHandler } from "./commands/leftMemberHandler";
import { middleware } from "./middleware";
import { helpHandler } from "./commands/helpHandler";

export type UserState = "AWAITING_UID";

const userState = new Map<number, UserState>();

// Add user to context
export interface BotContext extends Context {
  user?: any;
}

// Simple translation function

// Create bot instance
export function createBot(token: string) {
  const bot = new Telegraf<BotContext>(token);

  bot.telegram.setMyCommands([
    { command: "start", description: "Start the bot" },
    // { command: "setthreshold", description: "Set the balance threshold" },
    // { command: "threshold", description: "Show current threshold" },
    // { command: "addadmin", description: "Add a new admin" },
    // { command: "forcekick", description: "Kick users below threshold" },
  ]);

  // Middleware to attach user to context
  bot.use(async (ctx, next) => middleware(ctx, next));

  // Start command
  bot.start((ctx) => startHandler(ctx, bot, userState));

  // Handle text messages (UID input)
  bot.hears(/^[^\/].+$/, (ctx) => uidHandler(ctx, bot, userState));

  // Admin commands
  bot.command("setthreshold", async (ctx) => setthreshholdHandler(ctx));

  bot.command("threshold", async (ctx) => threshholdHandler(ctx));

  bot.command("addadmin", async (ctx) => addAdminHandler(ctx));

  bot.command("stats", async (ctx) => statsHandler(ctx));

  bot.command("help", async (ctx) => helpHandler(ctx));

  // Force kick
  bot.command("forcekick", async (ctx) => forceKickHandler(ctx, bot));

  // Handle group join events
  bot.on("new_chat_members", async (ctx) => newMemberHandler(ctx, bot));

  // Handle members leaving
  bot.on("left_chat_member", async (ctx) => leftMemberHandler(ctx));

  return bot;
}

import { Telegraf, Context } from "telegraf";
import { startHandler } from "./commands/startHandler";
import { setthreshholdHandler } from "./commands/setthreshholdHandler";
import { threshholdHandler } from "./commands/threshholdHandler";
import { addAdminHandler } from "./commands/addAdminHandler";
import { statsHandler } from "./commands/statsHandler";
import { forceKickHandler } from "./commands/forceKickHandler";
import { newMemberHandler } from "./commands/newMemberHandler";
import { leftMemberHandler } from "./commands/leftMemberHandler";
import { middleware } from "./middleware";
import { helpHandler } from "./commands/helpHandler";
import { editWelcomeHandler } from "./commands/editWelcomeHandler";
import { uidHandler } from "./commands/uidHandler";
import { editWelcomeCommandHandler } from "./commands/editWelcomeCommandHandler";

export type UserState = "AWAITING_UID" | "AWAITING_WELCOME";

const userState = new Map<number, UserState>();

// Add user to context
export interface BotContext extends Context {
  user?: any;
}

// Create bot instance
export function createBot(token: string) {
  const bot = new Telegraf<BotContext>(token);

  bot.telegram.setMyCommands([
    { command: "start", description: "Start the bot" },
  ]);

  // Middleware to attach user to context
  bot.use(async (ctx, next) => middleware(ctx, next));

  // Start command
  bot.start((ctx) => startHandler(ctx, bot, userState));

  // Handle text messages (UID input)
  // bot.hears(/^[^\/]/, (ctx) => );

  // Admin commands
  bot.command("setthreshold", async (ctx) => setthreshholdHandler(ctx));
  bot.command("threshold", async (ctx) => threshholdHandler(ctx));
  bot.command("addadmin", async (ctx) => addAdminHandler(ctx));
  bot.command("stats", async (ctx) => statsHandler(ctx));
  bot.command("editWelcome", async (ctx) =>
    editWelcomeCommandHandler(ctx, userState),
  );
  bot.command("help", async (ctx) => helpHandler(ctx));
  bot.command("forcekick", async (ctx) => forceKickHandler(ctx, bot));

  // Handle group join events
  bot.on("new_chat_members", async (ctx) => newMemberHandler(ctx, bot));
  bot.on("left_chat_member", async (ctx) => leftMemberHandler(ctx));

  // DEFAULT HANDLER - Add this at the end
  // This catches all messages that didn't match previous handlers
  bot.on("message", async (ctx) => {
    if (userState.get(ctx.from!.id) == "AWAITING_UID")
      await uidHandler(ctx, bot, userState);

    if (userState.get(ctx.from!.id) == "AWAITING_WELCOME")
      await editWelcomeHandler(ctx, userState);
  });
  return bot;
}

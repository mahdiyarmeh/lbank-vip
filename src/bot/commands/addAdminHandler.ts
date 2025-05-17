import { BotContext } from "..";
import * as db from "../../database";
import { i18n } from "../../locale";
import { isAdmin } from "../helpers/isAdmin";

export async function addAdminHandler(ctx: BotContext) {
  if (!ctx.chat || !ctx.message || !("text" in ctx.message)) return;
  if (ctx.chat.type !== "private") return; // Skip if not a private chat

  const lang = ctx.from?.language_code || "en";

  if (!isAdmin(ctx)) {
    await ctx.reply(i18n(lang, "adminOnly"));
    return;
  }

  const args = ctx.message.text.split(" ");
  if (args.length < 2) {
    await ctx.reply("Please provide a Telegram ID");
    return;
  }

  const telegramId = parseInt(args[1], 10);
  if (isNaN(telegramId)) {
    await ctx.reply("Invalid Telegram ID");
    return;
  }

  await db.makeAdmin(telegramId);
  await ctx.reply(i18n(lang, "adminAdded", telegramId));
}

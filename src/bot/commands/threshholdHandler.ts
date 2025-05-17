import { BotContext } from "..";
import * as db from "../../database";
import { i18n } from "../../locale";

export async function threshholdHandler(ctx: BotContext) {
  if (!ctx.chat) return;
  if (ctx.chat.type !== "private") return; // Skip if not a private chat

  const lang = ctx.from?.language_code || "en";
  const threshold = await db.getThreshold();
  await ctx.reply(i18n(lang, "currentThreshold", threshold));
}

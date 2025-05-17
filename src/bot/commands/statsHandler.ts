import { BotContext } from "..";
import * as db from "../../database";
import { i18n } from "../../locale";
import { isAdmin } from "../helpers/isAdmin";

export async function statsHandler(ctx: BotContext) {
  if (!ctx.chat) return;
  if (ctx.chat.type !== "private") return; // Skip if not a private chat

  const lang = ctx.from?.language_code || "en";

  if (!isAdmin(ctx)) {
    await ctx.reply(i18n(lang, "adminOnly"));
    return;
  }

  const stats = await db.getStats();

  await ctx.reply(
    `📊 Bot Statistics:\n\n` +
      `Total users: ${stats.totalUsers}\n` +
      `Joined users: ${stats.joinedUsers}\n` +
      `Kicked users: ${stats.kickedUsers}\n` +
      `Admins: ${stats.admins}`,
  );
}

import { consts } from "../../utils/consts";
import { Telegraf } from "telegraf";
import { BotContext  } from "..";
import * as db from "../../database";
import { i18n } from "../../locale";
import { isAdmin } from "../helpers/isAdmin";
import { kickUserFromGroup } from "../helpers/kickUserFromGroup";

export async function forceKickHandler(
  ctx: BotContext,
  bot: Telegraf<BotContext>,
) {
  if (!ctx.chat) return;
  if (ctx.chat.type !== "private") return; // Skip if not a private chat

  const lang = consts.lang;

  if (!isAdmin(ctx)) {
    await ctx.reply(i18n(lang, "adminOnly"));
    return;
  }

  await ctx.reply("Starting force kick process...");

  const users = await db.getJoinedUsers();
  const threshold = await db.getThreshold();
  let kickedCount = 0;

  for (const user of users) {
    if (db.getTotalBalance(user) < threshold) {
      try {
        // Kick user
        await kickUserFromGroup(bot, user.telegram_id);
        await db.markUserKicked(user.telegram_id);
        kickedCount++;

        // Notify user
        try {
          await bot.telegram.sendMessage(
            user.telegram_id,
            i18n(lang, "kickedDueToBalance"),
          );
        } catch (notifyError) {
          console.error(new Date().toString(), 
            `Could not notify user ${user.telegram_id}:`,
            notifyError,
          );
        }
      } catch (kickError) {
        console.error(new Date().toString(), `Error kicking user ${user.telegram_id}:`, kickError);
      }
    }
  }

  await ctx.reply(`Force kick completed. ${kickedCount} users were removed.`);
}

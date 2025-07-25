import { Telegraf } from "telegraf";
import { BotContext } from "..";
import * as db from "../../database";
import { i18n } from "../../locale";
import { kickUserFromGroup } from "../helpers/kickUserFromGroup";
import { consts } from "../../utils/consts";

export async function newMemberHandler(
  ctx: BotContext,
  bot: Telegraf<BotContext>,
) {
  if (!ctx.chat || !ctx.message || !("new_chat_members" in ctx.message)) return;
  if (ctx.chat.id.toString() !== process.env.GROUP_ID) return;

  const lang = consts.lang || "en";
  for (const member of ctx.message.new_chat_members) {
    try {
      // Find user in database
      const user = await db.getUserByTelegramId(member.id);

      if (!user || !user.uid) {
        // Unregistered user - kick
        await kickUserFromGroup(bot, member.id);
        continue;
      }

      // Check balance against threshold
      const threshold = await db.getThreshold();
      if (db.getTotalBalance(user) < threshold) {
        // Below threshold - kick
        await kickUserFromGroup(bot, member.id);
        await db.markUserKicked(member.id);

        // Notify user
        try {
          await bot.telegram.sendMessage(
            member.id,
            i18n(lang, "belowThreshold", threshold, db.getTotalBalance(user)),
          );
        } catch (notifyError) {
          console.error(
            new Date().toString(),
            `Could not notify user ${member.id}:`,
            notifyError,
          );
        }
      } else {
        // Valid join - mark as joined
        await db.markUserJoined(member.id);
      }
    } catch (error) {
      console.error(
        new Date().toString(),
        `Error processing new member ${member.id}:`,
        error,
      );
    }
  }
}

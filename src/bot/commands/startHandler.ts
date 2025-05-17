import { BotContext, UserState } from "..";
import * as db from "../../database";
import { i18n } from "../../locale";
import { createInviteLink } from "../helpers/createInviteLink";

export async function startHandler(
  ctx: BotContext,
  bot: any,
  userState: Map<number, UserState>,
) {
  if (ctx.chat?.type !== "private") return;

  const lang = ctx.from?.language_code || "en";

  await ctx.reply(i18n(lang, "greeting"));
  const user = await db.getUserByTelegramId(ctx.from!.id);
  if (!user?.uid) {
    await ctx.reply(i18n(lang, "askUid"));
    userState.set(ctx.from!.id, "AWAITING_UID");
  } else {
    const threshold = await db.getThreshold();
    if (db.getTotalBalance(ctx.user) >= threshold) {
      const link = await createInviteLink(bot, process.env.GROUP_ID!);
      await ctx.reply(i18n(lang, "inviteSent"));
      await ctx.reply(link);
    } else {
      await ctx.reply(i18n(lang, "belowThreshold"));
    }
  }
}

import { consts } from "../../utils/consts";
import { BotContext, UserState } from "..";
import * as db from "../../database";
import { i18n } from "../../locale";
import { createInviteLink } from "../helpers/createInviteLink";
import { isAdmin } from "../helpers/isAdmin";

export async function startHandler(
  ctx: BotContext,
  bot: any,
  userState: Map<number, UserState>,
) {
  if (!ctx.chat || !ctx.message || !("text" in ctx.message)) return;
  if (ctx.chat.type !== "private") return; // Skip if not a private chat

  const lang = consts.lang;

  const welcomeMessage = await db.getWelcomeMessage();
  await ctx.reply(welcomeMessage || i18n(lang, "greeting"));
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

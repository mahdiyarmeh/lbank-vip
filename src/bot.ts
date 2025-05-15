import { Telegraf, Context } from "telegraf";
import * as db from "./database";
import { messages } from "./locale";

type UserState = "AWAITING_UID";

const userState = new Map<number, UserState>();

// Add user to context
interface BotContext extends Context {
  user?: any;
}

// Simple translation function
function i18n(lang: string, key: string, ...args: any[]): string {
  const locale = lang === "fa" ? "fa" : "en";
  let message = messages[locale][key as keyof typeof messages.en] || key;

  args.forEach((arg, i) => {
    message = message.replace(`{${i}}`, arg);
  });

  return message;
}

// Create bot instance
export function createBot(token: string) {
  const bot = new Telegraf<BotContext>(token);

  bot.telegram.setMyCommands([
    { command: "start", description: "Start the bot" },
    { command: "setthreshold", description: "Set the balance threshold" },
    { command: "threshold", description: "Show current threshold" },
    { command: "addadmin", description: "Add a new admin" },
    { command: "forcekick", description: "Kick users below threshold" },
  ]);

  // Middleware to attach user to context
  bot.use(async (ctx, next) => {
    if (ctx.from) {
      ctx.user = await db.getUserByTelegramId(ctx.from.id);

      // Create user if doesn't exist
      if (!ctx.user) {
        await db.saveUser({
          telegram_id: ctx.from.id,
          username: ctx.from.username,
          name: `${ctx.from.first_name} ${ctx.from.last_name || ""}`.trim(),
        });

        ctx.user = await db.getUserByTelegramId(ctx.from.id);
      }
    }

    await next();
  });

  // Helper functions
  const isAdmin = (ctx: BotContext): boolean => {
    if (!ctx.from) return false;

    // Check if admin IDs from env contains this user
    const adminIds = process.env.ADMIN_IDS
      ? JSON.parse(process.env.ADMIN_IDS)
      : [];

    if (adminIds.includes(ctx.from.id)) return true;

    // Check if user is admin in database
    return ctx.user?.is_admin === 1;
  };

  const createInviteLink = async (groupId: string): Promise<string> => {
    const link = await bot.telegram.createChatInviteLink(groupId, {
      creates_join_request: false,
      expire_date: Math.floor(Date.now() / 1000) + 300, // 5 minutes
      member_limit: 1, // One-time use
    });

    return link.invite_link;
  };

  // Start command
  bot.start(async (ctx) => {
    if (ctx.chat.type !== "private") return;  // Skip if not a private chat
    
    const lang = ctx.from?.language_code || "en";

    await ctx.reply(i18n(lang, "greeting"));
    const user = await db.getUserByTelegramId(ctx.from!.id);
    if (!user?.uid) {
      await ctx.reply(i18n(lang, "askUid"));
      userState.set(ctx.from!.id, "AWAITING_UID");
    } else {
      const threshold = await db.getThreshold();
      if (db.getTotalBalance(ctx.user) >= threshold) {
        const link = await createInviteLink(process.env.GROUP_ID!);
        await ctx.reply(i18n(lang, "inviteSent"));
        await ctx.reply(link);
      } else {
        await ctx.reply(i18n(lang, "belowThreshold"));
      }
    }
  });

  // Handle text messages (UID input)
  bot.on("text", async (ctx) => {
    // Skip commands
    if (ctx.message.text.startsWith("/")) return;
    if (userState.get(ctx.from!.id) !== "AWAITING_UID") return;

    const lang = ctx.from?.language_code || "en";

    try {
      // Get the UID from the message
      const uid = ctx.message.text.trim();

      // Check if the user already has a UID
      const existingUser = await db.getUserByTelegramId(ctx.from!.id);

      if (existingUser?.uid) {
        // User already has a UID, they cannot change it
        await ctx.reply(i18n(lang, "cannotChangeUid"));
        userState.delete(ctx.from!.id);
        return;
      }

      // Check if UID already exists in the database
      const uidUser = await db.getUserByUid(uid);

      if (uidUser?.telegram_id) {
        // UID is already associated with another Telegram ID
        await ctx.reply(i18n(lang, "uidAlreadyUsed"));
        userState.delete(ctx.from!.id);
        return;
      }

      // Save the user with UID
      await db.saveUser({
        telegram_id: ctx.from!.id,
        uid: uid,
      });

      // Refresh user data
      ctx.user = await db.getUserByTelegramId(ctx.from!.id);

      await ctx.reply(i18n(lang, "uidSaved"));

      // Optionally check for the threshold and send invite
      const threshold = await db.getThreshold();
      if (db.getTotalBalance(ctx.user) >= threshold) {
        const link = await createInviteLink(process.env.GROUP_ID!);
        await ctx.reply(i18n(lang, "inviteSent"));
        await ctx.reply(link);
      } else {
        await ctx.reply(i18n(lang, "belowThreshold"));
      }
    } catch (error) {
      console.error("Error processing UID input:", error);
      await ctx.reply(i18n(lang, "error"));
    }
    userState.delete(ctx.from!.id);
  });
  // Admin commands
  bot.command("setthreshold", async (ctx) => {
    if (ctx.chat.type !== "private") return;  // Skip if not a private chat
    
    const lang = ctx.from?.language_code || "en";

    if (!isAdmin(ctx)) {
      await ctx.reply(i18n(lang, "adminOnly"));
      return;
    }

    const args = ctx.message.text.split(" ");
    if (args.length < 2) {
      await ctx.reply(i18n(lang, "invalidThreshold"));
      return;
    }

    const threshold = parseInt(args[1], 10);
    if (isNaN(threshold) || threshold < 0) {
      await ctx.reply(i18n(lang, "invalidThreshold"));
      return;
    }

    await db.setThreshold(threshold);
    await ctx.reply(i18n(lang, "thresholdSet", threshold));
  });

  bot.command("threshold", async (ctx) => {
    if (ctx.chat.type !== "private") return;  // Skip if not a private chat
    
    const lang = ctx.from?.language_code || "en";
    const threshold = await db.getThreshold();
    await ctx.reply(i18n(lang, "currentThreshold", threshold));
  });

  bot.command("addadmin", async (ctx) => {
    if (ctx.chat.type !== "private") return;  // Skip if not a private chat
    
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
  });

  bot.command("stats", async (ctx) => {
    if (ctx.chat.type !== "private") return;  // Skip if not a private chat
    
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
  });

  // Force kick
  bot.command("forcekick", async (ctx) => {
    if (ctx.chat.type !== "private") return;  // Skip if not a private chat
    
    const lang = ctx.from?.language_code || "en";

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
              i18n(ctx.from?.language_code || "en", "kickedDueToBalance"),
            );
          } catch (notifyError) {
            console.error(
              `Could not notify user ${user.telegram_id}:`,
              notifyError,
            );
          }
        } catch (kickError) {
          console.error(`Error kicking user ${user.telegram_id}:`, kickError);
        }
      }
    }

    await ctx.reply(`Force kick completed. ${kickedCount} users were removed.`);
  });

  // Handle group join events
  bot.on("new_chat_members", async (ctx) => {
    if (ctx.chat.type !== "private") return;  // Skip if not a private chat
    
    // Skip if not in the target group
    if (ctx.chat.id.toString() !== process.env.GROUP_ID) return;

    for (const member of ctx.message.new_chat_members) {
      try {
        // Find user in database
        const user = await db.getUserByTelegramId(member.id);

        if (!user) {
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
              i18n(member.language_code || "en", "belowThreshold"),
            );
          } catch (notifyError) {
            console.error(`Could not notify user ${member.id}:`, notifyError);
          }
        } else {
          // Valid join - mark as joined
          await db.markUserJoined(member.id);
        }
      } catch (error) {
        console.error(`Error processing new member ${member.id}:`, error);
      }
    }
  });

  // Handle members leaving
  bot.on("left_chat_member", async (ctx) => {
    if (ctx.chat.type !== "private") return;  // Skip if not a private chat
    
    // Skip if not in the target group
    if (ctx.chat.id.toString() !== process.env.GROUP_ID) return;

    const member = ctx.message.left_chat_member;
    console.log(`${member.username || member.id} left the chat.`);
  });

  return bot;
}

export async function kickUserFromGroup(
  bot: Telegraf<BotContext>,
  userId: number,
): Promise<boolean> {
  try {
    await bot.telegram.banChatMember(
      process.env.GROUP_ID!,
      userId,
      Math.floor(Date.now() / 1000) + 60, // Ban for 1 minute
    );

    // Immediately unban to allow rejoining in the future
    await bot.telegram.unbanChatMember(process.env.GROUP_ID!, userId);
    return true;
  } catch (error) {
    console.error(`Error kicking user ${userId}:`, error);
    return false;
  }
}

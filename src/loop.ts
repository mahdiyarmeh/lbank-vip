import * as db from "./database";
import { Telegraf } from "telegraf";
import { kickUserFromGroup } from "./bot/helpers/kickUserFromGroup";
import { getTeamList, TGetTeamListRes } from "./services/getTeamList";

// Sync balances from API
export async function syncBalances(bot: Telegraf<any>) {
  try {
    console.log(new Date().toString(), "Syncing balances...");

    let response = { data: [] as TGetTeamListRes[] };
    try {
      response = await getTeamList().then((res) => res || { data: [] });
    } catch (e) {
      console.log(new Date().toString(), e);
    }
    const users = await db.getJoinedUsers();
    const threshold = await db.getThreshold();

    // Update balances for all users
    for (const balance of response.data) {
      try {
        // Update user balances
        await db.updateUserBalances(
          balance.openId,
          Number(balance.currencyTotalFeeAmt),
          Number(balance.contractTotalFeeAmt),
        );
      } catch (error) {
        console.error(
          new Date().toString(),
          `Error updating balance for UID ${balance.openId}:`,
          error,
        );
      }
    }

    // Check if any joined users are now below threshold
    for (const user of users) {
      try {
        // Get fresh user data with updated balances
        const updatedUser = await db.getUserByTelegramId(user.telegram_id);

        if (updatedUser && db.getTotalBalance(updatedUser) < threshold) {
          console.log(
            new Date().toString(),
            `User ${user.telegram_id} below threshold, kicking...`,
          );

          // Kick user from group
          const kicked = await kickUserFromGroup(bot, user.telegram_id);

          if (kicked) {
            await db.markUserKicked(user.telegram_id);

            // Notify user
            try {
              const lang = user.language_code || "en";
              await bot.telegram.sendMessage(
                user.telegram_id,
                lang === "fa"
                  ? "به دلیل کمتر بودن موجودی شما از حد آستانه، از گروه حذف شده اید."
                  : "You have been removed from the group because your balance fell below the threshold.",
              );
            } catch (notifyError) {
              console.error(
                new Date().toString(),
                `Could not notify user ${user.telegram_id}:`,
                notifyError,
              );
            }
          }
        }
      } catch (userError) {
        console.error(
          new Date().toString(),
          `Error checking user ${user.telegram_id}:`,
          userError,
        );
      }
    }

    console.log(new Date().toString(), "Balance sync completed");
  } catch (error) {
    console.error(new Date().toString(), "Error syncing balances:", error);
  }
}

// Setup periodic balance syncing
export function setupBalanceSync(bot: Telegraf<any>) {
  // Schedule periodic sync using setInterval
  const interval =
    parseInt(process.env.SYNC_INTERVAL_MINUTES || "30", 10) * 60 * 1000;

  setInterval(() => {
    syncBalances(bot).catch((err) =>
      console.error(
        new Date().toString(),
        "Error in scheduled balance sync:",
        err,
      ),
    );
  }, interval);

  // Run initial sync
  syncBalances(bot).catch((err) =>
    console.error(new Date().toString(), "Error in initial balance sync:", err),
  );

  console.log(new Date().toString(), `Balance sync scheduled every ${interval / 60000} minutes`);
}

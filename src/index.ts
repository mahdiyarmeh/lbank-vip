import { initDb } from "./database";
import { createBot } from "./bot";
import { setupBalanceSync } from "./loop";
import { consts } from "./utils/consts";

async function main() {
  while (true) {
    try {
      // Initialize database
      await initDb();

      // Create bot
      const bot = createBot(consts.botToken);

      // Setup balance sync
      setupBalanceSync(bot);

      // Start bot
      const MAX_RETRIES = 10;

      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
          await bot.launch();
          console.log("Bot started successfully");
          break; // success
        } catch (e) {
          console.log(`Launch failed (attempt ${attempt})`);
          if (attempt === MAX_RETRIES) throw e;
          await new Promise((res) => setTimeout(res, 1000)); // wait before retrying
        }
      }

      // Handle graceful shutdown
      process.once("SIGINT", () => bot.stop("SIGINT"));
      process.once("SIGTERM", () => bot.stop("SIGTERM"));

      break; // Break out of loop if everything runs successfully
    } catch (error) {
      console.error("Error starting application:", error);
      console.log("Restarting application...");
      await new Promise((res) => setTimeout(res, 3000)); // Optionally wait before restart
    }
  }
}

main();

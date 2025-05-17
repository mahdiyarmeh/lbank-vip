import { Telegraf } from "telegraf";
import { consts } from "./utils/consts";
import https from "https";


const bot = new Telegraf(consts.botToken, {
  telegram: {
    agent: new https.Agent({ timeout: 10000 }), // 10s timeout
  },
});

bot.on("text", (ctx) => {
  ctx.reply(`You said: ${ctx.message.text}`);
});

bot.launch();

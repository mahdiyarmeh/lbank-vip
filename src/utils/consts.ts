import dotenv from "dotenv";

dotenv.config();

function getEnvVar(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Environment variable "${key}" is not defined.`);
  }
  return value;
}

export const consts = {
  botToken: getEnvVar("BOT_TOKEN"),
  groupId: getEnvVar("GROUP_ID"),
  apiKey: getEnvVar("API_KEY"),
  apiSecret: getEnvVar("API_SECRET"),

  baseUrl: "https://affiliate.lbankverify.com",
  endpoints: {
    teamList: "/affiliate-api/v2/invite/user/team/list",
    userInfo: "/affiliate-api/v2/invite/user/info",
  },
};

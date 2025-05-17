import { messages } from "./messages";

// export type Ti18n = (lang: string, key: string, ...args: any[]) => string;
export function i18n(lang: string, key: string, ...args: any[]): string {
  // const locale = lang === "fa" ? "fa" : "en";
  const locale = "en";
  let message = messages[locale][key as keyof typeof messages.en] || key;

  args.forEach((arg, i) => {
    message = message.replace(`{${i}}`, arg);
  });

  return message;
}

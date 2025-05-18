export const messages_en = {
  greeting: "👋 Welcome! This bot manages access to our private group.",
  askUid: "Please enter your UID to proceed:",
  notAllowed: "⚠️ Sorry, you don’t have permission to join this group.",
  belowThreshold: "⚠️ Your balance is below the required threshold to join.",
  inviteSent: "✅ You’re eligible! Here is your invite link:",
  alreadyJoined: "You’ve already joined the group.",
  uidNotFound: "We couldn’t find that UID in our system. Please double-check and try again.",
  uidSaved: "Your UID has been saved successfully.",
  adminOnly: "⚠️ This command is restricted to admins.",
  thresholdSet: "✅ Threshold updated to {0}.",
  currentThreshold: "The current threshold is {0}.",
  adminAdded: "✅ User {0} has been granted admin rights.",
  invalidThreshold: "Invalid threshold value. Please enter a valid number.",
  invalidUid: "Invalid UID format. Please try again.",
  kickedDueToBalance:
    "You have been removed from the group because your balance fell below the threshold.",
  error: "Oops! Something went wrong. Please try again later.",
  cannotChangeUid: "⚠️ Once set, you cannot change your UID.",
  uidAlreadyUsed: "⚠️ This UID is already linked to another Telegram account.",
  uidDoesntExist: "⚠️ This UID does not exist in our records.",
  help: `
🆘 Available Commands:

/start - Start interaction with the bot
/setthreshold - Set minimum balance (/setthreshold <amount>)
/threshold - Show the current balance threshold
/addadmin - Add a new admin (/addadmin <Telegram user ID>)
/forcekick - Remove users below threshold
`,
};

export const messages_fa: Record<keyof typeof messages_en, string> = {
  greeting: "👋 خوش آمدید! این ربات دسترسی به گروه خصوصی ما را مدیریت می‌کند.",
  askUid: "لطفاً برای ادامه، شناسه کاربری (UID) خود را وارد کنید:",
  notAllowed: "⚠️ متأسفانه شما اجازه پیوستن به این گروه را ندارید.",
  belowThreshold: "⚠️ موجودی شما کمتر از حداقل مورد نیاز برای پیوستن است.",
  inviteSent: "✅ شما واجد شرایط هستید! این لینک دعوت شماست:",
  alreadyJoined: "شما قبلاً به گروه پیوسته‌اید.",
  uidNotFound: "شناسه کاربری وارد شده در سیستم ما یافت نشد. لطفاً دوباره بررسی کنید.",
  uidSaved: "شناسه کاربری شما با موفقیت ثبت شد.",
  adminOnly: "⚠️ این دستور فقط برای مدیران قابل استفاده است.",
  thresholdSet: "✅ حداقل موجودی به {0} تغییر یافت.",
  currentThreshold: "حداقل موجودی فعلی {0} است.",
  adminAdded: "✅ کاربر {0} به عنوان مدیر اضافه شد.",
  invalidThreshold: "مقدار وارد شده نامعتبر است. لطفاً عدد صحیح وارد کنید.",
  invalidUid: "فرمت شناسه کاربری اشتباه است. لطفاً دوباره تلاش کنید.",
  kickedDueToBalance: "به دلیل کم بودن موجودی، از گروه حذف شده‌اید.",
  error: "خطایی رخ داد. لطفاً بعداً دوباره تلاش کنید.",
  cannotChangeUid: "⚠️ پس از ثبت، نمی‌توانید شناسه کاربری خود را تغییر دهید.",
  uidAlreadyUsed: "⚠️ این شناسه کاربری قبلاً به حساب تلگرام دیگری اختصاص یافته است.",
  uidDoesntExist: "⚠️ این شناسه کاربری در سیستم وجود ندارد.",
  help: `
🆘 دستورات قابل استفاده:

/start - شروع کار با ربات
/setthreshold - تنظیم حداقل موجودی (/setthreshold <مقدار>)
/threshold - نمایش حداقل موجودی فعلی
/addadmin - افزودن مدیر جدید (/addadmin <شناسه تلگرام>)
/forcekick - حذف کاربران با موجودی کمتر از حداقل
`,
};

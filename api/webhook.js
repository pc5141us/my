const { Telegraf } = require('telegraf');

// --- بياناتك المحفوظة ---
const BOT_TOKEN = '8402726492:AAGLLp8_8wjBBUSA175XB2pM83xty2DmgCU';
const OWNER_ID = '682572594';
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzps7gLgC8OKl9xnJnMH0qW71FvXy_lISV73_lIVl0jhf4FAxe1odlSJRP0TXsZp07H/exec';

const bot = new Telegraf(BOT_TOKEN);

// قائمة المحظورين (في الذاكرة مؤقتاً - يفضل ربطها بجدول بيانات للحفظ الدائم)
let bannedUsers = new Set();

// الأزرار للمالك
const adminKeyboard = {
  reply_markup: {
    keyboard: [
      [{ text: '👤 تعديل الاسم' }, { text: '📝 تعديل الوصف' }],
      [{ text: '🌐 روابط السوشيال ميديا' }]
    ],
    resize_keyboard: true
  }
};

const linksKeyboard = {
  reply_markup: {
    keyboard: [
      [{ text: '🔵 فيسبوك' }, { text: '🟢 واتساب' }],
      [{ text: '🟣 إنستجرام' }, { text: '🔵 تليجرام' }],
      [{ text: '⬅️ الرجوع للقائمة الرئيسية' }]
    ],
    resize_keyboard: true
  }
};

// حماية وفلترة
bot.use(async (ctx, next) => {
  if (ctx.from && bannedUsers.has(ctx.from.id.toString())) {
    return ctx.reply('🚫 عذراً، لقد تم حظرك من استخدام هذا البوت.');
  }
  return next();
});

// رسالة البداية
bot.start(async (ctx) => {
  const userId = ctx.from.id.toString();
  
  if (userId === OWNER_ID) {
    return ctx.reply('أهلاً بك يا حمدي! أنت المالك، يمكنك التحكم في الموقع من هنا:', adminKeyboard);
  } else {
    // إشعار للمالك بدخول شخص جديد
    await bot.telegram.sendMessage(OWNER_ID, `🔔 مستخدم جديد دخل البوت:\nالاسم: ${ctx.from.first_name}\nالمعرف: ${userId}\nاليوزر: @${ctx.from.username || 'لا يوجد'}`);
    
    return ctx.reply(`أهلاً بك يا ${ctx.from.first_name}! يمكنك إرسال رسالتك هنا وسأقوم بالرد عليك في أقرب وقت.`);
  }
});

// أوامر الإدارة (للمالك فقط)
bot.command('ban', (ctx) => {
  if (ctx.from.id.toString() !== OWNER_ID) return;
  const targetId = ctx.message.text.split(' ')[1];
  if (!targetId) return ctx.reply('❌ يرجى إدخال معرف المستخدم. مثال: /ban 123456');
  bannedUsers.add(targetId);
  ctx.reply(`✅ تم حظر المستخدم ${targetId} بنجاح.`);
});

bot.command('unban', (ctx) => {
  if (ctx.from.id.toString() !== OWNER_ID) return;
  const targetId = ctx.message.text.split(' ')[1];
  if (!targetId) return ctx.reply('❌ يرجى إدخال معرف المستخدم. مثال: /unban 123456');
  bannedUsers.delete(targetId);
  ctx.reply(`✅ تم إلغاء حظر المستخدم ${targetId} بنجاح.`);
});

// التعامل مع الرسائل
bot.hears('⬅️ الرجوع للقائمة الرئيسية', (ctx) => {
  if (ctx.from.id.toString() !== OWNER_ID) return;
  return ctx.reply('الرئيسية', adminKeyboard);
});

bot.hears('🌐 روابط السوشيال ميديا', (ctx) => {
  if (ctx.from.id.toString() !== OWNER_ID) return;
  return ctx.reply('اختر الرابط:', linksKeyboard);
});

// نصوص الرسائل الإدارية
const PROMPT_NAME = 'أرسل الاسم الجديد الآن:';
const PROMPT_BIO = 'أرسل الوصف الجديد الآن:';
const PROMPT_FB = 'أرسل رابط فيسبوك الجديد:';
const PROMPT_WA = 'أرسل رابط واتساب الجديد:';
const PROMPT_IG = 'أرسل رابط إنستجرام الجديد:';
const PROMPT_TG = 'أرسل رابط تليجرام الجديد:';

bot.hears('👤 تعديل الاسم', (ctx) => {
  if (ctx.from.id.toString() !== OWNER_ID) return;
  ctx.reply(PROMPT_NAME, { reply_markup: { force_reply: true } });
});
bot.hears('📝 تعديل الوصف', (ctx) => {
  if (ctx.from.id.toString() !== OWNER_ID) return;
  ctx.reply(PROMPT_BIO, { reply_markup: { force_reply: true } });
});
bot.hears('🔵 فيسبوك', (ctx) => {
  if (ctx.from.id.toString() !== OWNER_ID) return;
  ctx.reply(PROMPT_FB, { reply_markup: { force_reply: true } });
});
bot.hears('🟢 واتساب', (ctx) => {
  if (ctx.from.id.toString() !== OWNER_ID) return;
  ctx.reply(PROMPT_WA, { reply_markup: { force_reply: true } });
});
bot.hears('🟣 إنستجرام', (ctx) => {
  if (ctx.from.id.toString() !== OWNER_ID) return;
  ctx.reply(PROMPT_IG, { reply_markup: { force_reply: true } });
});
bot.hears('🔵 تليجرام', (ctx) => {
  if (ctx.from.id.toString() !== OWNER_ID) return;
  ctx.reply(PROMPT_TG, { reply_markup: { force_reply: true } });
});

bot.on('message', async (ctx) => {
  const userId = ctx.from.id.toString();
  const messageText = ctx.message.text;

  // أولاً: إذا كان المالك هو من يرسل
  if (userId === OWNER_ID) {
    // إذا كان المالك يرد على رسالة محولة
    if (ctx.message.reply_to_message) {
      const replyToText = ctx.message.reply_to_message.text || '';
      
      // تحقق من تعديل الموقع أولاً (المنطق القديم)
      let range = '';
      if (replyToText === PROMPT_NAME) range = 'B2';
      else if (replyToText === PROMPT_BIO) range = 'B3';
      else if (replyToText === PROMPT_FB) range = 'B4';
      else if (replyToText === PROMPT_WA) range = 'B5';
      else if (replyToText === PROMPT_IG) range = 'B6';
      else if (replyToText === PROMPT_TG) range = 'B7';

      if (range) {
        try {
          const updateUrl = `${SCRIPT_URL}?range=${encodeURIComponent(range)}&value=${encodeURIComponent(messageText)}`;
          const response = await fetch(updateUrl);
          const resultText = await response.text();
          if (resultText.includes("Success")) return ctx.reply('✅ تم تحديث الموقع بنجاح!', adminKeyboard);
          else return ctx.reply('❌ خطأ في التحديث: ' + resultText);
        } catch (e) { return ctx.reply('❌ خطأ اتصال: ' + e.message); }
      }

      // ثانياً: إذا كان المالك يرد على رسالة مستخدم (للتواصل)
      // نبحث عن معرف المستخدم في الرسالة التي يتم الرد عليها
      const match = replyToText.match(/\(ID: (\d+)\)/);
      if (match) {
        const targetUserId = match[1];
        try {
          await bot.telegram.sendMessage(targetUserId, `💬 رد من حمدي:\n\n${messageText}`);
          return ctx.reply('✅ تم إرسال ردك للمستخدم.');
        } catch (error) {
          return ctx.reply('❌ فشل إرسال الرد، ربما قام المستخدم بحظر البوت.');
        }
      }
    }
  } 
  // ثانياً: إذا كان المستخدم العادي هو من يرسل
  else {
    // توجيه الرسالة للمالك
    const forwardText = `📨 رسالة من: ${ctx.from.first_name} (ID: ${userId})\n\n${messageText || '[وسائط غير نصية]'}\n\n-- للرد على المستخدم، قم بالرد على هذه الرسالة مباشرة.`;
    await bot.telegram.sendMessage(OWNER_ID, forwardText);
    return ctx.reply('🚀 تم إرسال رسالتك، سأرد عليك قريباً.');
  }
});

module.exports = async (req, res) => {
  try {
    if (req.body) await bot.handleUpdate(req.body);
    res.status(200).send('OK');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error');
  }
};

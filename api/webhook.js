const { Telegraf } = require('telegraf');

// --- بياناتك المحفوظة ---
const BOT_TOKEN = '8402726492:AAGLLp8_8wjBBUSA175XB2pM83xty2DmgCU';
const OWNER_ID = '682572594';
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyZ6Cdjn2WPM82EOrEZGUPrLXtE9Mt6UrfxrZPQngCiRB-4I6ewgsW7cRBxOONeugcv/exec';

const bot = new Telegraf(BOT_TOKEN);

// قائمة المحظورين (في الذاكرة مؤقتاً - يفضل ربطها بجدول بيانات للحفظ الدائم)
let bannedUsers = new Set();

// الأزرار للمالك
const adminKeyboard = {
  reply_markup: {
    keyboard: [
      [{ text: '👤 تعديل الاسم' }, { text: '📝 تعديل الوصف' }],
      [{ text: '🌐 روابط السوشيال ميديا' }],
      [{ text: '📢 إدارة المستخدمين' }]
    ],
    resize_keyboard: true
  }
};

const usersManagementKeyboard = {
  reply_markup: {
    keyboard: [
      [{ text: '👥 قائمة المستخدمين' }, { text: '📢 إرسال جماعي' }],
      [{ text: '🚫 حظر مستخدم' }, { text: '✅ فك الحظر' }],
      [{ text: '⬅️ الرجوع للقائمة الرئيسية' }]
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
  const firstName = ctx.from.first_name;
  const username = ctx.from.username || 'لا يوجد';
  
  let isNew = false;
  // حفظ المستخدم والتحقق إذا كان جديداً
  try {
    const saveUrl = `${SCRIPT_URL}?action=registerUser&id=${userId}&name=${encodeURIComponent(firstName)}&username=${encodeURIComponent(username)}`;
    const response = await fetch(saveUrl);
    const result = await response.text();
    if (result === "New") isNew = true;
  } catch (e) { console.log("Save user error:", e.message); }

  if (userId === OWNER_ID) {
    return ctx.reply('أهلاً بك يا حمدي! أنت المالك، يمكنك التحكم في الموقع والمستخدمين من هنا:', adminKeyboard);
  } else {
    // إرسال إشعار للمالك فقط إذا كان المستخدم جديداً لأول مرة
    if (isNew) {
      await bot.telegram.sendMessage(OWNER_ID, `🔔 مستخدم جديد دخل البوت لأول مرة:\nالاسم: ${firstName}\nالمعرف: \`${userId}\` (اضغط للنسخ)\nاليوزر: @${username}`);
    }
    
    return ctx.reply(`أهلاً بك يا ${firstName}! يمكنك إرسال رسالتك هنا وسأقوم بالرد عليك في أقرب وقت.`);
  }
});

// إدارة المستخدمين
bot.hears('📢 إدارة المستخدمين', (ctx) => {
  if (ctx.from.id.toString() !== OWNER_ID) return;
  ctx.reply('إدارة المستخدمين والتواصل:', usersManagementKeyboard);
});

bot.hears('👥 قائمة المستخدمين', async (ctx) => {
  if (ctx.from.id.toString() !== OWNER_ID) return;
  try {
    const statusMsg = await ctx.reply('⏳ جاري جلب القائمة من جوجل شيت...');
    const response = await fetch(`${SCRIPT_URL}?action=getUsers`);
    const users = await response.json();
    
    if (!users || users.length === 0) return ctx.reply('📭 لا يوجد مستخدمين مسجلين بعد.');
    
    // إنشاء أزرار بأسماء المستخدمين
    const buttons = users.map(u => ([{
      text: `👤 ${u.name} (@${u.username})`,
      callback_data: `manage_${u.id}`
    }]));

    await bot.telegram.deleteMessage(ctx.chat.id, statusMsg.message_id);
    ctx.reply('👥 اختر مستخدماً للتحكم به:', {
      reply_markup: { inline_keyboard: buttons }
    });
  } catch (e) {
    ctx.reply('❌ فشل جلب القائمة.');
  }
});

// التعامل مع الضغط على اسم المستخدم
bot.action(/manage_(.+)/, async (ctx) => {
  const targetId = ctx.match[1];
  const isBanned = bannedUsers.has(targetId);
  
  const keyboard = [
    [{ text: '💬 إرسال رسالة خاصة', callback_data: `msg_${targetId}` }],
    [{ 
      text: isBanned ? '✅ فك الحظر' : '🚫 حظر المستخدم', 
      callback_data: isBanned ? `unban_${targetId}` : `ban_${targetId}` 
    }],
    [{ text: '⬅️ العودة للقائمة', callback_data: 'back_to_list' }]
  ];

  await ctx.editMessageText(`🛠️ إدارة المستخدم (ID: ${targetId}):\nالحالة الحالية: ${isBanned ? '🔴 محظور' : '🟢 نشط'}`, {
    reply_markup: { inline_keyboard: keyboard }
  });
});

// تنفيذ الحظر من الأزرار
bot.action(/ban_(.+)/, async (ctx) => {
  const targetId = ctx.match[1];
  bannedUsers.add(targetId);
  await ctx.answerCbQuery('✅ تم الحظر');
  return ctx.editMessageText(`🚫 تم حظر المستخدم ${targetId} بنجاح.`, {
    reply_markup: { inline_keyboard: [[{ text: '⬅️ عودة', callback_data: `manage_${targetId}` }]] }
  });
});

// تنفيذ فك الحظر من الأزرار
bot.action(/unban_(.+)/, async (ctx) => {
  const targetId = ctx.match[1];
  bannedUsers.delete(targetId);
  await ctx.answerCbQuery('✅ تم فك الحظر');
  return ctx.editMessageText(`🟢 تم فك الحظر عن المستخدم ${targetId}.`, {
    reply_markup: { inline_keyboard: [[{ text: '⬅️ عودة', callback_data: `manage_${targetId}` }]] }
  });
});

// طلب إرسال رسالة خاصة
bot.action(/msg_(.+)/, async (ctx) => {
  const targetId = ctx.match[1];
  await ctx.answerCbQuery();
  ctx.reply(`📝 اكتب رسالتك الآن لإرسالها للمستخدم (ID: ${targetId}):\n\n*(سيتم إرسال كل ما تكتبه في الرسالة القادمة)*`, {
    reply_markup: { force_reply: true }
  });
});

// العودة للقائمة
bot.action('back_to_list', async (ctx) => {
  await ctx.answerCbQuery();
  return ctx.reply('👥 قائمة المستخدمين:', { reply_markup: { keyboard: usersManagementKeyboard.reply_markup.keyboard, resize_keyboard: true } });
});

// نصوص الرسائل الإدارية
const PROMPT_NAME = 'أرسل الاسم الجديد الآن:';
const PROMPT_BIO = 'أرسل الوصف الجديد الآن:';
const PROMPT_FB = 'أرسل رابط فيسبوك الجديد:';
const PROMPT_WA = 'أرسل رابط واتساب الجديد:';
const PROMPT_IG = 'أرسل رابط إنستجرام الجديد:';
const PROMPT_TG = 'أرسل رابط تليجرام الجديد:';
const PROMPT_BAN = 'أرسل الـ ID الخاص بالمستخدم لحظره:';
const PROMPT_UNBAN = 'أرسل الـ ID الخاص بالمستخدم لفك الحظر عنه:';
const PROMPT_BROADCAST = 'أرسل الرسالة التي تريد إرسالها لجميع المستخدمين:';

bot.hears('📢 إرسال جماعي', (ctx) => {
  if (ctx.from.id.toString() !== OWNER_ID) return;
  ctx.reply(PROMPT_BROADCAST, { reply_markup: { force_reply: true } });
});

bot.hears('🚫 حظر مستخدم', (ctx) => {
  if (ctx.from.id.toString() !== OWNER_ID) return;
  ctx.reply(PROMPT_BAN, { reply_markup: { force_reply: true } });
});

bot.hears('✅ فك الحظر', (ctx) => {
  if (ctx.from.id.toString() !== OWNER_ID) return;
  ctx.reply(PROMPT_UNBAN, { reply_markup: { force_reply: true } });
});

bot.hears('⬅️ الرجوع للقائمة الرئيسية', (ctx) => {
  if (ctx.from.id.toString() !== OWNER_ID) return;
  return ctx.reply('القائمة الرئيسية', adminKeyboard);
});

bot.hears('🌐 روابط السوشيال ميديا', (ctx) => {
  if (ctx.from.id.toString() !== OWNER_ID) return;
  return ctx.reply('اختر الرابط لتعديله:', linksKeyboard);
});

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
    if (ctx.message.reply_to_message) {
      const replyToText = ctx.message.reply_to_message.text || '';
      
      // التعامل مع الرسائل الخاصة لفرد معين (من القائمة)
      const individualMsgMatch = replyToText.match(/ID: (\d+)\)/);
      if (individualMsgMatch && replyToText.includes('اكتب رسالتك الآن')) {
        const targetId = individualMsgMatch[1];
        try {
          await bot.telegram.sendMessage(targetId, `💬 رسالة خاصة من حمدي:\n\n${messageText}`);
          return ctx.reply('✅ تم إرسال رسالتك الخاصة بنجاح.');
        } catch (e) { return ctx.reply('❌ فشل الإرسال للمستخدم.'); }
      }

      // التعامل مع الإرسال الجماعي
      if (replyToText === PROMPT_BROADCAST) {
        try {
          ctx.reply('⏳ جاري البدء في الإرسال للجميع...');
          const response = await fetch(`${SCRIPT_URL}?action=getUsers`);
          const users = await response.json();
          let count = 0;
          
          for (const user of users) {
            try {
              await bot.telegram.sendMessage(user.id, `📢 رسالة من الإدارة:\n\n${messageText}`);
              count++;
            } catch (err) {} 
          }
          return ctx.reply(`✅ تم إرسال الرسالة بنجاح إلى ${count} مستخدم.`);
        } catch (e) { return ctx.reply('❌ فشل الإرسال الجماعي.'); }
      }

      // التعامل مع الحظر وفك الحظر النصي
      if (replyToText === PROMPT_BAN) {
        bannedUsers.add(messageText.trim());
        return ctx.reply(`✅ تم حظر المستخدم ${messageText} بنجاح.`, usersManagementKeyboard);
      }
      if (replyToText === PROMPT_UNBAN) {
        bannedUsers.delete(messageText.trim());
        return ctx.reply(`✅ تم إلغاء حظر المستخدم ${messageText} بنجاح.`, usersManagementKeyboard);
      }

      // منطق تعديل بيانات الموقع (Google Sheets)
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

      // الرد على رسائل المستخدمين (التواصل التلقائي)
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

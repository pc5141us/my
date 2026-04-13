const { Telegraf } = require('telegraf');

// --- بياناتك المحفوظة ---
const BOT_TOKEN = '8402726492:AAGLLp8_8wjBBUSA175XB2pM83xty2DmgCU';
const OWNER_ID = '682572594';
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyZ6Cdjn2WPM82EOrEZGUPrLXtE9Mt6UrfxrZPQngCiRB-4I6ewgsW7cRBxOONeugcv/exec';

const bot = new Telegraf(BOT_TOKEN);

// قائمة المحظورين (مؤقتة في الذاكرة)
let bannedUsers = new Set();

// --- لوحات المفاتيح (Reply Keyboard) ---

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

function getUserControlKeyboard(id) {
  return {
    reply_markup: {
      keyboard: [
        [{ text: `💬 مراسلة (${id})` }],
        [{ text: `🚫 حظر (${id})` }, { text: `✅ فك الحظر (${id})` }],
        [{ text: '👥 قائمة المستخدمين' }, { text: '⬅️ الرجوع للقائمة الرئيسية' }]
      ],
      resize_keyboard: true
    }
  };
}

// --- الحماية ---
bot.use(async (ctx, next) => {
  if (ctx.from && bannedUsers.has(ctx.from.id.toString())) {
    return ctx.reply('🚫 عذراً، لقد تم حظرك من استخدام هذا البوت.');
  }
  return next();
});

// --- الأوامر الأساسية ---

bot.start(async (ctx) => {
  const userId = ctx.from.id.toString();
  const firstName = ctx.from.first_name;
  const username = ctx.from.username || 'لا يوجد';
  
  let isNew = false;
  try {
    const saveUrl = `${SCRIPT_URL}?action=registerUser&id=${userId}&name=${encodeURIComponent(firstName)}&username=${encodeURIComponent(username)}`;
    const response = await fetch(saveUrl);
    const result = await response.text();
    if (result === "New") isNew = true;
  } catch (e) {}

  if (userId === OWNER_ID) {
    return ctx.reply('أهلاً بك يا حمدي! يمكنك التحكم في كل شيء من هنا:', adminKeyboard);
  } else {
    if (isNew) {
      await bot.telegram.sendMessage(OWNER_ID, `🔔 مستخدم جديد دخل البوت:\nالاسم: ${firstName}\nID: \`${userId}\``);
    }
    return ctx.reply(`أهلاً بك يا ${firstName}! يمكنك مراسلتي هنا وسأقوم بالرد عليك قريباً.`);
  }
});

// --- إدارة المستخدمين ---

bot.hears('📢 إدارة المستخدمين', (ctx) => {
  if (ctx.from.id.toString() !== OWNER_ID) return;
  ctx.reply('إدارة المستخدمين والتواصل:', usersManagementKeyboard);
});

bot.hears('👥 قائمة المستخدمين', async (ctx) => {
  if (ctx.from.id.toString() !== OWNER_ID) return;
  try {
    ctx.reply('⏳ جاري جلب القائمة...');
    const response = await fetch(`${SCRIPT_URL}?action=getUsers`);
    let users = await response.json();
    
    users = users.filter(u => u.id.toString() !== OWNER_ID);
    if (!users || users.length === 0) return ctx.reply('📭 لا يوجد مستخدمين مسجلين.');

    const keyboard = [];
    for (let i = 0; i < users.length; i += 3) {
      const row = users.slice(i, i + 3).map(u => ({ text: `👤 ${u.name} (${u.id})` }));
      keyboard.push(row);
    }
    keyboard.push([{ text: '⬅️ الرجوع للقائمة الرئيسية' }]);

    ctx.reply('اختر مستخدماً للتحكم به:', {
      reply_markup: { keyboard: keyboard, resize_keyboard: true }
    });
  } catch (e) { ctx.reply('❌ فشل جلب القائمة.'); }
});

// رصد اختيار مستخدم (Regex)
bot.hears(/^👤 (.+) \((\d+)\)$/, (ctx) => {
  if (ctx.from.id.toString() !== OWNER_ID) return;
  const name = ctx.match[1];
  const id = ctx.match[2];
  const isBanned = bannedUsers.has(id);
  ctx.reply(`🛠️ إدارة المستخدم: ${name}\nID: ${id}\nالحالة: ${isBanned ? '🔴 محظور' : '🟢 نشط'}`, getUserControlKeyboard(id));
});

bot.hears(/^🚫 حظر \((\d+)\)$/, (ctx) => {
  if (ctx.from.id.toString() !== OWNER_ID) return;
  const id = ctx.match[1];
  bannedUsers.add(id);
  ctx.reply(`✅ تم حظر المستخدم (ID: ${id})`, getUserControlKeyboard(id));
});

bot.hears(/^✅ فك الحظر \((\d+)\)$/, (ctx) => {
  if (ctx.from.id.toString() !== OWNER_ID) return;
  const id = ctx.match[1];
  bannedUsers.delete(id);
  ctx.reply(`✅ تم فك الحظر عن (ID: ${id})`, getUserControlKeyboard(id));
});

bot.hears(/^💬 مراسلة \((\d+)\)$/, (ctx) => {
  if (ctx.from.id.toString() !== OWNER_ID) return;
  const id = ctx.match[1];
  ctx.reply(`📝 اكتب رسالتك للمستخدم (ID: ${id}):`, { reply_markup: { force_reply: true } });
});

// --- تعديل بيانات الموقع (أوامر الأزرار) ---

const PROMPT_NAME = 'أرسل الاسم الجديد الآن:';
const PROMPT_BIO = 'أرسل الوصف الجديد الآن:';
const PROMPT_FB = 'أرسل رابط فيسبوك الجديد:';
const PROMPT_WA = 'أرسل رابط واتساب الجديد:';
const PROMPT_IG = 'أرسل رابط إنستجرام الجديد:';
const PROMPT_TG = 'أرسل رابط تليجرام الجديد:';
const PROMPT_BROADCAST = 'أرسل رسالة البرودكاست للكل:';

bot.hears('👤 تعديل الاسم', (ctx) => ctx.reply(PROMPT_NAME, { reply_markup: { force_reply: true } }));
bot.hears('📝 تعديل الوصف', (ctx) => ctx.reply(PROMPT_BIO, { reply_markup: { force_reply: true } }));
bot.hears('🌐 روابط السوشيال ميديا', (ctx) => ctx.reply('اختر الرابط لتعديله:', linksKeyboard));
bot.hears('🔵 فيسبوك', (ctx) => ctx.reply(PROMPT_FB, { reply_markup: { force_reply: true } }));
bot.hears('🟢 واتساب', (ctx) => ctx.reply(PROMPT_WA, { reply_markup: { force_reply: true } }));
bot.hears('🟣 إنستجرام', (ctx) => ctx.reply(PROMPT_IG, { reply_markup: { force_reply: true } }));
bot.hears('🔵 تليجرام', (ctx) => ctx.reply(PROMPT_TG, { reply_markup: { force_reply: true } }));
bot.hears('📢 إرسال جماعي', (ctx) => ctx.reply(PROMPT_BROADCAST, { reply_markup: { force_reply: true } }));
bot.hears('⬅️ الرجوع للقائمة الرئيسية', (ctx) => ctx.reply('الرئيسية', adminKeyboard));

// --- معالجة الرسائل الواردة ---

bot.on('message', async (ctx) => {
  const userId = ctx.from.id.toString();
  const messageText = ctx.message.text;

  if (userId === OWNER_ID) {
    if (ctx.message.reply_to_message) {
      const replyToText = ctx.message.reply_to_message.text || '';
      
      // 1. مراسلة خاصة لفرد
      const idMatch = replyToText.match(/\(ID: (\d+)\)$|\(ID: (\d+)\):/);
      if (idMatch && (replyToText.includes('اكتب رسالتك') || replyToText.includes('رسالة من:'))) {
        const targetId = idMatch[1] || idMatch[2];
        try {
          await bot.telegram.sendMessage(targetId, `💬 رسالة من حمدي:\n\n${messageText}`);
          return ctx.reply(`✅ تم الإرسال للمستخدم (${targetId})`);
        } catch (e) { return ctx.reply('❌ فشل الإرسال.'); }
      }

      // 2. برودكاست للكل
      if (replyToText === PROMPT_BROADCAST) {
        try {
          const response = await fetch(`${SCRIPT_URL}?action=getUsers`);
          const users = await response.json();
          let count = 0;
          for (const u of users) {
             try { await bot.telegram.sendMessage(u.id, `📢 إعلان:\n\n${messageText}`); count++; } catch(err){}
          }
          return ctx.reply(`✅ تم الإرسال لـ ${count} مستخدم.`);
        } catch(e) { return ctx.reply('❌ فشل البرودكاست.'); }
      }

      // 3. تحديث الموقع
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
          const res = await (await fetch(updateUrl)).text();
          return ctx.reply(res.includes("Success") ? '✅ تم تحديث الموقع!' : '❌ فشل التحديث', adminKeyboard);
        } catch(e) { return ctx.reply('❌ خطأ اتصال بالجدول.'); }
      }
    }
  } else {
    // إرسال رسائل المستخدمين للمالك
    const forwardText = `📨 رسالة من: ${ctx.from.first_name} (ID: ${userId})\n\n${messageText}`;
    await bot.telegram.sendMessage(OWNER_ID, forwardText);
    return ctx.reply('🚀 تم إرسال رسالتك، سأرد عليك في القريب العاجل.');
  }
});

module.exports = async (req, res) => {
  try {
    if (req.body) await bot.handleUpdate(req.body);
    res.status(200).send('OK');
  } catch (err) { res.status(500).send('Error'); }
};

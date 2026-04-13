const { Telegraf } = require('telegraf');

// --- بياناتك المحفوظة ---
const BOT_TOKEN = '8402726492:AAGLLp8_8wjBBUSA175XB2pM83xty2DmgCU';
const OWNER_ID = '682572594';
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzps7gLgC8OKl9xnJnMH0qW71FvXy_lISV73_lIVl0jhf4FAxe1odlSJRP0TXsZp07H/exec';

const bot = new Telegraf(BOT_TOKEN);

// حماية البوت
bot.use(async (ctx, next) => {
  if (OWNER_ID && ctx.from.id.toString() !== OWNER_ID) {
    return ctx.reply('عذراً، هذا البوت مخصص للمالك فقط.');
  }
  return next();
});

// الأزرار
const mainKeyboard = {
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

bot.start((ctx) => {
  return ctx.reply('أهلاً بك يا حمدي! اختر ماذا تريد أن تعدل:', mainKeyboard);
});

bot.hears('⬅️ الرجوع للقائمة الرئيسية', (ctx) => {
  return ctx.reply('الرئيسية', mainKeyboard);
});

bot.hears('🌐 روابط السوشيال ميديا', (ctx) => {
  return ctx.reply('اختر الرابط:', linksKeyboard);
});

// نصوص الرسائل
const PROMPT_NAME = 'أرسل الاسم الجديد الآن:';
const PROMPT_BIO = 'أرسل الوصف الجديد الآن:';
const PROMPT_FB = 'أرسل رابط فيسبوك الجديد:';
const PROMPT_WA = 'أرسل رابط واتساب الجديد:';
const PROMPT_IG = 'أرسل رابط إنستجرام الجديد:';
const PROMPT_TG = 'أرسل رابط تليجرام الجديد:';

bot.hears('👤 تعديل الاسم', (ctx) => ctx.reply(PROMPT_NAME, { reply_markup: { force_reply: true } }));
bot.hears('📝 تعديل الوصف', (ctx) => ctx.reply(PROMPT_BIO, { reply_markup: { force_reply: true } }));
bot.hears('🔵 فيسبوك', (ctx) => ctx.reply(PROMPT_FB, { reply_markup: { force_reply: true } }));
bot.hears('🟢 واتساب', (ctx) => ctx.reply(PROMPT_WA, { reply_markup: { force_reply: true } }));
bot.hears('🟣 إنستجرام', (ctx) => ctx.reply(PROMPT_IG, { reply_markup: { force_reply: true } }));
bot.hears('🔵 تليجرام', (ctx) => ctx.reply(PROMPT_TG, { reply_markup: { force_reply: true } }));

bot.on('message', async (ctx) => {
  if (ctx.message.reply_to_message) {
    const replyText = ctx.message.reply_to_message.text;
    let range = '';
    
    // تم ترحيل الصفوف بمقدار صف واحد (تبدأ من الصف الثاني) لترك مساحة للعناوين
    if (replyText === PROMPT_NAME) range = 'B2';
    else if (replyText === PROMPT_BIO) range = 'B3';
    else if (replyText === PROMPT_FB) range = 'B4';
    else if (replyText === PROMPT_WA) range = 'B5';
    else if (replyText === PROMPT_IG) range = 'B6';
    else if (replyText === PROMPT_TG) range = 'B7';

    if (range) {
      try {
        const updateUrl = `${SCRIPT_URL}?range=${encodeURIComponent(range)}&value=${encodeURIComponent(ctx.message.text)}`;
        const response = await fetch(updateUrl);
        const resultText = await response.text();
        
        if (resultText.includes("Success")) {
          return ctx.reply('✅ تم التحديث بنجاح!', mainKeyboard);
        } else {
          return ctx.reply('❌ خطأ من جوجل: ' + resultText, mainKeyboard);
        }
      } catch (error) {
        return ctx.reply('❌ خطأ في الاتصال: ' + error.message);
      }
    }
  }
});

module.exports = async (req, res) => {
  try {
    if (req.body) await bot.handleUpdate(req.body);
    res.status(200).send('OK');
  } catch (err) {
    res.status(500).send('Error');
  }
};

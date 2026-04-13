const { Telegraf } = require('telegraf');

// --- بياناتك المحفوظة ---
const BOT_TOKEN = '8402726492:AAGLLp8_8wjBBUSA175XB2pM83xty2DmgCU';
const OWNER_ID = '682572594';
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwgDHeVxzTb0HENlF6618ejN75QKl5_ERoEptbh4HYJzC3UBWGqubjIyJVPp_4prTuw/exec';

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

bot.hears('👤 تعديل الاسم', (ctx) => ctx.reply('أرسل الاسم الجديد الآن:', { reply_markup: { force_reply: true } }));
bot.hears('📝 تعديل الوصف', (ctx) => ctx.reply('أرسل الوصف الجديد الآن:', { reply_markup: { force_reply: true } }));
bot.hears('🔵 فيسبوك', (ctx) => ctx.reply('أرسل رابط فيسبوك الجديد:', { reply_markup: { force_reply: true } }));
bot.hears('🟢 واتساب', (ctx) => ctx.reply('أرسل رابط واتساب الجديد:', { reply_markup: { force_reply: true } }));
bot.hears('🟣 إنستجرام', (ctx) => ctx.reply('أرسل رابط إنستجرام الجديد:', { reply_markup: { force_reply: true } }));
bot.hears('🔵 تليجرام', (ctx) => ctx.reply('أرسل رابط تليجرام الجديد:', { reply_markup: { force_reply: true } }));

bot.on('message', async (ctx) => {
  if (ctx.message.reply_to_message) {
    const replyText = ctx.message.reply_to_message.text;
    let range = '';
    
    // استخدام B1, B2 مباشرة لتجنب مشاكل أسماء الصفحات
    if (replyText.includes('الاسم')) range = 'B1';
    else if (replyText.includes('الوصف')) range = 'B2';
    else if (replyText.includes('فيسبوك')) range = 'B3';
    else if (replyText.includes('واتساب')) range = 'B4';
    else if (replyText.includes('إنستجرام')) range = 'B5';
    else if (replyText.includes('تليجرام')) range = 'B6';

    if (range) {
      try {
        const updateUrl = `${SCRIPT_URL}?range=${encodeURIComponent(range)}&value=${encodeURIComponent(ctx.message.text)}`;
        const response = await fetch(updateUrl);
        const resultText = await response.text();
        
        if (resultText.includes("Success")) {
          return ctx.reply('✅ تم التحديث في الشيت بنجاح!', mainKeyboard);
        } else {
          return ctx.reply('❌ رد جوجل: ' + resultText, mainKeyboard);
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

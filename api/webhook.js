const { Telegraf } = require('telegraf');
const { google } = require('googleapis');

// --- بياناتك المحفوظة ---
const BOT_TOKEN = '8402726492:AAGLLp8_8wjBBUSA175XB2pM83xty2DmgCU';
const SPREADSHEET_ID = '10CH91sRewtZGXkdu1EOosSnDfj8N9-Uu2Nf65L5U9lw';
const OWNER_ID = '682572594';

// حط محتوى ملف الـ JSON بتاع جوجل هنا
const GOOGLE_JSON = `
{
  "كنسخ": "محتوى ملف الـ JSON هنا بالكامل"
}
`;
// ----------------------------

const bot = new Telegraf(BOT_TOKEN);

const getSheetsClient = () => {
  const credentials = JSON.parse(GOOGLE_JSON);
  const auth = new google.auth.JWT(
    credentials.client_email,
    null,
    credentials.private_key.replace(/\\n/g, '\n'),
    ['https://www.googleapis.com/auth/spreadsheets']
  );
  return google.sheets({ version: 'v4', auth });
};

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
    if (replyText.includes('الاسم')) range = 'Sheet1!B1';
    else if (replyText.includes('الوصف')) range = 'Sheet1!B2';
    else if (replyText.includes('فيسبوك')) range = 'Sheet1!B3';
    else if (replyText.includes('واتساب')) range = 'Sheet1!B4';
    else if (replyText.includes('إنستجرام')) range = 'Sheet1!B5';
    else if (replyText.includes('تليجرام')) range = 'Sheet1!B6';

    if (range) {
      try {
        const sheets = getSheetsClient();
        await sheets.spreadsheets.values.update({
          spreadsheetId: SPREADSHEET_ID,
          range,
          valueInputOption: 'USER_ENTERED',
          resource: { values: [[ctx.message.text]] },
        });
        return ctx.reply('✅ تم التحديث بنجاح!', mainKeyboard);
      } catch (error) {
        return ctx.reply('❌ خطأ: ' + error.message);
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

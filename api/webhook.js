const { Telegraf } = require('telegraf');
const { google } = require('googleapis');

const spreadsheetId = '10CH91sRewtZGXkdu1EOosSnDfj8N9-Uu2Nf65L5U9lw';
const bot = new Telegraf(process.env.BOT_TOKEN);

// Initialize Google Sheets Auth
const getSheetsClient = () => {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);
  const auth = new google.auth.JWT(
    credentials.client_email,
    null,
    credentials.private_key.replace(/\\n/g, '\n'),
    ['https://www.googleapis.com/auth/spreadsheets']
  );
  return google.sheets({ version: 'v4', auth });
};

const AUTHORIZED_ID = process.env.OWNER_ID;

bot.command('my_id', (ctx) => {
  ctx.reply(`الأيدي بتاعك هو: ${ctx.from.id}`);
});

bot.use(async (ctx, next) => {
  if (AUTHORIZED_ID && ctx.from.id.toString() !== AUTHORIZED_ID) {
    return ctx.reply('عذراً، هذا البوت مخصص للمالك فقط.');
  }
  return next();
});

const updateValue = async (ctx, range, value) => {
  try {
    const sheets = getSheetsClient();
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      resource: { values: [[value]] },
    });
    ctx.reply('✅ تم التحديث في جوجل شيت بنجاح!');
  } catch (error) {
    console.error(error);
    ctx.reply('❌ فشل التحديث: ' + error.message);
  }
};

bot.start((ctx) => {
  ctx.reply('أهلاً بك يا حمدي! \n\n/name - تغيير الاسم\n/bio - تغيير الوصف\n/fb - رابط فيسبوك\n/wa - رابط واتساب\n/ig - رابط إنستجرام\n/tg - رابط تليجرام');
});

bot.on('text', async (ctx) => {
  const text = ctx.message.text;
  if (text.startsWith('/name ')) return updateValue(ctx, 'Sheet1!B1', text.replace('/name ', ''));
  if (text.startsWith('/bio ')) return updateValue(ctx, 'Sheet1!B2', text.replace('/bio ', ''));
  if (text.startsWith('/fb ')) return updateValue(ctx, 'Sheet1!B3', text.replace('/fb ', ''));
  if (text.startsWith('/wa ')) return updateValue(ctx, 'Sheet1!B4', text.replace('/wa ', ''));
  if (text.startsWith('/ig ')) return updateValue(ctx, 'Sheet1!B5', text.replace('/ig ', ''));
  if (text.startsWith('/tg ')) return updateValue(ctx, 'Sheet1!B6', text.replace('/tg ', ''));
});

module.exports = async (req, res) => {
  try {
    if (req.body) await bot.handleUpdate(req.body);
    res.status(200).send('OK');
  } catch (err) {
    res.status(500).send('Error');
  }
};

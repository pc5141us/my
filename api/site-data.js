const { google } = require('googleapis');

// --- حط بياناتك هنا مباشرة ---
const SPREADSHEET_ID = '10CH91sRewtZGXkdu1EOosSnDfj8N9-Uu2Nf65L5U9lw';

// حط محتوى ملف الـ JSON بتاع جوجل هنا (بين علامتين الاقتباس ` `)
const GOOGLE_JSON = `
{
  "كنسخ": "محتوى ملف الـ JSON هنا بالكامل"
}
`;
// ----------------------------

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  try {
    const credentials = JSON.parse(GOOGLE_JSON);
    const auth = new google.auth.JWT(
      credentials.client_email,
      null,
      credentials.private_key.replace(/\\n/g, '\n'),
      ['https://www.googleapis.com/auth/spreadsheets.readonly']
    );

    const sheets = google.sheets({ version: 'v4', auth });
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Sheet1!A1:B10',
    });

    const rows = response.data.values;
    const data = {};
    if (rows) {
      rows.forEach(row => {
        if (row[0] && row[1]) data[row[0]] = row[1];
      });
    }

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      details: error.stack 
    });
  }
};

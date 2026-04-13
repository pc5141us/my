
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzps7gLgC8OKl9xnJnMH0qW71FvXy_lISV73_lIVl0jhf4FAxe1odlSJRP0TXsZp07H/exec';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  try {
    const response = await fetch(SCRIPT_URL);
    if (!response.ok) throw new Error('Failed to fetch data');
    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      tip: "تأكد من أن الرابط يعمل بشكل صحيح"
    });
  }
};

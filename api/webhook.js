
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxObM_Zq_h63qNBTJg5d_bUUUcZN7BRYzvG5RB2v9GB43A8AYWSgZEkgmCiXTo8CNEjDA/exec";

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(200).send('Keyboard persistency Proxy is active.');
    }

    try {
        await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify(req.body),
            headers: { 'Content-Type': 'application/json' }
        });

        return res.status(200).send('OK');
    } catch (error) {
        console.error("Proxy Error:", error);
        return res.status(200).send('Error but OK');
    }
}


const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxObM_Zq_h63qNBTJg5d_bUUUcZN7BRYzvG5RB2v9GB43A8AYWSgZEkgmCiXTo8CNEjDA/exec";

export default async function handler(req, res) {
    try {
        const response = await fetch(SCRIPT_URL);
        const data = await response.json();
        return res.status(200).json(data);
    } catch (error) {
        console.error("Error fetching from GAS:", error);
        return res.status(500).json({ error: "Failed to fetch data from Google Sheets" });
    }
}

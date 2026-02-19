// Vercel Serverless Function (Node.js)
export default async function handler(req, res) {
    // 1. セキュリティチェック（POSTメソッド以外は拒否）
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { cardName } = req.body;
    
    // 2. 環境変数からAPIキーを取得（コードには直接書かない！）
    // Vercelの管理画面で「GEMINI_API_KEY」という名前で登録しておきます
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'API key not configured' });
    }

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: `あなたはプロのタロット占い師です。カード「${cardName}」に基づいた今日の運勢を、200文字程度で占ってください。` }] }]
            })
        });

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

        // モデルエラーやブロック時はフォールバック
        if (!text) {
            const errMsg = data.error?.message || data.error?.status || `HTTP ${response.status}`;
            console.error('Gemini API:', response.status, errMsg);
            return res.status(response.ok ? 500 : response.status).json({ error: errMsg });
        }

        // 3. 結果だけをブラウザに返す
        res.status(200).json({ reading: text });
    } catch (error) {
        console.error('Fortune API error:', error);
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
}
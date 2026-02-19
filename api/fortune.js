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
    const prompt = `あなたはプロのタロット占い師です。カード「${cardName}」に基づいた今日の運勢を、200文字程度で占ってください。`;
    const body = JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
    });

    // 利用可能なモデルを順に試す（地域・APIバージョンで利用可否が異なるため）
    const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.5-flash-preview-05-20', 'gemini-2.5-flash-preview'];
    let lastError = null;

    for (const model of models) {
        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body
            });

            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

            if (text) {
                return res.status(200).json({ reading: text });
            }

            const errMsg = data.error?.message || '';
            if (errMsg.includes('not found') || errMsg.includes('is not supported')) {
                lastError = errMsg;
                continue; // 次のモデルを試す
            }
            return res.status(response.ok ? 500 : response.status).json({ error: errMsg || `HTTP ${response.status}` });
        } catch (e) {
            lastError = e.message;
        }
    }

    return res.status(500).json({ error: lastError || '利用可能なモデルが見つかりませんでした' });
} catch (error) {
    console.error('Fortune API error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
}
}
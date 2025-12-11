// Dosya Adı: netlify/functions/gemini-proxy.js
// Bu kod Node.js ortamında (Sunucuda) çalışır.

const fetch = require('node-fetch'); 

exports.handler = async (event, context) => {
    // 1. GİZLİ API Anahtarını Ortam Değişkenlerinden Güvenli Şekilde Al
    const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

    if (!GOOGLE_API_KEY) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "API Anahtarı bulunamadı. Lütfen Netlify Ortam Değişkenlerini kontrol edin." })
        };
    }

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        // 2. İstemciden (Browser) Gelen Sorguyu Al
        const { prompt } = JSON.parse(event.body);

        // 3. Model Adını Belirle (Sizin için çalışan model)
        const MODEL_NAME = "gemini-2.5-flash"; 

        // 4. Gemini API'ye Güvenli Çağrı Yap (API Key burada kullanılır)
        const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${GOOGLE_API_KEY}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ 
                    role: "user", 
                    parts: [{ text: prompt }] 
                }]
            })
        });

        const data = await geminiResponse.json();

        // Hata kontrolü
        if (data.error) {
            return {
                statusCode: data.error.code || 500,
                body: JSON.stringify({ error: data.error.message })
            };
        }

        // 5. Cevabı Temizleyip İstemciye Geri Gönder
        const aiResponseText = data.candidates[0].content.parts[0].text;

        return {
            statusCode: 200,
            body: JSON.stringify({ text: aiResponseText }) // 'text' olarak gönderiyoruz
        };

    } catch (error) {
        console.error("Netlify Fonksiyon Hatası:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Sunucu tarafında bilinmeyen bir hata oluştu." })
        };
    }
};
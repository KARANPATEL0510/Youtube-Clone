import { NextRequest, NextResponse } from 'next/server';

// ─── POST /api/translate ───────────────────────────────────────────────────────
// Uses MyMemory free translation API (no API key required)
// Body: { text: string, targetLang: string }  e.g. targetLang = "fr", "hi", "zh"
export async function POST(req: NextRequest) {
  try {
    const { text, targetLang } = await req.json();

    if (!text?.trim() || !targetLang) {
      return NextResponse.json({ error: 'text and targetLang are required' }, { status: 400 });
    }

    const url = new URL('https://api.mymemory.translated.net/get');
    url.searchParams.set('q', text.trim());
    url.searchParams.set('langpair', `en|${targetLang}`);

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`MyMemory API error: ${response.status}`);
    }

    const data = await response.json();

    // MyMemory returns responseStatus 200 on success
    if (data.responseStatus !== 200) {
      return NextResponse.json(
        { error: data.responseDetails || 'Translation failed' },
        { status: 502 }
      );
    }

    const translatedText = data.responseData?.translatedText ?? text;

    return NextResponse.json({ translatedText });
  } catch (error) {
    console.error('Translation error:', error);
    return NextResponse.json({ error: 'Failed to translate' }, { status: 500 });
  }
}

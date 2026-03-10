import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

export async function POST(req: NextRequest) {
  const { description } = await req.json();

  if (!description || typeof description !== 'string' || !description.trim()) {
    return NextResponse.json({ error: 'Description is required.' }, { status: 400 });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Groq API key not configured.' }, { status: 500 });
  }

  try {
    const groq = new Groq({ apiKey });
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: 'You are a nutrition expert. Estimate macros accurately. Understand both English and Bahasa Indonesia. Always respond with valid JSON only, no extra text.',
        },
        {
          role: 'user',
          content: `Analyze the following food/drink description and estimate the macronutrients in grams. Description: "${description}". Respond with a JSON object containing exactly these fields: fat (number), carbs (number), protein (number).`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const text = completion.choices[0]?.message?.content;
    if (!text) {
      return NextResponse.json({ error: 'No response from AI.' }, { status: 500 });
    }

    const data = JSON.parse(text);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Groq error:', error);
    return NextResponse.json({ error: 'Failed to analyze food.' }, { status: 500 });
  }
}

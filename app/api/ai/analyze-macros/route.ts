import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { ANALYZE_MACROS_SYSTEM_PROMPT, ANALYZE_MACROS_USER_PROMPT } from '@/lib/prompts/analyze-macros';

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
        { role: 'system', content: ANALYZE_MACROS_SYSTEM_PROMPT },
        { role: 'user', content: ANALYZE_MACROS_USER_PROMPT(description) },
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

import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

const PROMPT = `Extract customer information from this input and return ONLY a JSON object with these exact keys:
{
  "name": "full name or empty string",
  "phone": "phone number digits only, no formatting, or empty string",
  "email": "email address or empty string",
  "street": "street address or empty string",
  "city": "city or empty string",
  "state": "2-letter state code or empty string",
  "zip": "zip code or empty string",
  "notes": "any other relevant notes or empty string"
}

Rules:
- Return only the raw JSON, no markdown, no explanation
- If a field is not found, use empty string ""
- For phone, strip all non-digits (remove dashes, spaces, parentheses)
- For state, use 2-letter abbreviation (e.g. TX not Texas)
- Name should be First Last format if possible`;

export async function POST(request: NextRequest) {
  if (!client) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY not configured' },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { text, imageBase64, mediaType } = body;

    let message;

    if (imageBase64) {
      message = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 512,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mediaType || 'image/jpeg',
                  data: imageBase64,
                },
              },
              {
                type: 'text',
                text: PROMPT,
              },
            ],
          },
        ],
      });
    } else if (text) {
      message = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 512,
        messages: [
          {
            role: 'user',
            content: `${PROMPT}\n\nInput text:\n${text}`,
          },
        ],
      });
    } else {
      return NextResponse.json({ error: 'No input provided' }, { status: 400 });
    }

    const raw = message.content[0].type === 'text' ? message.content[0].text : '';
    const extracted = JSON.parse(raw);

    return NextResponse.json({ extracted });
  } catch (error) {
    console.error('Extract customer info error:', error);
    return NextResponse.json(
      { error: 'Failed to extract customer information' },
      { status: 500 }
    );
  }
}

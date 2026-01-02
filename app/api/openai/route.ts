import OpenAI from 'openai';
import { NextRequest } from 'next/server';

export const runtime = 'nodejs';

const openai = new OpenAI({
  baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const messages = body.messages ?? [{ role: 'system', content: '帮我简单介绍下next.js' }];
    const model = body.model ?? 'qwen-plus';

    const completion = await openai.chat.completions.create({
      messages,
      model,
    });

    return new Response(JSON.stringify(completion), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

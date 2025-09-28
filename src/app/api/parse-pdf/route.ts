
import { NextResponse } from 'next/server';
import pdf from 'pdf-parse';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const data = await pdf(buffer);

    return NextResponse.json({ text: data.text });
  } catch (error) {
    console.error('Error parsing PDF:', error);
    return NextResponse.json({ error: 'Error parsing PDF' }, { status: 500 });
  }
}

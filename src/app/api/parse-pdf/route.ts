import { NextResponse } from 'next/server';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    const pdf = await pdfjs.getDocument(buffer).promise;
    const numPages = pdf.numPages;
    let textContent = '';

    for (let i = 1; i <= numPages; i++) {
      const page = await pdf.getPage(i);
      const text = await page.getTextContent();
      textContent += text.items.map((s: any) => s.str).join(' ');
    }

    return NextResponse.json({ text: textContent });
  } catch (error) {
    console.error('Error parsing PDF:', error);
    return NextResponse.json({ error: 'Error parsing PDF' }, { status: 500 });
  }
}
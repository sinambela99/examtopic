import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

const DATA_DIR = path.resolve(process.cwd(), 'data');

export async function GET(request, { params }) {
  const { slug } = await params;
  const fileName = `examtopics_${slug}_with_discussions.json`;
  const filePath = path.join(DATA_DIR, fileName);

  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(raw);
    return NextResponse.json(data);
  } catch (err) {
    console.error(`Failed to read ${fileName}:`, err);
    return NextResponse.json({ error: `${fileName} not found` }, { status: 404 });
  }
}

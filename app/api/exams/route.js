import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

// Resolve the root of the project data directory
const DATA_DIR = path.resolve(process.cwd(), 'data');

export async function GET() {
  try {
    const filePath = path.join(DATA_DIR, 'exams.json');
    const raw = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(raw);
    return NextResponse.json(data);
  } catch (err) {
    console.error('Failed to read exams.json:', err);
    return NextResponse.json({ error: 'exams.json not found' }, { status: 404 });
  }
}

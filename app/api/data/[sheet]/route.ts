import { NextResponse } from 'next/server';
import { getDoc, ensureSheets, getSheetByTitleCaseInsensitive } from '@/lib/google-sheets';

export async function GET(req: Request, { params }: { params: Promise<{ sheet: string }> }) {
  try {
    const resolvedParams = await params;
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const doc = await getDoc();
    await ensureSheets(doc);
    
    const sheetTitle = decodeURIComponent(resolvedParams.sheet);
    const sheet = getSheetByTitleCaseInsensitive(doc, sheetTitle);
    if (!sheet) return NextResponse.json([]);
    
    const rows = await sheet.getRows();
    const data = rows.map(r => r.toObject()).filter(r => r.userId === userId);
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ sheet: string }> }) {
  try {
    const resolvedParams = await params;
    const body = await req.json();
    const doc = await getDoc();
    await ensureSheets(doc);
    
    const sheetTitle = decodeURIComponent(resolvedParams.sheet);
    const sheet = getSheetByTitleCaseInsensitive(doc, sheetTitle);
    if (!sheet) throw new Error(`Sheet ${sheetTitle} not found`);
    await sheet.addRow(body);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ sheet: string }> }) {
  try {
    const resolvedParams = await params;
    const body = await req.json();
    const doc = await getDoc();
    await ensureSheets(doc);
    
    const sheetTitle = decodeURIComponent(resolvedParams.sheet);
    const sheet = getSheetByTitleCaseInsensitive(doc, sheetTitle);
    if (!sheet) throw new Error(`Sheet ${sheetTitle} not found`);
    const rows = await sheet.getRows();
    const row = rows.find(r => r.get('id') === body.id);
    if (row) {
      row.assign(body);
      await row.save();
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ sheet: string }> }) {
  try {
    const resolvedParams = await params;
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const doc = await getDoc();
    await ensureSheets(doc);
    
    const sheetTitle = decodeURIComponent(resolvedParams.sheet);
    const sheet = getSheetByTitleCaseInsensitive(doc, sheetTitle);
    if (!sheet) throw new Error(`Sheet ${sheetTitle} not found`);
    const rows = await sheet.getRows();
    const row = rows.find(r => r.get('id') === id);
    if (row) {
      await row.delete();
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

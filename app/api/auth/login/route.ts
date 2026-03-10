import { NextResponse } from 'next/server';
import { getDoc, ensureSheets, getSheetByTitleCaseInsensitive } from '@/lib/google-sheets';

export async function POST(req: Request) {
  try {
    const { username } = await req.json();
    if (!username) return NextResponse.json({ error: 'Username is required' }, { status: 400 });

    const doc = await getDoc();
    await ensureSheets(doc);
    
    const sheet = getSheetByTitleCaseInsensitive(doc, 'user');
    if (!sheet) throw new Error('User sheet not found after ensureSheets');
    
    const rows = await sheet.getRows();
    
    let userRow = rows.find(r => r.get('username') === username);
    if (!userRow) {
      const newUser = { id: crypto.randomUUID(), username };
      await sheet.addRow(newUser);
      return NextResponse.json(newUser);
    }
    
    return NextResponse.json({ id: userRow.get('id'), username: userRow.get('username') });
  } catch (error: any) {
    console.error('Login Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

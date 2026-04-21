import { NextRequest, NextResponse } from 'next/server';
import db, { initDb, isMock } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    await initDb();
    
    // Autenticação robusta: aceita as duas variantes de variáveis de ambiente
    const auth = req.headers.get('x-access-pin');
    const validPin = process.env.ACCESS_PIN || process.env.NEXT_PUBLIC_ACCESS_PIN || "3955";
    
    if (auth !== validPin && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const result = await db.execute('SELECT key, value, updatedAt FROM SyncData');
    
    // Transformar em objeto Record<string, { value: string, updatedAt: number }>
    const data: Record<string, { value: string, updatedAt: number }> = {};
    result.rows.forEach((row: any) => {
      data[row.key] = {
        value: row.value,
        updatedAt: row.updatedAt || 0
      };
    });

    return NextResponse.json({ 
      data, 
      isMock // Informar se estamos em modo mock (falta de URL)
    });
  } catch (error: any) {
    console.error('Sync GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await initDb();

    // Autenticação robusta: aceita as duas variantes de variáveis de ambiente
    const auth = req.headers.get('x-access-pin');
    const validPin = process.env.ACCESS_PIN || process.env.NEXT_PUBLIC_ACCESS_PIN || "3955";
    
    if (auth !== validPin && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { key, value } = await req.json();

    if (!key) {
      return NextResponse.json({ error: 'Chave em falta' }, { status: 400 });
    }

    const updatedAt = Date.now();

    // Upsert (Insert or Replace)
    await db.execute({
      sql: 'INSERT OR REPLACE INTO SyncData (key, value, updatedAt) VALUES (?, ?, ?)',
      args: [key, value, updatedAt]
    });

    return NextResponse.json({ success: true, updatedAt });
  } catch (error: any) {
    console.error('Sync POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

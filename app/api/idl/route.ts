import { NextResponse } from 'next/server'
import idl from '@/lib/idl/specmarket.json'

export async function GET() {
  return NextResponse.json(idl)
}

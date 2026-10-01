import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/supabase/server'
import type { SaveProductInput } from '@/lib/products'

export async function POST(request: Request) {
  try {
    const supabase = await requireUser()
    const input = await request.json() as SaveProductInput
    const { data: category } = await supabase.from('product_categories').select('id').eq('name', input.category.trim()).maybeSingle()
    if (!category) return NextResponse.json({ error: 'Kategori belum tersedia di master data.' }, { status: 400 })
    const { data, error } = await supabase.from('products').insert({ name: input.name.trim(), category_id: category.id, abbreviation: input.abbreviation.trim().toLowerCase(), medicine_group: input.group.trim(), composition: input.composition.trim() || null, short_composition: input.shortComposition.trim() || null, has_tax: input.hasTax }).select('id, sku').single()
    if (error) throw error
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    const unauthorized = error instanceof Error && error.message === 'Unauthorized'
    return NextResponse.json({ error: unauthorized ? 'Unauthorized' : 'Unable to save product' }, { status: unauthorized ? 401 : 400 })
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await requireUser()
    const body = await request.json() as { id?: string; input?: SaveProductInput }
    if (!body.id || !body.input) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    const { data, error } = await supabase.from('products').update({ name: body.input.name.trim(), abbreviation: body.input.abbreviation.trim().toLowerCase(), medicine_group: body.input.group.trim(), composition: body.input.composition.trim() || null, short_composition: body.input.shortComposition.trim() || null, has_tax: body.input.hasTax }).eq('id', body.id).select('id, sku').single()
    if (error) throw error
    return NextResponse.json(data)
  } catch (error) {
    const unauthorized = error instanceof Error && error.message === 'Unauthorized'
    return NextResponse.json({ error: unauthorized ? 'Unauthorized' : 'Unable to update product' }, { status: unauthorized ? 401 : 400 })
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await requireUser()
    const id = new URL(request.url).searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    const { error } = await supabase.from('products').update({ is_active: false }).eq('id', id)
    if (error) throw error
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    const unauthorized = error instanceof Error && error.message === 'Unauthorized'
    return NextResponse.json({ error: unauthorized ? 'Unauthorized' : 'Unable to deactivate product' }, { status: unauthorized ? 401 : 400 })
  }
}

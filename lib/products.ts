import { createClient } from '@/lib/supabase/client'

export type ProductPackageInput = {
  name: string
  abbreviation: string
  quantity: number
  unit: string
}

export type SaveProductInput = {
  name: string
  unit: string
  abbreviation: string
  hasTax: boolean
  group: string
  category: string
  composition: string
  shortComposition: string
  packages: ProductPackageInput[]
}

async function findOrCreateUnit(name: string, abbreviation: string, conversionFactor: number) {
  const supabase = createClient()
  const normalizedName = name.trim().toLowerCase()
  const { data: existing, error: lookupError } = await supabase
    .from('units')
    .select('id')
    .eq('name', normalizedName)
    .eq('abbreviation', abbreviation.trim().toLowerCase())
    .maybeSingle()

  if (lookupError) throw lookupError
  if (existing) return existing.id

  const { data, error } = await supabase
    .from('units')
    .insert({ name: normalizedName, abbreviation: abbreviation.trim().toLowerCase(), conversion_factor: conversionFactor })
    .select('id')
    .single()

  if (error) throw error
  return data.id
}

export async function saveProduct(input: SaveProductInput) {
  const supabase = createClient()
  const categoryName = input.category.trim()
  const { data: category, error: categoryError } = await supabase
    .from('product_categories')
    .select('id')
    .eq('name', categoryName)
    .maybeSingle()

  if (categoryError) throw categoryError
  if (!category) throw new Error(`Kategori "${categoryName}" belum tersedia di master data.`)

  const baseUnitId = await findOrCreateUnit(input.unit, input.abbreviation, 1)
  const { data: product, error: productError } = await supabase
    .from('products')
    .insert({
      name: input.name.trim(),
      category_id: category.id,
      unit_id: baseUnitId,
      abbreviation: input.abbreviation.trim().toLowerCase(),
      medicine_group: input.group.trim(),
      composition: input.composition.trim() || null,
      short_composition: input.shortComposition.trim() || null,
      has_tax: input.hasTax,
    })
    .select('id, sku')
    .single()

  if (productError) throw productError

  try {
    let conversion = 1
    const packagingRows = []
    for (const item of input.packages) {
      const quantity = Number(item.quantity)
      if (!item.name.trim() || !item.abbreviation.trim() || !Number.isFinite(quantity) || quantity <= 0) {
        throw new Error('Data kemasan belum lengkap atau jumlahnya tidak valid.')
      }
      conversion *= quantity
      const unitId = await findOrCreateUnit(item.name, item.abbreviation, conversion)
      packagingRows.push({ product_id: product.id, name: item.name.trim(), abbreviation: item.abbreviation.trim().toLowerCase(), quantity, unit_id: unitId })
    }

    if (packagingRows.length) {
      const { error: packageError } = await supabase.from('product_packaging').insert(packagingRows)
      if (packageError) throw packageError
    }
  } catch (error) {
    await supabase.from('products').delete().eq('id', product.id)
    throw error
  }

  return product
}

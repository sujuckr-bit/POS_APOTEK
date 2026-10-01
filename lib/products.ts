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

export type ProductListItem = { id: string; name: string; sku: string; stock: number | null; units: { name: string; abbreviation: string } | null }
export type ProductDetails = { id: string; name: string; abbreviation: string | null; medicine_group: string | null; composition: string | null; short_composition: string | null; has_tax: boolean; units: { name: string; abbreviation: string } | null; product_categories: { name: string } | null; product_packaging: { id: string; name: string; abbreviation: string; quantity: number; units: { name: string } | null }[] }

export async function listProducts(): Promise<ProductListItem[]> {
  const supabase = createClient()
  const { data, error } = await supabase.from('products').select('id, name, sku, stock, unit_id, is_active, units(name, abbreviation)').eq('is_active', true).order('name')
  if (error) throw error
  return (data ?? []) as ProductListItem[]
}

export async function getProduct(id: string): Promise<ProductDetails> {
  const supabase = createClient()
  const { data, error } = await supabase.from('products').select('id, name, abbreviation, medicine_group, composition, short_composition, has_tax, unit_id, category_id, product_categories(name), units(name, abbreviation), product_packaging(id, name, abbreviation, quantity, units(name))').eq('id', id).single()
  if (error) throw error
  return data as ProductDetails
}

async function request<T>(url: string, init: RequestInit) {
  const response = await fetch(url, { ...init, headers: { 'Content-Type': 'application/json', ...init.headers } })
  const body = response.status === 204 ? null : await response.json() as { error?: string } & T
  if (!response.ok) throw new Error(body?.error ?? 'Operasi produk gagal.')
  return body as T
}

export async function updateProduct(id: string, input: SaveProductInput) {
  return request<{ id: string; sku: string }>('/api/products', { method: 'PUT', body: JSON.stringify({ id, input }) })
}

export async function deactivateProduct(id: string) {
  await request('/api/products?id=' + encodeURIComponent(id), { method: 'DELETE' })
}

export async function saveProduct(input: SaveProductInput) {
  return request<{ id: string; sku: string }>('/api/products', { method: 'POST', body: JSON.stringify(input) })
}

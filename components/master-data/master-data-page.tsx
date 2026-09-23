'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import { createClient } from '@/lib/supabase/client'
import { formatRupiah } from './master-data-types'

type Tab = 'Produk' | 'Kategori' | 'Supplier' | 'Satuan'
type Product = { id: string; sku: string; name: string; selling_price: number; stock: number; minimum_stock: number; is_active: boolean; category?: { name: string } | null; supplier?: { name: string } | null; unit?: { name: string } | null }
type ReferenceRow = { id: string; name: string; is_active: boolean; abbreviation?: string }
const supabase = createClient()
const fetchProducts = async () => {
  const { data, error } = await supabase.from('products').select('id, sku, name, selling_price, stock, minimum_stock, is_active, category:product_categories(name), supplier:suppliers(name), unit:units(name)').order('name')
  if (error) throw error
  return (data ?? []) as Product[]
}
const fetchReferences = async (table: 'product_categories' | 'suppliers' | 'units') => {
  const query = table === 'units'
    ? supabase.from('units').select('id, name, is_active, abbreviation')
    : table === 'suppliers'
      ? supabase.from('suppliers').select('id, name, is_active')
      : supabase.from('product_categories').select('id, name, is_active')
  const { data, error } = await query.order('name')
  if (error) throw error
  return (data ?? []) as unknown as ReferenceRow[]
}

export function MasterDataPage() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('Produk')
  const [query, setQuery] = useState('')
  const { data: products, error: productError, isLoading: productsLoading, mutate: mutateProducts } = useSWR('master-products', fetchProducts)
  const referenceTable = tab === 'Kategori' ? 'product_categories' : tab === 'Supplier' ? 'suppliers' : 'units'
  const { data: references, error: referenceError, isLoading: referencesLoading, mutate: mutateReferences } = useSWR(tab === 'Produk' ? null : `master-${referenceTable}`, () => fetchReferences(referenceTable))
  const visibleProducts = useMemo(() => (products ?? []).filter((product) => `${product.name} ${product.sku}`.toLowerCase().includes(query.toLowerCase())), [products, query])
  const activeCount = (products ?? []).filter((product) => product.is_active).length

  const toggleProduct = async (product: Product) => {
    const { error } = await supabase.from('products').update({ is_active: !product.is_active }).eq('id', product.id)
    if (!error) await mutateProducts()
  }

  const addReference = async () => {
    const result = tab === 'Satuan'
      ? await supabase.from('units').insert({ name: 'Satuan baru', abbreviation: 'SB' })
      : tab === 'Supplier'
        ? await supabase.from('suppliers').insert({ name: 'Supplier baru' })
        : await supabase.from('product_categories').insert({ name: 'Kategori baru' })
    if (result.error) window.alert('Data referensi belum dapat ditambahkan.')
    else await mutateReferences()
  }

  return <main className="master-page">
    <header className="master-header"><div><p className="eyebrow">Operasional apotek</p><h1>Data master</h1><p>Kelola produk, kategori, supplier, dan satuan penjualan dari satu tempat.</p></div><button className="master-primary" onClick={tab === 'Produk' ? () => router.push('/master-data/produk/tambah') : addReference}>Tambah {tab.toLowerCase()}</button></header>
    <section className="master-summary"><strong>{activeCount}</strong><span>produk aktif di kasir</span><span className="master-summary-dot" /><span>{products?.length ?? 0} total produk</span></section>
    <nav className="master-tabs" aria-label="Data master"><div>{(['Produk', 'Kategori', 'Supplier', 'Satuan'] as Tab[]).map((item) => <button key={item} className={tab === item ? 'active' : ''} onClick={() => setTab(item)}>{item}</button>)}</div></nav>
    {tab === 'Produk' ? <section className="master-panel"><div className="master-panel-head"><div><h2>Produk</h2><p>Produk aktif dapat langsung digunakan di kasir.</p></div><input aria-label="Cari produk" placeholder="Cari nama atau SKU" value={query} onChange={(event) => setQuery(event.target.value)} /></div><div className="master-table-wrap"><table><thead><tr><th>Produk</th><th>Kategori</th><th>Supplier</th><th>Satuan</th><th>Harga jual</th><th>Stok</th><th>Status</th><th /></tr></thead><tbody>{productsLoading ? <tr><td colSpan={8}>Memuat data produk…</td></tr> : productError ? <tr><td colSpan={8}>Data produk belum dapat dimuat.</td></tr> : visibleProducts.map((product) => <tr key={product.id}><td><strong>{product.name}</strong><small>{product.sku}</small></td><td>{product.category?.name ?? '—'}</td><td>{product.supplier?.name ?? '—'}</td><td>{product.unit?.name ?? '—'}</td><td>{formatRupiah(product.selling_price)}</td><td className={product.stock <= product.minimum_stock ? 'stock-warning' : ''}>{product.stock}</td><td><span className={`master-status ${product.is_active ? 'on' : 'off'}`}>{product.is_active ? 'Aktif' : 'Nonaktif'}</span></td><td><button className="master-action" onClick={() => toggleProduct(product)}>{product.is_active ? 'Nonaktifkan' : 'Aktifkan'}</button></td></tr>)}</tbody></table></div></section> : <section className="master-panel"><div className="master-panel-head"><div><h2>{tab}</h2><p>Referensi yang tersedia untuk operasional apotek.</p></div></div><div className="master-table-wrap"><table><thead><tr><th>Nama</th>{tab === 'Satuan' && <th>Singkatan</th>}<th>Status</th></tr></thead><tbody>{referencesLoading ? <tr><td colSpan={3}>Memuat data…</td></tr> : referenceError ? <tr><td colSpan={3}>Data belum dapat dimuat.</td></tr> : references?.map((reference) => <tr key={reference.id}><td><strong>{reference.name}</strong></td>{tab === 'Satuan' && <td>{reference.abbreviation ?? '—'}</td>}<td><span className={`master-status ${reference.is_active ? 'on' : 'off'}`}>{reference.is_active ? 'Aktif' : 'Nonaktif'}</span></td></tr>)}</tbody></table></div></section>}

  </main>
}

'use client'

import { useMemo, useState } from 'react'
import useSWR from 'swr'
import { ArrowLeft, ChevronDown, Filter, Pencil, Search, SlidersHorizontal, UserRound } from 'lucide-react'
import { listProducts } from '@/lib/products'
import { formatRupiah } from '@/components/pos/pos-types'

type FilterValue = 'all' | 'available' | 'low-stock' | 'unavailable'

const filters: { label: string; value: FilterValue }[] = [
  { label: 'Semua produk', value: 'all' },
  { label: 'Tersedia', value: 'available' },
  { label: 'Stok menipis', value: 'low-stock' },
  { label: 'Stok habis', value: 'unavailable' },
]

function statusLabel(status: FilterValue | 'expired') {
  if (status === 'low-stock') return 'Stok menipis'
  if (status === 'unavailable') return 'Stok habis'
  if (status === 'expired') return 'Kedaluwarsa'
  return 'Tersedia'
}

export default function CatalogPage() {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<FilterValue>('all')
  const [filterOpen, setFilterOpen] = useState(false)
  const { data: storedProducts, mutate, error } = useSWR('catalog-products', listProducts)

  const products = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return (storedProducts ?? []).filter((product) => {
      const stock = Number(product.stock ?? 0)
      const status: FilterValue = stock <= 0 ? 'unavailable' : 'available'
      const matchesQuery = !normalized || product.name.toLowerCase().includes(normalized) || product.sku.toLowerCase().includes(normalized)
      const matchesFilter = filter === 'all' || (filter === 'low-stock' ? stock > 0 && stock <= 10 : status === filter)
      return matchesQuery && matchesFilter
    })
  }, [filter, query, storedProducts])

  return (
    <main className="pos-app catalog-app">
      <div className="page-area">
        <header className="page-header catalog-header">
          <a className="icon-button" href="/" aria-label="Kembali ke kasir"><ArrowLeft size={20} /></a>
          <div><h1>Katalog Produk</h1></div>
          <a className="catalog-add-product" href="/katalog/tambah">Tambah produk</a>
          <div className="header-actions"><span className="branch-chip"><span className="online-dot" /> Apotek Risyah · Cabang utama</span><button type="button" className="icon-button" aria-label="Profil pengguna"><UserRound size={18} /></button></div>
        </header>

        <section className="catalog-page-content" aria-labelledby="catalog-title">
          <div className="catalog-intro"><div></div></div>
          <div className="catalog-controls"><label className="catalog-search"><Search size={19} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari nama produk, generik, atau barcode..." aria-label="Cari produk" /></label><div className="catalog-filter-wrap"><button type="button" className="catalog-filter-button" onClick={() => setFilterOpen((open) => !open)} aria-expanded={filterOpen}><Filter size={16} /> {filters.find((item) => item.value === filter)?.label}<ChevronDown size={15} /></button>{filterOpen && <div className="catalog-filter-menu" role="menu">{filters.map((item) => <button type="button" key={item.value} role="menuitem" className={filter === item.value ? 'catalog-filter-selected' : ''} onClick={() => { setFilter(item.value); setFilterOpen(false) }}>{item.label}</button>)}</div>}</div></div>
          <div className="catalog-summary"><span><strong>{products.length}</strong> produk ditemukan</span><button type="button" className="catalog-sort"><SlidersHorizontal size={14} /> Urutkan: Nama</button></div>
          <div className="catalog-product-grid">{error && <div className="catalog-empty"><strong>Produk gagal dimuat</strong><span>Periksa koneksi database lalu coba lagi.</span></div>}{products.map((product) => { const stock = Number(product.stock ?? 0); const status: FilterValue = stock <= 0 ? 'unavailable' : stock <= 10 ? 'low-stock' : 'available'; const unit = product.units?.abbreviation; return <article className="catalog-product-card" key={product.id}><div className="catalog-product-main"><div className="catalog-product-top"><span className="catalog-code">{product.sku}</span><span className={`status status-${status}`}>{statusLabel(status)}</span></div><h3>{product.name}</h3><div className="catalog-product-meta"><span>Stok <strong>{stock} {unit ?? 'unit'}</strong></span><span className="catalog-product-actions"><a href={`/katalog/tambah?edit=${product.id}`} className="catalog-action catalog-action-edit"><Pencil size={16} /> Edit</a></span></div></div></article> })}{!error && products.length === 0 && <div className="catalog-empty"><Search size={24} /><strong>Produk tidak ditemukan</strong><span>Coba kata kunci atau filter yang lain.</span></div>}</div>
        </section>
      </div>
    </main>
  )
}

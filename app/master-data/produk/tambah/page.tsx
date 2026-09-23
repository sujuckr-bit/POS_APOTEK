'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import { createClient } from '@/lib/supabase/client'

type ReferenceRow = { id: string; name: string; is_active: boolean; abbreviation?: string }
type ProductForm = { name: string; sku: string; category_id: string; supplier_id: string; unit_id: string; minimum_stock: string }

const supabase = createClient()
const emptyForm: ProductForm = { name: '', sku: '', category_id: '', supplier_id: '', unit_id: '', minimum_stock: '0' }

async function fetchReferences(table: 'product_categories' | 'suppliers' | 'units') {
  const query = table === 'units'
    ? supabase.from('units').select('id, name, is_active, abbreviation')
    : table === 'suppliers'
      ? supabase.from('suppliers').select('id, name, is_active')
      : supabase.from('product_categories').select('id, name, is_active')
  const { data, error } = await query.order('name')
  if (error) throw error
  return (data ?? []) as unknown as ReferenceRow[]
}

export default function TambahProdukPage() {
  const router = useRouter()
  const [form, setForm] = useState<ProductForm>(emptyForm)
  const [formError, setFormError] = useState('')
  const [isSaving, setSaving] = useState(false)
  const { data: categories, isLoading: categoriesLoading } = useSWR('master-product_categories', () => fetchReferences('product_categories'))
  const { data: suppliers, isLoading: suppliersLoading } = useSWR('master-suppliers', () => fetchReferences('suppliers'))
  const { data: units, isLoading: unitsLoading } = useSWR('master-units', () => fetchReferences('units'))

  const update = (field: keyof ProductForm, value: string) => setForm((current) => ({ ...current, [field]: value }))

  const saveProduct = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError('')
    const minimumStock = Number(form.minimum_stock)
    if (!form.name.trim() || !form.sku.trim() || !form.category_id || !form.unit_id) {
      setFormError('Nama, kode produk, kategori, dan satuan dasar wajib diisi.')
      return
    }
    if (!Number.isFinite(minimumStock) || minimumStock < 0) {
      setFormError('Stok minimum tidak boleh negatif.')
      return
    }
    setSaving(true)
    const { error } = await supabase.from('products').insert({ name: form.name.trim(), sku: form.sku.trim(), category_id: form.category_id, supplier_id: form.supplier_id || null, unit_id: form.unit_id, minimum_stock: minimumStock, stock: 0 })
    setSaving(false)
    if (error) {
      setFormError(error.code === '23505' ? 'Kode produk sudah digunakan.' : 'Produk belum dapat disimpan.')
      return
    }
    router.push('/master-data')
  }

  return (
    <main className="master-page">
      <header className="master-header"><div><p className="eyebrow">Data master / Produk</p><h1>Tambah produk</h1><p>Masukkan informasi produk agar dapat digunakan pada operasional apotek.</p></div><button type="button" className="master-secondary" onClick={() => router.push('/master-data')}>Kembali</button></header>
      <form className="master-product-form" onSubmit={saveProduct}>
        <section className="master-panel"><div className="master-panel-head"><div><h2>Identitas produk</h2><p>Gunakan kode yang konsisten untuk pencarian dan barcode.</p></div></div><div className="master-form-grid"><label>Nama produk<input autoFocus value={form.name} onChange={(event) => update('name', event.target.value)} /></label><label>Kode produk / SKU<input value={form.sku} onChange={(event) => update('sku', event.target.value)} /></label></div></section>
        <section className="master-panel"><div className="master-panel-head"><div><h2>Klasifikasi</h2><p>Pilih referensi aktif yang sesuai dengan produk.</p></div></div><div className="master-form-grid"><label>Kategori<select value={form.category_id} onChange={(event) => update('category_id', event.target.value)} disabled={categoriesLoading}><option value="">Pilih kategori</option>{categories?.filter((item) => item.is_active).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label>Satuan dasar<select value={form.unit_id} onChange={(event) => update('unit_id', event.target.value)} disabled={unitsLoading}><option value="">Pilih satuan</option>{units?.filter((item) => item.is_active).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label>Supplier <span className="master-form-hint">Opsional</span><select value={form.supplier_id} onChange={(event) => update('supplier_id', event.target.value)} disabled={suppliersLoading}><option value="">Pilih supplier</option>{suppliers?.filter((item) => item.is_active).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label></div></section>
        <section className="master-panel"><div className="master-panel-head"><div><h2>Persediaan</h2><p>Stok awal dibuat nol dan bertambah melalui penerimaan pembelian.</p></div></div><div className="master-form-grid"><label>Minimum stok<input type="number" min="0" value={form.minimum_stock} onChange={(event) => update('minimum_stock', event.target.value)} /></label></div></section>
        {formError && <p className="master-form-error" role="alert">{formError}</p>}
        <div className="master-modal-actions"><button type="button" className="master-secondary" onClick={() => router.push('/master-data')}>Batal</button><button type="submit" className="master-primary" disabled={isSaving}>{isSaving ? 'Menyimpan…' : 'Simpan produk'}</button></div>
      </form>
    </main>
  )
}

'use client'

import { useState } from 'react'
import { ArrowLeft, ChevronDown, CircleHelp, Plus, Trash2, X } from 'lucide-react'
import Link from 'next/link'

type PackageRow = { id: number; name: string; abbreviation: string; quantity: string }

const categories = ['Obat bebas', 'Obat resep', 'Vitamin', 'Alat kesehatan']
const groups = ['Bebas', 'Bebas terbatas', 'Keras', 'Psikotropika', 'Narkotika']

export default function AddProductPage() {
  const [packages, setPackages] = useState<PackageRow[]>([])
  const [hasTax, setHasTax] = useState(true)
  const [category, setCategory] = useState('')
  const [group, setGroup] = useState('')

  function addPackage() {
    setPackages((current) => [...current, { id: Date.now(), name: '', abbreviation: '', quantity: '' }])
  }

  function updatePackage(id: number, key: keyof Omit<PackageRow, 'id'>, value: string) {
    setPackages((current) => current.map((item) => item.id === id ? { ...item, [key]: value } : item))
  }

  return (
    <main className="product-form-page">
      <header className="product-form-header">
        <Link href="/katalog" className="product-form-close" aria-label="Kembali ke katalog"><X size={25} /></Link>
        <strong>Katalog</strong>
        <button type="submit" form="add-product-form" className="product-form-save">Simpan</button>
      </header>

      <form id="add-product-form" className="product-form" onSubmit={(event) => event.preventDefault()}>
        <h1>Buat barang</h1>
        <label className="product-field product-field-full">Nama barang<input name="name" required autoFocus /></label>
        <div className="product-unit-grid">
          <label className="product-field">Satuan terkecil<span className="product-help">Contoh: tablet, kapsul, lembar</span><input name="unit" required /></label>
          <label className="product-field product-abbreviation">Singkatan<span className="product-help">3 huruf</span><input name="abbreviation" maxLength={3} required /></label>
        </div>

        <section className="product-form-section">
          <h2>Satuan &amp; kemasan</h2>
          <div className="product-tip"><CircleHelp size={22} /><p><strong>Tips</strong>Untuk memudahkan, buat kemasan dari kecil (contoh: strip isi 8 tablet) ke besar (contoh: box isi 10 strip).</p></div>
          <div className="package-list">{packages.map((item) => <div className="package-row" key={item.id}><label className="product-field">Nama kemasan<input value={item.name} onChange={(event) => updatePackage(item.id, 'name', event.target.value)} /></label><label className="product-field">Singkatan<input value={item.abbreviation} maxLength={3} onChange={(event) => updatePackage(item.id, 'abbreviation', event.target.value)} /></label><label className="product-field">Isi<input type="number" min="1" value={item.quantity} onChange={(event) => updatePackage(item.id, 'quantity', event.target.value)} /></label><button type="button" className="package-remove" onClick={() => setPackages((current) => current.filter((row) => row.id !== item.id))} aria-label="Hapus kemasan"><Trash2 size={18} /></button></div>)}</div>
          <button type="button" className="package-add" onClick={addPackage}><Plus size={21} /> Satuan/kemasan</button>
        </section>

        <section className="product-form-section product-info-section">
          <h2>Info lainnya</h2>
          <fieldset className="product-tax"><legend>PPN</legend><label><input type="radio" name="tax" checked={hasTax} onChange={() => setHasTax(true)} /> <span> terdapat PPN</span></label><label><input type="radio" name="tax" checked={!hasTax} onChange={() => setHasTax(false)} /> <span> tanpa PPN</span></label></fieldset>
          <label className="product-field">Golongan obat<select value={group} onChange={(event) => setGroup(event.target.value)} required><option value="">Golongan obat belum dipilih</option>{groups.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label className="product-field">Kategori<select value={category} onChange={(event) => setCategory(event.target.value)} required><option value="">Pilih kategori</option>{categories.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label className="product-field">Komposisi<textarea name="composition" rows={4} /></label>
          <label className="product-field">Komposisi singkat<textarea name="shortComposition" rows={4} /></label>
        </section>
      </form>
    </main>
  )
}

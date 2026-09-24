'use client'

import { useEffect, useRef, useState } from 'react'
import { CircleHelp, Plus, Trash2, X } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

type PackageRow = { id: number; name: string; abbreviation: string; quantity: string; unit: string }
type ProductDraft = { name: string; unit: string; abbreviation: string; hasTax: boolean; group: string; category: string; composition: string; shortComposition: string; packages: PackageRow[] }

const categories = ['Obat bebas', 'Obat resep', 'Vitamin', 'Alat kesehatan']
const groups = ['Bebas', 'Bebas terbatas', 'Keras', 'Psikotropika', 'Narkotika']

export default function AddProductPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [packages, setPackages] = useState<PackageRow[]>([])
  const [productName, setProductName] = useState('')
  const [unit, setUnit] = useState('')
  const [abbreviation, setAbbreviation] = useState('')
  const [composition, setComposition] = useState('')
  const [shortComposition, setShortComposition] = useState('')
  const [saveMessage, setSaveMessage] = useState('')
  const packageLoaded = useRef(false)

  function saveProduct(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!productName.trim() || !unit.trim() || !abbreviation.trim() || !group || !category) return
    const draft: ProductDraft = { name: productName.trim(), unit: unit.trim(), abbreviation: abbreviation.trim().toLowerCase(), hasTax, group, category, composition: composition.trim(), shortComposition: shortComposition.trim(), packages }
    sessionStorage.setItem('pos-apotek-product-draft', JSON.stringify(draft))
    setSaveMessage('Data produk siap disimpan. Hubungkan ke database untuk menyimpan permanen.')
  }

  useEffect(() => {
    const encodedPackage = searchParams.get('package')
    const sessionDraft = sessionStorage.getItem('pos-apotek-product-draft')
    if (!encodedPackage && !sessionDraft) return
    try {
      const draft = sessionDraft ? JSON.parse(sessionDraft) as ProductDraft : null
      if (draft) {
        setProductName(draft.name)
        setUnit(draft.unit)
        setAbbreviation(draft.abbreviation)
        setHasTax(draft.hasTax)
        setGroup(draft.group)
        setCategory(draft.category)
        setComposition(draft.composition)
        setShortComposition(draft.shortComposition)
        setPackages(draft.packages)
      }
      if (encodedPackage && !packageLoaded.current) {
        packageLoaded.current = true
        const saved = JSON.parse(encodedPackage) as PackageRow
        setPackages((current) => [...current, { ...saved, id: Date.now(), quantity: String(saved.quantity) }])
      }
      sessionStorage.removeItem('pos-apotek-product-draft')
      router.replace('/katalog/tambah')
    } catch {
      sessionStorage.removeItem('pos-apotek-product-draft')
      router.replace('/katalog/tambah')
    }
  }, [router, searchParams])
  const [hasTax, setHasTax] = useState(true)
  const [category, setCategory] = useState('')
  const [group, setGroup] = useState('')

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

      <form id="add-product-form" className="product-form" onSubmit={saveProduct}>
        <h1>Buat barang</h1>
        {saveMessage && <p className="product-save-message" role="status">{saveMessage}</p>}
        <label className="product-field product-field-full">Nama barang<input name="name" value={productName} onChange={(event) => setProductName(event.target.value)} required autoFocus /></label>
        <div className="product-unit-grid">
          <label className="product-field">Satuan terkecil<span className="product-help">Contoh: tablet, kapsul, lembar</span><input name="unit" value={unit} onChange={(event) => setUnit(event.target.value)} required /></label>
          <label className="product-field product-abbreviation">Singkatan<span className="product-help">3 huruf</span><input name="abbreviation" value={abbreviation} onChange={(event) => setAbbreviation(event.target.value)} maxLength={3} required /></label>
        </div>

        <section className="product-form-section">
          <h2>Satuan &amp; kemasan</h2>
          <div className="product-tip"><CircleHelp size={22} /><p><strong>Tips</strong>Untuk memudahkan, buat kemasan dari kecil (contoh: strip isi 8 tablet) ke besar (contoh: box isi 10 strip).</p></div>
          <div className="package-list">{packages.map((item) => <div className="package-row" key={item.id}><label className="product-field">Nama kemasan<input value={item.name} onChange={(event) => updatePackage(item.id, 'name', event.target.value)} /></label><label className="product-field">Singkatan<input value={item.abbreviation} maxLength={3} onChange={(event) => updatePackage(item.id, 'abbreviation', event.target.value)} /></label><label className="product-field">Isi ({item.unit})<input type="number" min="1" value={item.quantity} onChange={(event) => updatePackage(item.id, 'quantity', event.target.value)} /></label><button type="button" className="package-remove" onClick={() => setPackages((current) => current.filter((row) => row.id !== item.id))} aria-label="Hapus kemasan"><Trash2 size={18} /></button></div>)}</div>
          <button type="button" className="package-add" onClick={() => { const draft: ProductDraft = { name: productName, unit, abbreviation, hasTax, group, category, composition, shortComposition, packages }; sessionStorage.setItem('pos-apotek-product-draft', JSON.stringify(draft)); const options = encodeURIComponent(JSON.stringify(packages.map(({ name, abbreviation, quantity, unit: packageUnit }) => ({ name, abbreviation, quantity: Number(quantity), unit: packageUnit })))); router.push(`/katalog/tambah/kemasan?unit=${encodeURIComponent(unit)}&options=${options}`) }} disabled={!unit}><Plus size={21} /> Satuan/kemasan</button>
        </section>

        <section className="product-form-section product-info-section">
          <h2>Info lainnya</h2>
          <fieldset className="product-tax"><legend>PPN</legend><label><input type="radio" name="tax" checked={hasTax} onChange={() => setHasTax(true)} /> <span> terdapat PPN</span></label><label><input type="radio" name="tax" checked={!hasTax} onChange={() => setHasTax(false)} /> <span> tanpa PPN</span></label></fieldset>
          <label className="product-field">Golongan obat<select value={group} onChange={(event) => setGroup(event.target.value)} required><option value="">Golongan obat belum dipilih</option>{groups.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label className="product-field">Kategori<select value={category} onChange={(event) => setCategory(event.target.value)} required><option value="">Pilih kategori</option>{categories.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label className="product-field">Komposisi<textarea name="composition" rows={4} value={composition} onChange={(event) => setComposition(event.target.value)} /></label>
          <label className="product-field">Komposisi singkat<textarea name="shortComposition" rows={4} value={shortComposition} onChange={(event) => setShortComposition(event.target.value)} /></label>
        </section>
      </form>
    </main>
  )
}

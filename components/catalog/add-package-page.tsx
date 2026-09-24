'use client'

import { useState } from 'react'
import { ArrowLeft, CircleHelp } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'

type PackageOption = { name: string; abbreviation: string; quantity: number }

export default function AddPackagePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const smallestUnit = searchParams.get('unit') || 'satuan terkecil'
  const [name, setName] = useState('')
  const [abbreviation, setAbbreviation] = useState('')
  const [quantity, setQuantity] = useState('')
  const [unit, setUnit] = useState(smallestUnit)

  const options: PackageOption[] = JSON.parse(searchParams.get('options') || '[]')
  const availableUnits = [smallestUnit, ...options.map((option) => option.name)]

  function savePackage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const packageData = encodeURIComponent(JSON.stringify({ name, abbreviation, quantity: Number(quantity), unit }))
    router.push(`/katalog/tambah?unit=${encodeURIComponent(smallestUnit)}&package=${packageData}`)
  }

  return (
    <main className="product-form-page">
      <header className="product-form-header">
        <button type="button" className="product-form-close" onClick={() => router.back()} aria-label="Kembali ke tambah produk"><ArrowLeft size={28} /></button>
        <strong>Tambah kemasan</strong>
      </header>
      <form className="package-form" onSubmit={savePackage}>
        <div className="package-name-grid">
          <label className="product-field">Nama kemasan<input value={name} onChange={(event) => setName(event.target.value)} placeholder="strip, box, dus" required autoFocus /><span className="product-help">Contoh: strip, box dan dus.</span></label>
          <label className="product-field">Singkatan<input value={abbreviation} onChange={(event) => setAbbreviation(event.target.value)} maxLength={3} placeholder="str" required /><span className="product-help">3 huruf</span></label>
        </div>
        <div className="package-content-grid">
          <label className="product-field">Isi<input type="number" min="1" step="1" value={quantity} onChange={(event) => setQuantity(event.target.value)} required /></label>
          <label className="product-field">Satuan<select value={unit} onChange={(event) => setUnit(event.target.value)}>{availableUnits.map((option) => <option key={option}>{option}</option>)}</select></label>
        </div>
        <div className="package-tip"><CircleHelp size={23} /><p><strong>Tips</strong>Jika satuan isi yang kamu inginkan belum ada, buat satuan/kemasan tersebut lebih dulu sebelum membuat kemasan yang lebih besar.</p></div>
        <button type="submit" className="product-form-save package-save">Simpan</button>
      </form>
    </main>
  )
}

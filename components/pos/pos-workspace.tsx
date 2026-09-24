'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, ChevronDown, ClipboardList, CreditCard, FileText, LayoutDashboard, Menu, Package, Plus, QrCode, Receipt, Search, ShoppingCart, Trash2, UserRound, Wallet, X } from 'lucide-react'
import { batchAllocations, demoProducts } from './pos-demo-data'
import { qrisDemoPayload } from './qris-demo-payload'
import { persistTransaction } from '@/lib/transactions'
import { ConfirmAction, FeedbackBanner, PermissionGate } from './feedback-states'
import type { CartLine, PaymentMethod, Product } from './pos-types'
import { useCart } from './cart-context'
import { formatRupiah } from './pos-types'

const menuItems = [
  { label: 'Kasir', icon: ShoppingCart },
  { label: 'Transaksi', icon: Receipt },
  { label: 'Katalog', icon: Package },
  { label: 'Pembelian', icon: ClipboardList },
  { label: 'Stok', icon: LayoutDashboard },
  { label: 'Laporan', icon: FileText },
]

function statusLabel(product: Product) {
  if (product.status === 'low-stock') return 'Stok menipis'
  if (product.status === 'unavailable') return 'Stok habis'
  if (product.status === 'expired') return 'Kedaluwarsa'
  return product.requiresPrescription ? 'Resep dokter' : 'Tersedia'
}

function ProductCard({ product, onAdd }: { product: Product; onAdd: () => void }) {
  const unavailable = product.status === 'unavailable' || product.status === 'expired'
  return (
    <button type="button" disabled={unavailable} onClick={onAdd} className="product-card" aria-label={`Tambah ${product.name}`}>
      <div className="product-card-top"><span className="product-code">{product.barcode}</span><span className={`status status-${product.status}`}>{statusLabel(product)}</span></div>
      <strong>{product.name}</strong>
          <div className="product-card-bottom"><b>{formatRupiah(product.price)}</b><span>{product.availableStock} {product.unitLabel.toLowerCase()}</span></div>
    </button>
  )
}

function CashDialog({ total, onCancel, onConfirm }: { total: number; onCancel: () => void; onConfirm: () => void }) {
  const [received, setReceived] = useState('')
  const amount = Number(received) || 0
  const change = amount - total
  return <div className="dialog-backdrop"><section className="dialog" role="dialog" aria-modal="true" aria-labelledby="cash-title">
    <div className="dialog-heading"><div><span className="eyebrow">Pembayaran tunai</span><h2 id="cash-title">Terima pembayaran</h2></div><button type="button" className="icon-button" onClick={onCancel} aria-label="Tutup"><X size={20} /></button></div>
    <div className="dialog-total"><span>Total tagihan</span><strong>{formatRupiah(total)}</strong></div>
    <label className="field-label" htmlFor="cash-received">Uang diterima</label><input id="cash-received" autoFocus className="cash-input" inputMode="numeric" value={received} onChange={(event) => setReceived(event.target.value.replace(/\D/g, ''))} placeholder="Rp 0" />
    <div className={`change-row ${change < 0 ? 'change-error' : ''}`}><span>{change < 0 ? 'Kurang' : 'Kembalian'}</span><strong>{formatRupiah(Math.abs(change))}</strong></div>
    <div className="quick-amounts">{[total, Math.ceil(total / 50000) * 50000, Math.ceil(total / 100000) * 100000].filter((value, index, values) => values.indexOf(value) === index).map((value) => <button type="button" key={value} onClick={() => setReceived(String(value))}>{value === total ? 'Uang pas' : formatRupiah(value)}</button>)}</div>
    <div className="dialog-actions"><button type="button" className="button-secondary" onClick={onCancel}>Batal</button><button type="button" className="button-primary" disabled={change < 0} onClick={onConfirm}><Check size={17} /> Konfirmasi pembayaran</button></div>
  </section></div>
}

function QrisDialog({ total, transactionNumber, onCancel, onConfirm, processing }: { total: number; transactionNumber: string; onCancel: () => void; onConfirm: () => void; processing: boolean }) {
  return <div className="dialog-backdrop"><section className="dialog qris-dialog" role="dialog" aria-modal="true" aria-labelledby="qris-title">
    <div className="dialog-heading"><div><span className="eyebrow">Pembayaran QRIS</span><h2 id="qris-title">Scan untuk membayar</h2></div><button type="button" className="icon-button" onClick={onCancel} aria-label="Tutup" disabled={processing}><X size={20} /></button></div>
    <div className="qris-visual"><QrCode size={124} strokeWidth={1.2} /><strong>{qrisDemoPayload.merchantName}</strong><span>QR dinamis · {transactionNumber || 'Transaksi baru'}</span></div>
    <div className="dialog-total"><span>Nominal pembayaran</span><strong>{formatRupiah(total)}</strong></div>
    <div className="qris-warning"><strong>Konfirmasi manual diperlukan</strong><span>Pastikan dana sudah masuk di aplikasi pembayaran sebelum melanjutkan. Sistem belum menerima konfirmasi otomatis dari provider.</span><small>Status: {qrisDemoPayload.displayStatus}</small></div>
    <div className="dialog-actions"><button type="button" className="button-secondary" onClick={onCancel} disabled={processing}>Batal</button><button type="button" className="button-primary" onClick={onConfirm} disabled={processing}><Check size={17} /> {processing ? 'Memproses...' : 'Dana sudah diterima'}</button></div>
  </section></div>
}

export default function PosWorkspace() {
  const [activeSection, setActiveSection] = useState('Kasir')
  const [query, setQuery] = useState('')
  const router = useRouter()
  const { cart, setCart } = useCart()
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash')
  const [dialog, setDialog] = useState<'cash' | 'qris' | 'success' | null>(null)
  const [navOpen, setNavOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [menuSheetOpen, setMenuSheetOpen] = useState(false)
  const [sheetOffset, setSheetOffset] = useState(0)
  const [dragStart, setDragStart] = useState<number | null>(null)
  const [processing, setProcessing] = useState(false)
  const [transactionNumber, setTransactionNumber] = useState('')
  const [paymentError, setPaymentError] = useState('')

  const results = useMemo(() => {
    const value = query.trim().toLowerCase()
    return demoProducts.filter((product) => !value || [product.name, product.genericName, product.barcode].some((field) => field.toLowerCase().includes(value)))
  }, [query])
  const subtotal = cart.reduce((sum, line) => sum + line.unit.price * line.quantity, 0)
  const total = subtotal

  const addProduct = (product: Product) => {
    if (product.status === 'unavailable' || product.status === 'expired') return
    setCart((current) => {
      const existing = current.find((line) => line.product.id === product.id)
      if (existing) return current.map((line) => line.product.id === product.id ? { ...line, quantity: Math.min(line.quantity + 1, product.availableStock), allocations: batchAllocations(product.id, Math.min(line.quantity + 1, product.availableStock)) } : line)
      return [...current, { product, quantity: 1, unit: product.units?.[0] ?? { label: product.unitLabel, price: product.price, conversionFactor: 1 }, allocations: batchAllocations(product.id, 1) }]
    })
    setQuery('')
  }

  const updateQuantity = (id: string, next: number) => setCart((current) => current.map((line) => line.product.id === id ? { ...line, quantity: Math.max(1, Math.min(next, Math.floor(line.product.availableStock / line.unit.conversionFactor))), allocations: batchAllocations(id, Math.max(1, Math.min(next, Math.floor(line.product.availableStock / line.unit.conversionFactor)))) } : line))
  const updateUnit = (id: string, unitIndex: number) => setCart((current) => current.map((line) => { if (line.product.id !== id) return line; const unit = line.product.units?.[unitIndex] ?? line.unit; const quantity = Math.min(line.quantity, Math.floor(line.product.availableStock / unit.conversionFactor)); return { ...line, unit, quantity: Math.max(1, quantity), allocations: batchAllocations(id, Math.max(1, quantity)) } }))
  const completePayment = async () => {
    setProcessing(true)
    setPaymentError('')
    try {
      const transaction = await persistTransaction({ cart, paymentMethod })
      setTransactionNumber(transaction.transaction_number)
      setDialog('success')
    } catch (error) {
      setPaymentError(error instanceof Error ? error.message : 'Transaksi gagal disimpan.')
    } finally {
      setProcessing(false)
    }
  }
  const newTransaction = () => { setCart([]); setQuery(''); setTransactionNumber(''); setPaymentError(''); setDialog(null) }

  const selectSection = (label: string) => { setNavOpen(false); setMenuSheetOpen(false); setSheetOffset(0); if (label === 'Katalog') { router.push('/katalog'); return }; setActiveSection(label) }
  const closeNavigation = () => setNavOpen(false)
  const closeMenuSheet = () => { setMenuSheetOpen(false); setSheetOffset(0) }
  const handleSheetPointerMove = (event: React.PointerEvent<HTMLElement>) => { if (dragStart !== null) setSheetOffset(Math.max(0, event.clientY - dragStart)) }
  const handleSheetPointerUp = () => { if (sheetOffset > 90) closeMenuSheet(); else setSheetOffset(0); setDragStart(null) }
  useEffect(() => { const handleKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') closeMenuSheet() }; window.addEventListener('keydown', handleKeyDown); return () => window.removeEventListener('keydown', handleKeyDown) }, [])

  return <main className={`pos-app ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
    {navOpen && <button type="button" className="nav-scrim" aria-label="Tutup menu" onClick={closeNavigation} />}
    <aside className={`sidebar ${navOpen ? 'sidebar-open' : ''}`}><div className="brand"><div className="brand-mark">R</div><div className="brand-copy"><strong>Risyah</strong><span>Apotek POS</span></div><button className="icon-button sidebar-close" onClick={closeNavigation} aria-label="Tutup menu"><X size={18} /></button><button className="icon-button sidebar-collapse" onClick={() => setSidebarCollapsed((value) => !value)} aria-label={sidebarCollapsed ? 'Tampilkan sidebar' : 'Sembunyikan sidebar'}><ChevronDown size={18} /></button></div><nav aria-label="Navigasi utama">{menuItems.map(({ label, icon: Icon }) => <button type="button" key={label} className={`nav-item ${activeSection === label ? 'nav-item-active' : ''}`} onClick={() => selectSection(label)}><Icon size={18} /><span>{label}</span>{label === 'Kasir' && <span className="nav-dot" />}</button>)}</nav><div className="sidebar-bottom"><div className="shift-card"><div className="shift-icon"><Wallet size={17} /></div><div><span>Shift pagi</span><strong>Aktif · Rp 500.000</strong></div></div><button type="button" className="profile-button"><span className="avatar">AS</span><span><strong>Andi Saputra</strong><small>Kasir</small></span><ChevronDown size={16} /></button></div></aside>
    <div className="page-area"><header className="page-header"><button type="button" className="icon-button menu-trigger" onClick={() => setNavOpen(true)} aria-label="Buka navigasi utama"><Menu size={21} /></button><div><h1>{activeSection === 'Kasir' ? 'Kasir' : activeSection}</h1></div><div className="header-actions"><span className="branch-chip"><span className="online-dot" /> Apotek Risyah · Cabang utama</span><button type="button" className="icon-button"><UserRound size={18} /></button></div></header>
      {activeSection !== 'Kasir' ? <section className="empty-section"><div className="empty-icon"><Package size={26} /></div><h2>{activeSection}</h2><p>Modul ini disiapkan untuk tahap berikutnya. Kasir checkout tetap menjadi alur utama pada prototype ini.</p><button type="button" className="button-primary" onClick={() => setActiveSection('Kasir')}>Kembali ke kasir</button></section> : <section className="checkout-layout"><div className="catalog-panel"><div className="catalog-toolbar"><div className="search-wrap"><Search size={20} /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && results[0]) addProduct(results[0]) }} placeholder="Cari nama obat atau scan barcode..." aria-label="Cari produk atau barcode" /></div><div className="category-row"><button className="category-active">Semua produk</button><button>Obat bebas</button><button>Resep dokter</button><button>Vitamin & suplemen</button></div><div className="results-meta"><span>{query ? `${results.length} produk ditemukan` : 'Produk populer hari ini'}</span><button type="button">Urutkan: Relevan <ChevronDown size={14} /></button></div></div><div className="product-grid">{results.map((product) => <ProductCard product={product} key={product.id} onAdd={() => addProduct(product)} />)}{results.length === 0 && <div className="empty-results"><Search size={22} /><strong>Produk tidak ditemukan</strong><span>Coba nama lain atau periksa barcode.</span></div>}</div></div>
      <aside className="cart-panel"><div className="cart-heading"><div><span className="eyebrow">Transaksi baru</span><h2>Keranjang <span>{cart.length}</span></h2></div>{cart.length > 0 && <PermissionGate allowed={true} permission="supervisor"><ConfirmAction title="Kosongkan" description="Semua item akan dihapus dari transaksi ini." confirmLabel="Ya, kosongkan transaksi" onConfirm={() => setCart([])} /></PermissionGate>}</div><div className="cart-lines">{cart.length === 0 ? <div className="cart-empty"><div className="cart-empty-icon"><ShoppingCart size={25} /></div><strong>Keranjang masih kosong</strong><span>Scan barcode atau pilih produk untuk mulai transaksi.</span></div> : cart.map((line) => <div className="cart-line" key={line.product.id}><div className="line-main"><div><strong>{line.product.name}</strong><span>{line.unit.label} · FEFO otomatis</span>{line.product.units && <select aria-label={`Satuan ${line.product.name}`} value={line.product.units.findIndex((unit) => unit.label === line.unit.label)} onChange={(event) => updateUnit(line.product.id, Number(event.target.value))}>{line.product.units.map((unit) => <option key={unit.label} value={line.product.units?.findIndex((item) => item.label === unit.label)}>{unit.label} · {formatRupiah(unit.price)}</option>)}</select>}</div><button type="button" className="icon-button line-delete" onClick={() => setCart((current) => current.filter((item) => item.product.id !== line.product.id))} aria-label={`Hapus ${line.product.name}`}><Trash2 size={15} /></button></div><div className="line-bottom"><div className="quantity-control"><button type="button" onClick={() => updateQuantity(line.product.id, line.quantity - 1)} aria-label="Kurangi jumlah">−</button><span>{line.quantity}</span><button type="button" onClick={() => updateQuantity(line.product.id, line.quantity + 1)} aria-label="Tambah jumlah">+</button></div><strong>{formatRupiah(line.unit.price * line.quantity)}</strong></div><details className="batch-details"><summary>Alokasi batch FEFO <ChevronDown size={13} /></summary>{line.allocations.map((allocation) => <span key={allocation.batch}>{allocation.batch} · exp {allocation.expiry} · {allocation.quantity} unit</span>)}</details></div>)}</div><div className="cart-footer"><div className="summary-row"><span>Subtotal</span><strong>{formatRupiah(subtotal)}</strong></div><div className="summary-row muted-row"><span>Diskon <span className="manager-only">Manager</span></span><button type="button" className="text-button" disabled>Tambah diskon</button></div><div className="total-row"><span>Total</span><strong>{formatRupiah(total)}</strong></div><div className="payment-methods"><button type="button" className={paymentMethod === 'cash' ? 'method-active' : ''} onClick={() => setPaymentMethod('cash')}><Wallet size={17} /><span>Tunai</span><small>Manual</small></button><button type="button" className={paymentMethod === 'qris' ? 'method-active' : ''} onClick={() => setPaymentMethod('qris')}><QrCode size={17} /><span>QRIS</span><small>Manual</small></button></div><button type="button" className="pay-button" disabled={!cart.length || processing} onClick={() => setDialog(paymentMethod)}>{processing ? 'Memproses...' : `Bayar ${formatRupiah(total)}`} <span>→</span></button><span className="secure-note"><CreditCard size={13} /> Transaksi aman · stok dikunci saat pembayaran</span></div></aside></section>}
      {cart.length > 0 && <section className="mobile-cart-popup" aria-label="Ringkasan keranjang"><div className="mobile-cart-summary"><div className="mobile-cart-count"><ShoppingCart size={17} /><strong>{cart.length} item</strong><span>{formatRupiah(total)}</span></div><button type="button" className="mobile-cart-pay" onClick={() => router.push('/kasir/pembayaran')}>Bayar sekarang</button></div><details className="mobile-cart-details"><summary>Lihat keranjang</summary><div className="mobile-cart-lines">{cart.map((line) => <div className="mobile-cart-line" key={line.product.id}><span>{line.quantity} × {line.product.name}<small>{line.unit.label}</small>{line.product.units && <select aria-label={`Satuan ${line.product.name}`} value={line.product.units.findIndex((unit) => unit.label === line.unit.label)} onChange={(event) => updateUnit(line.product.id, Number(event.target.value))}>{line.product.units.map((unit, index) => <option key={unit.label} value={index}>{unit.label} · {formatRupiah(unit.price)}</option>)}</select>}</span><strong>{formatRupiah(line.unit.price * line.quantity)}</strong></div>)}</div></details></section>}
    </div>
    {menuSheetOpen && <button type="button" className="sheet-scrim" aria-label="Tutup menu" onClick={closeMenuSheet} />}
    {dialog === 'cash' && <CashDialog total={total} onCancel={() => setDialog(null)} onConfirm={completePayment} />}{dialog === 'qris' && <QrisDialog total={total} transactionNumber={transactionNumber} processing={processing} onCancel={() => setDialog(null)} onConfirm={completePayment} />}{paymentError && <FeedbackBanner tone="error" title="Transaksi belum tersimpan" message={paymentError} action={<button type="button" className="text-button" onClick={() => setPaymentError('')}>Tutup</button>} />}{dialog === 'success' && <div className="dialog-backdrop"><section className="dialog success-dialog" role="dialog" aria-modal="true"><div className="success-mark"><Check size={30} /></div><span className="eyebrow">Pembayaran berhasil</span><h2>Transaksi selesai</h2><p>Nomor transaksi <strong>#{transactionNumber}</strong> telah berhasil disimpan.</p><div className="dialog-total"><span>Total pembayaran</span><strong>{formatRupiah(total)}</strong></div><div className="dialog-actions"><button type="button" className="button-secondary" onClick={newTransaction}>Transaksi baru</button><button type="button" className="button-primary" onClick={newTransaction}><Receipt size={17} /> Lihat struk</button></div></section></div>}
  </main>
}

'use client'

import { useMemo, useState } from 'react'
import { ArrowLeft, Check, Minus, Plus, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { persistTransaction } from '@/lib/transactions'
import { useCart } from '@/components/pos/cart-context'
import { formatRupiah, type PaymentMethod } from '@/components/pos/pos-types'

export default function PaymentPage() {
  const router = useRouter()
  const { cart, setCart } = useCart()
  const [method, setMethod] = useState<PaymentMethod>('cash')
  const [received, setReceived] = useState('')
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const total = useMemo(() => cart.reduce((sum, line) => sum + line.unit.price * line.quantity, 0), [cart])
  const change = (Number(received) || 0) - total
  const adjust = (id: string, delta: number) => setCart((lines) => lines.map((line) => line.product.id === id ? { ...line, quantity: Math.max(1, Math.min(line.quantity + delta, Math.floor(line.product.availableStock / line.unit.conversionFactor))) } : line))
  const pay = async () => {
    setProcessing(true); setError('')
    try {
      const result = await persistTransaction({ cart, paymentMethod: method })
      setSuccess(result.transaction_number)
      setCart([])
    } catch (value) { setError(value instanceof Error ? value.message : 'Transaksi gagal disimpan.') } finally { setProcessing(false) }
  }
  if (!cart.length && !success) return <main className="payment-page"><div className="payment-empty"><h1>Keranjang kosong</h1><p>Pilih produk terlebih dahulu sebelum melanjutkan pembayaran.</p><button className="button-primary" onClick={() => router.push('/')}>Kembali ke kasir</button></div></main>
  if (success) return <main className="payment-page"><section className="payment-success"><div className="success-mark"><Check size={30} /></div><span className="eyebrow">Pembayaran berhasil</span><h1>Transaksi selesai</h1><p>Nomor transaksi <strong>#{success}</strong> sudah tersimpan.</p><button className="button-primary" onClick={() => router.push('/')}>Transaksi baru</button></section></main>
  return <main className="payment-page"><header className="payment-header"><button className="button-secondary" onClick={() => router.push('/')}><ArrowLeft size={17} /> Kembali ke kasir</button><div><span className="eyebrow">Transaksi baru</span><h1>Pembayaran</h1></div><span className="payment-total">{formatRupiah(total)}</span></header><div className="payment-layout"><section className="payment-card"><div className="payment-card-heading"><div><span className="eyebrow">Periksa pesanan</span><h2>Keranjang <span>{cart.length}</span></h2></div><button className="text-button" onClick={() => setCart([])}>Kosongkan</button></div><div className="payment-lines">{cart.map((line) => <article className="payment-line" key={line.product.id}><div><strong>{line.product.name}</strong><span>{line.unit.label} · {formatRupiah(line.unit.price)}</span></div><div className="payment-line-actions"><button aria-label="Kurangi" onClick={() => adjust(line.product.id, -1)}><Minus size={14} /></button><b>{line.quantity}</b><button aria-label="Tambah" onClick={() => adjust(line.product.id, 1)}><Plus size={14} /></button><strong>{formatRupiah(line.unit.price * line.quantity)}</strong><button className="delete-payment-line" aria-label={`Hapus ${line.product.name}`} onClick={() => setCart((lines) => lines.filter((item) => item.product.id !== line.product.id))}><Trash2 size={15} /></button></div></article>)}</div></section><section className="payment-card payment-method-card"><span className="eyebrow">Selesaikan pembayaran</span><h2>Metode pembayaran</h2><div className="payment-methods"><button className={method === 'cash' ? 'payment-method-active' : ''} onClick={() => setMethod('cash')}>Tunai</button><button className={method === 'qris' ? 'payment-method-active' : ''} onClick={() => setMethod('qris')}>QRIS</button></div>{method === 'cash' && <><label className="field-label" htmlFor="received">Uang diterima</label><input id="received" className="cash-input" inputMode="numeric" value={received} onChange={(event) => setReceived(event.target.value.replace(/\D/g, ''))} placeholder="Rp 0" /><div className="quick-amounts">{[total, Math.ceil(total / 50000) * 50000, Math.ceil(total / 100000) * 100000].filter((v, i, a) => a.indexOf(v) === i).map((value) => <button key={value} onClick={() => setReceived(String(value))}>{value === total ? 'Uang pas' : formatRupiah(value)}</button>)}</div><div className={`change-row ${change < 0 ? 'change-error' : ''}`}><span>{change < 0 ? 'Kurang' : 'Kembalian'}</span><strong>{formatRupiah(Math.abs(change))}</strong></div></>}{method === 'qris' && <p className="payment-note">Konfirmasi dana QRIS secara manual sebelum menyelesaikan transaksi.</p>}{error && <p className="payment-error">{error}</p>}<button className="button-primary payment-submit" disabled={processing || (method === 'cash' && change < 0)} onClick={pay}>{processing ? 'Memproses...' : 'Bayar sekarang'} <Check size={17} /></button></section></div></main>
}

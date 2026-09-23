# Stage 03 — Data Contract & Acceptance Criteria

## Tujuan

Menetapkan kontrak data dan perilaku minimum untuk mengganti prototype in-memory dengan transaksi POS yang persisten, aman terhadap perubahan stok/harga, dan dapat diaudit.

## Batasan V1

- Satu cabang: Apotek Risyah · Cabang Utama.
- Aktor utama: kasir dan supervisor.
- Metode pembayaran: tunai dan QRIS.
- FEFO dipilih server-side berdasarkan expiry terdekat, lalu batch tertua.
- Cart tetap client-side sementara; sumber kebenaran checkout adalah server/database.
- Tidak ada localStorage sebagai sumber kebenaran transaksi.

## Kontrak Domain

### Product

```ts
type ProductStatus = 'active' | 'inactive'

type Product = {
  id: string
  name: string
  genericName: string | null
  strength: string | null
  barcode: string | null
  status: ProductStatus
  requiresPrescription: boolean
}
```

### ProductUnit

```ts
type ProductUnit = {
  id: string
  productId: string
  label: string
  conversionToBase: number
  isSellable: boolean
}

type ProductUnitPrice = {
  productUnitId: string
  amount: number
  effectiveFrom: string
  effectiveTo: string | null
}
```

`amount` disimpan sebagai integer Rupiah. Harga yang dipakai pada transaksi harus disalin sebagai snapshot ke `SaleItem`.

### InventoryBatch

```ts
type InventoryBatch = {
  id: string
  productId: string
  batchNumber: string
  expiresOn: string
  quantityBase: number
  reservedBase: number
  status: 'available' | 'quarantined' | 'expired'
}
```

Batch expired, quarantined, atau dengan available quantity nol tidak boleh dialokasikan.

### Sale dan SaleItem

```ts
type SaleStatus = 'completed' | 'voided' | 'refunded'

type Sale = {
  id: string
  transactionNumber: string
  cashierId: string
  branchId: string
  subtotal: number
  discount: number
  total: number
  status: SaleStatus
  createdAt: string
}

type SaleItem = {
  id: string
  saleId: string
  productId: string
  productUnitId: string
  productNameSnapshot: string
  unitLabelSnapshot: string
  unitPriceSnapshot: number
  quantity: number
  subtotal: number
}
```

### Payment

```ts
type PaymentMethod = 'cash' | 'qris'
type PaymentStatus = 'pending' | 'paid' | 'cancelled' | 'failed'

type Payment = {
  id: string
  saleId: string
  method: PaymentMethod
  status: PaymentStatus
  amount: number
  receivedAmount: number | null
  changeAmount: number | null
  providerReference: string | null
  paidAt: string | null
}
```

QRIS tidak boleh berstatus `paid` hanya karena QR ditampilkan atau timeout berlalu. Pada V1, konfirmasi manual tetap disimpan sebagai aksi kasir dan ditandai jelas untuk penggantian provider verification pada tahap berikutnya.

### StockMovement dan AuditEvent

```ts
type StockMovementReason = 'sale' | 'void' | 'return' | 'adjustment'

type StockMovement = {
  id: string
  batchId: string
  saleId: string | null
  quantityBase: number
  reason: StockMovementReason
  createdBy: string
  createdAt: string
}

type AuditEvent = {
  id: string
  actorId: string
  action: string
  entityType: string
  entityId: string
  metadata: Record<string, unknown>
  createdAt: string
}
```

## Checkout Contract

Input dari client hanya berisi `productUnitId` dan `quantity`, metode pembayaran, nominal diterima jika tunai, serta idempotency key. Server wajib mengambil ulang harga, status produk, dan batch dari database.

```ts
type CheckoutLineInput = { productUnitId: string; quantity: number }

type CheckoutInput = {
  lines: CheckoutLineInput[]
  paymentMethod: PaymentMethod
  receivedAmount?: number
  idempotencyKey: string
}

type CheckoutResult = {
  sale: Sale
  items: SaleItem[]
  payment: Payment
  allocations: { batchId: string; quantityBase: number }[]
}
```

Server wajib menolak:

- cart kosong;
- quantity non-integer, nol, atau negatif;
- produk inactive atau unit tidak sellable;
- harga tidak tersedia;
- stok tidak cukup setelah FEFO dihitung ulang;
- tunai kurang dari total;
- QRIS tanpa konfirmasi valid;
- idempotency key yang sama dengan payload berbeda.

Checkout harus atomik: jika salah satu validasi, payment, sale item, atau stock movement gagal, tidak ada sale completed dan tidak ada pengurangan stok parsial.

## Acceptance Criteria

1. Kasir dapat mencari produk active dan melihat harga/unit serta stok tersedia.
2. Produk inactive, expired, dan stok nol tidak dapat ditambahkan ke cart.
3. Checkout mengambil harga dan stok terbaru dari server, bukan mempercayai nilai client.
4. FEFO mengalokasikan batch dengan expiry paling dekat dan mengecualikan batch invalid.
5. Checkout tunai menyimpan received amount dan change amount yang benar.
6. Checkout QRIS tidak sukses sebelum aksi konfirmasi yang valid tercatat.
7. Double-submit dengan idempotency key tidak membuat dua transaksi atau dua pengurangan stok.
8. Kegagalan checkout meninggalkan stok dan status sale seperti sebelum request.
9. Sale menyimpan snapshot nama produk, unit, harga, subtotal, total, kasir, metode, dan waktu.
10. Void/retur membuat status atau stock movement baru dan tidak menghapus sale.
11. RLS membatasi akses data sesuai actor/branch/permission.
12. Riwayat transaksi dapat menampilkan nomor, waktu, kasir, total, metode, status, item, allocation, payment, dan audit trail.
13. UI menampilkan error yang dapat dipulihkan dan tidak menampilkan sukses optimistis.
14. Layout checkout dan error state tetap usable pada viewport 300×475 tanpa horizontal overflow.

## Di luar Stage 03

Schema SQL, RLS policy final, auth, API/server action, provider QRIS, printer receipt, kamera barcode, retur penuh, dan laporan diimplementasikan pada stage berikutnya setelah kontrak ini disetujui.

## Keputusan

- `SaleItem` memakai snapshot agar perubahan katalog tidak mengubah histori.
- Cart tidak dipersistenkan sebagai transaksi sampai checkout berhasil.
- Semua nilai uang integer Rupiah untuk menghindari error floating point.
- Stok dikelola melalui movement/atomic mutation, bukan update client-side langsung.
- QRIS manual diberi status eksplisit dan tidak dianggap sebagai integrasi provider production-ready.

## Status

Stage 03 selesai sebagai kontrak dan acceptance criteria. Dokumen ini menjadi input untuk Stage 04 — schema, auth, RLS, dan data access layer.

## Self-review

- Tidak ada placeholder atau TBD.
- Tipe payment, sale, inventory, dan audit konsisten dengan acceptance criteria.
- Risiko utama (stok negatif, stale price, double-submit, optimistic success) memiliki kontrak dan kriteria uji.
- Scope dibatasi pada kontrak; belum ada perubahan runtime atau schema.























































































































































Need remove garbage 

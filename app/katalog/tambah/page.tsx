import { Suspense } from 'react'
import AddProductPage from '@/components/catalog/add-product-page'

export const metadata = {
  title: 'Tambah Produk | Katalog Apotek Risyah',
  description: 'Tambah produk baru ke katalog Apotek Risyah.',
}

export default function AddProductRoute() {
  return <Suspense fallback={null}><AddProductPage /></Suspense>
}

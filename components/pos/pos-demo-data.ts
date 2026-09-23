import type { Product } from './pos-types'
import { masterProducts } from '@/components/master-data/master-data-types'

export const demoProducts: Product[] = masterProducts.filter((item) => item.active).map((item) => ({
  id: item.id, name: item.name, genericName: item.genericName, strength: item.strength, unitLabel: item.baseUnit,
  barcode: item.barcode, price: item.price, availableStock: item.availableStock,
  units: item.units, status: item.availableStock === 0 ? 'unavailable' : item.availableStock <= item.minimumStock ? 'low-stock' : 'available',
  requiresPrescription: item.requiresPrescription,
}))
export const batchAllocations = (productId: string, quantity: number) => {
  const product = demoProducts.find((item) => item.id === productId)
  if (!product) return []
  const first = Math.min(quantity, product.id === 'omep' ? 3 : quantity)
  return [
    { batch: product.id === 'omep' ? 'OM2403A' : 'BTH-2407-01', expiry: product.id === 'omep' ? '12 Sep 2026' : '30 Nov 2026', quantity: first },
    ...(first < quantity ? [{ batch: 'BTH-2408-04', expiry: '18 Feb 2027', quantity: quantity - first }] : []),
  ]
}

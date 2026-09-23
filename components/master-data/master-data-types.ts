export type ProductUnit = { label: string; price: number; conversionFactor: number }
export type ProductCategory = { id: string; name: string; active: boolean }
export type Supplier = { id: string; name: string; contact: string; active: boolean }
export type MasterProduct = {
  id: string; sku: string; name: string; genericName: string; strength: string; barcode: string
  categoryId: string; supplierId: string; baseUnit: string; units: ProductUnit[]
  purchasePrice: number; price: number; availableStock: number; minimumStock: number
  active: boolean; requiresPrescription?: boolean
}
export const masterCategories: ProductCategory[] = [
  { id: 'obat-resep', name: 'Obat resep', active: true }, { id: 'obat-bebas', name: 'Obat bebas', active: true }, { id: 'vitamin', name: 'Vitamin & suplemen', active: true },
]
export const masterSuppliers: Supplier[] = [
  { id: 'kimia-farma', name: 'PT Kimia Farma Trading', contact: '021-555-0101', active: true }, { id: 'sumber-sehat', name: 'CV Sumber Sehat', contact: '021-555-0102', active: true },
]
const unit = (label: string, price: number, conversionFactor = 1): ProductUnit => ({ label, price, conversionFactor })
export const masterProducts: MasterProduct[] = [
  { id: 'amox', sku: '899123456001', name: 'Amoxicillin 500 mg', genericName: 'Amoxicillin', strength: '500 mg', barcode: '899123456001', categoryId: 'obat-resep', supplierId: 'kimia-farma', baseUnit: 'Strip', units: [unit('Strip', 18500), unit('Box', 170200, 10)], purchasePrice: 12000, price: 18500, availableStock: 24, minimumStock: 10, active: true, requiresPrescription: true },
  { id: 'para', sku: '899123456002', name: 'Paracetamol 500 mg', genericName: 'Paracetamol', strength: '500 mg', barcode: '899123456002', categoryId: 'obat-bebas', supplierId: 'sumber-sehat', baseUnit: 'Strip', units: [unit('Strip', 8500), unit('Box', 78200, 10)], purchasePrice: 5000, price: 8500, availableStock: 68, minimumStock: 20, active: true },
  { id: 'omep', sku: '899123456003', name: 'Omeprazole 20 mg', genericName: 'Omeprazole', strength: '20 mg', barcode: '899123456003', categoryId: 'obat-resep', supplierId: 'kimia-farma', baseUnit: 'Strip', units: [unit('Strip', 12500), unit('Box', 115000, 10)], purchasePrice: 8000, price: 12500, availableStock: 8, minimumStock: 10, active: true },
  { id: 'vitc', sku: '899123456005', name: 'Vitamin C 500 mg', genericName: 'Ascorbic Acid', strength: '500 mg', barcode: '899123456005', categoryId: 'vitamin', supplierId: 'sumber-sehat', baseUnit: 'Botol', units: [unit('Botol', 26500)], purchasePrice: 18000, price: 26500, availableStock: 17, minimumStock: 10, active: true },
]
export const formatRupiah = (value: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value)

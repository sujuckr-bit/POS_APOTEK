import { createClient } from '@/lib/supabase/client'
import type { CartLine, PaymentMethod } from '@/components/pos/pos-types'

export async function persistTransaction({
  cart,
  paymentMethod,
}: {
  cart: CartLine[]
  paymentMethod: PaymentMethod
}) {
  if (cart.length === 0) throw new Error('Keranjang masih kosong.')
  if (cart.some((line) => !Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity * line.unit.conversionFactor > line.product.availableStock)) {
    throw new Error('Jumlah atau stok item tidak valid.')
  }
  const calculatedSubtotal = cart.reduce((sum, line) => sum + line.unit.price * line.quantity, 0)
  if (!Number.isFinite(calculatedSubtotal) || calculatedSubtotal <= 0) throw new Error('Total transaksi tidak valid.')

  const supabase = createClient()
  const { data: authData, error: authError } = await supabase.auth.getUser()
  if (authError) throw authError
  if (!authData.user) throw new Error('Silakan masuk sebelum menyimpan transaksi.')

  const transactionNumber = `TRX-${new Date().toISOString().slice(0, 10).replaceAll('-', '').slice(2)}-${crypto.randomUUID().slice(0, 4).toUpperCase()}`
  const { data: transaction, error: transactionError } = await supabase
    .from('transactions')
    .insert({
      transaction_number: transactionNumber,
      cashier_id: authData.user.id,
      payment_method: paymentMethod,
      subtotal: calculatedSubtotal,
      total: calculatedSubtotal,
    })
    .select('id, transaction_number')
    .single()

  if (transactionError) throw transactionError

  const { error: itemsError } = await supabase.from('transaction_items').insert(
    cart.map((line) => ({
      transaction_id: transaction.id,
      product_id: line.product.id,
      product_name: line.product.name,
      quantity: line.quantity,
      unit_price: line.unit.price,
      line_total: line.unit.price * line.quantity,
      allocations: line.allocations,
    })),
  )

  if (itemsError) throw itemsError
  return transaction
}

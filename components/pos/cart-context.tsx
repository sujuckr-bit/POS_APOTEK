'use client'

import { createContext, useContext, useState } from 'react'
import type { CartLine } from './pos-types'

type CartContextValue = {
  cart: CartLine[]
  setCart: React.Dispatch<React.SetStateAction<CartLine[]>>
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartLine[]>([])
  return <CartContext.Provider value={{ cart, setCart }}>{children}</CartContext.Provider>
}

export function useCart() {
  const value = useContext(CartContext)
  if (!value) throw new Error('useCart harus digunakan di dalam CartProvider')
  return value
}

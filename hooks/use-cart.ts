'use client';

import { useState, useEffect, useCallback } from 'react';
import { CartState, Product, CartItem } from '@/lib/types';
import { supabase } from '@/lib/supabase';

const initialState: CartState = { items: [], total: 0, itemCount: 0 };

export function useCart() {
  const [cart, setCart] = useState<CartState>(initialState);
  const [loading, setLoading] = useState(true);

  const fetchCart = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Get or create cart
      let { data: cart } = await supabase
        .from('carts')
        .select('id')
        .eq('user_id', session.user.id)
        .single();

      if (!cart) {
        const { data: newCart } = await supabase
          .from('carts')
          .insert({ user_id: session.user.id })
          .select('id')
          .single();
        cart = newCart;
      }

      // Get cart items
      const { data: items } = await supabase
        .from('cart_items')
        .select(`
          quantity,
          products (
            id,
            name,
            description,
            price,
            image,
            stock
          )
        `)
        .eq('cart_id', cart?.id);

      const cartItems: any = items?.map(item => ({
        ...item.products,
        quantity: item.quantity
      })) || [];

      setCart(calculateCartState(cartItems));
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const ensureAnonymousAuth = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      await supabase.auth.signInAnonymously().then(() => {
        fetchCart();
      });
    }
  }, [fetchCart]);

  const addToCart = async (product: Product) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Get or create cart
      let { data: cart } = await supabase
        .from('carts')
        .select('id')
        .eq('user_id', session.user.id)
        .single();

      if (!cart) {
        const { data: newCart } = await supabase
          .from('carts')
          .insert({ user_id: session.user.id })
          .select('id')
          .single();
        cart = newCart;
      }

      // Update cart item
      const { data: existingItem } = await supabase
        .from('cart_items')
        .select('quantity')
        .eq('cart_id', cart?.id)
        .eq('product_id', product.id)
        .single();

      if (existingItem) {
        await supabase
          .from('cart_items')
          .update({ quantity: existingItem.quantity + 1 })
          .eq('cart_id', cart?.id)
          .eq('product_id', product.id);
      } else {
        await supabase
          .from('cart_items')
          .insert({
            cart_id: cart?.id,
            product_id: product.id,
            quantity: 1
          });
      }

      fetchCart();
    } catch (error) {
      alert(error)
      console.error('Error adding to cart:', error);
    }
  };

  const removeFromCart = async (productId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: cart } = await supabase
        .from('carts')
        .select('id')
        .eq('user_id', session.user.id)
        .single();

      if (cart) {
        await supabase
          .from('cart_items')
          .delete()
          .eq('cart_id', cart.id)
          .eq('product_id', productId);

        fetchCart();
      }
    } catch (error) {
      console.error('Error removing from cart:', error);
    }
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    if (quantity < 0) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: cart } = await supabase
        .from('carts')
        .select('id')
        .eq('user_id', session.user.id)
        .single();

      if (cart) {
        if (quantity === 0) {
          await supabase
            .from('cart_items')
            .delete()
            .eq('cart_id', cart.id)
            .eq('product_id', productId);
        } else {
          await supabase
            .from('cart_items')
            .upsert({
              cart_id: cart.id,
              product_id: productId,
              quantity
            });
        }

        fetchCart();
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
    }
  };

  const clearCart = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: cart } = await supabase
        .from('carts')
        .select('id')
        .eq('user_id', session.user.id)
        .single();

      if (cart) {
        await supabase
          .from('cart_items')
          .delete()
          .eq('cart_id', cart.id);

        fetchCart();
      }
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  };

  const calculateCartState = (items: CartItem[]): CartState => {
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    return { items, total, itemCount };
  };

  return {
    cart,
    loading,
    addToCart,
    ensureAnonymousAuth,
    fetchCart,
    removeFromCart,
    updateQuantity,
    clearCart,
  };
}
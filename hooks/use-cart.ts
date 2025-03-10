'use client';

import { useState, useEffect, useCallback } from 'react';
import { CartState, Product, CartItem } from '@/lib/types';
import { supabase } from '@/lib/supabase';

const initialState: CartState = { items: [], total: 0, itemCount: 0 };

export function useCart() {
  const [cart, setCart] = useState<CartState>(initialState);
  const [loading, setLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return;
      }

      // Get or create cart
      let { data: cartData } = await supabase
        .from('carts')
        .select('id')
        .eq('user_id', session.user.id)
        .single();

      if (!cartData) {
        const { data: newCartData } = await supabase
          .from('carts')
          .insert({ user_id: session.user.id })
          .select('id')
          .single();
        cartData = newCartData;
      }

      if (!cartData) return;

      // Get cart items
      const { data: cartItems } = await supabase
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
        .eq('cart_id', cartData.id);

      const items: CartItem[] = (cartItems || []).map((item) => ({
        ...item.products as any,
        quantity: item.quantity,
      }));

      setCart(calculateCartState(items));
    } catch (error) {
      console.error('Error fetching cart:', error);
    }
  }, []);

  const ensureAnonymousAuth = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      await supabase.auth.signInAnonymously();
    }
    await fetchCart();
  }, [fetchCart]);

  // Add useEffect to call ensureAnonymousAuth on component mount
  useEffect(() => {
    ensureAnonymousAuth();
  }, [ensureAnonymousAuth]);

  const addToCart = async (product: Product) => {
    try {
      // Optimistically update the cart state
      const updatedItems = [...cart.items];
      const existingItemIndex = updatedItems.findIndex(item => item.id === product.id);

      if (existingItemIndex !== -1) {
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + 1
        };
      } else {
        updatedItems.push({ ...product, quantity: 1 });
      }

      setCart(calculateCartState(updatedItems));

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Get or create cart
      let { data: cartData } = await supabase
        .from('carts')
        .select('id')
        .eq('user_id', session.user.id)
        .single();

      if (!cartData) {
        const { data: newCartData } = await supabase
          .from('carts')
          .insert({ user_id: session.user.id })
          .select('id')
          .single();
        cartData = newCartData;
      }

      if (!cartData) return;

      // Update cart item
      const { data: existingItem } = await supabase
        .from('cart_items')
        .select('quantity')
        .eq('cart_id', cartData.id)
        .eq('product_id', product.id)
        .single();

      if (existingItem) {
        await supabase
          .from('cart_items')
          .update({ quantity: existingItem.quantity + 1 })
          .eq('cart_id', cartData.id)
          .eq('product_id', product.id);
      } else {
        await supabase
          .from('cart_items')
          .insert({
            cart_id: cartData.id,
            product_id: product.id,
            quantity: 1
          });
      }

      // Fetch the latest cart state from the server to ensure consistency
      fetchCart();
    } catch (error) {
      console.error('Error adding to cart:', error);
      // Revert optimistic update on error
      fetchCart();
    }
  };

  const removeFromCart = async (productId: string) => {
    try {
      // Optimistically update the cart state
      const updatedItems = cart.items.filter(item => item.id !== productId);
      setCart(calculateCartState(updatedItems));

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: cartData } = await supabase
        .from('carts')
        .select('id')
        .eq('user_id', session.user.id)
        .single();

      if (cartData) {
        await supabase
          .from('cart_items')
          .delete()
          .eq('cart_id', cartData.id)
          .eq('product_id', productId);

        fetchCart();
      }
    } catch (error) {
      console.error('Error removing from cart:', error);
      fetchCart();
    }
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    if (quantity < 0) return;

    try {
      // Optimistically update the cart state
      const updatedItems = cart.items.map(item =>
        item.id === productId ? { ...item, quantity } : item
      ).filter(item => item.quantity > 0);
      setCart(calculateCartState(updatedItems));

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: cartData } = await supabase
        .from('carts')
        .select('id')
        .eq('user_id', session.user.id)
        .single();

      if (cartData) {
        if (quantity === 0) {
          await supabase
            .from('cart_items')
            .delete()
            .eq('cart_id', cartData.id)
            .eq('product_id', productId);
        } else {
          await supabase
            .from('cart_items')
            .upsert({
              cart_id: cartData.id,
              product_id: productId,
              quantity
            });
        }

        fetchCart();
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
      fetchCart();
    }
  };

  const clearCart = async () => {
    try {
      // Optimistically clear the cart
      setCart(initialState);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: cartData } = await supabase
        .from('carts')
        .select('id')
        .eq('user_id', session.user.id)
        .single();

      if (cartData) {
        await supabase
          .from('cart_items')
          .delete()
          .eq('cart_id', cartData.id);

        fetchCart();
      }
    } catch (error) {
      console.error('Error clearing cart:', error);
      fetchCart();
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
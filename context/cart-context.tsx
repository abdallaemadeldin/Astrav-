"use client";

import {
  createContext,
  useContext,
  useCallback,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { CartState, Product, CartItem } from "@/lib/types";
import { supabase } from "@/lib/supabase";

const initialState: CartState = { items: [], total: 0, itemCount: 0 };

interface CartContextType {
  cart: CartState;
  loading: boolean;
  addToCart: (product: Product) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartState>(initialState);
  const [loading, setLoading] = useState(false);

  const calculateCartState = (items: CartItem[]): CartState => {
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const total = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    return { items, total, itemCount };
  };

  const fetchCart = useCallback(async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      let { data: cartData } = await supabase
        .from("carts")
        .select("id")
        .eq("user_id", session.user.id)
        .single();

      if (!cartData) {
        const { data: newCartData } = await supabase
          .from("carts")
          .insert({ user_id: session.user.id })
          .select("id")
          .single();
        cartData = newCartData;
      }

      if (!cartData) return;

      const { data: cartItems } = await supabase
        .from("cart_items")
        .select(
          `
          id,
          created_at,
          quantity,
          products (
            id,
            name,
            description,
            price,
            image,
            stock
          )
        `
        )
        .eq("cart_id", cartData.id)
        .order("created_at", { ascending: true });

      const items: CartItem[] = (cartItems || []).map((item) => ({
        ...(item.products as any),
        quantity: item.quantity,
      }));

      setCart(calculateCartState(items));
    } catch (error) {
      console.error("Error fetching cart:", error);
    }
  }, []);

  const ensureAnonymousAuth = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      await supabase.auth.signInAnonymously();
    }
    await fetchCart();
  }, [fetchCart]);

  useEffect(() => {
    ensureAnonymousAuth();
  }, [ensureAnonymousAuth]);

  const addToCart = async (product: Product) => {
    try {
      const updatedItems = [...cart.items];
      const existingItemIndex = updatedItems.findIndex(
        (item) => item.id === product.id
      );

      if (existingItemIndex !== -1) {
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + 1,
        };
      } else {
        updatedItems.push({ ...product, quantity: 1 });
      }

      setCart(calculateCartState(updatedItems));

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      let { data: cartData } = await supabase
        .from("carts")
        .select("id")
        .eq("user_id", session.user.id)
        .single();

      if (!cartData) {
        const { data: newCartData } = await supabase
          .from("carts")
          .insert({ user_id: session.user.id })
          .select("id")
          .single();
        cartData = newCartData;
      }

      if (!cartData) return;

      const { data: existingItem } = await supabase
        .from("cart_items")
        .select("quantity")
        .eq("cart_id", cartData.id)
        .eq("product_id", product.id)
        .single();

      if (existingItem) {
        await supabase
          .from("cart_items")
          .update({ quantity: existingItem.quantity + 1 })
          .eq("cart_id", cartData.id)
          .eq("product_id", product.id);
      } else {
        await supabase.from("cart_items").insert({
          cart_id: cartData.id,
          product_id: product.id,
          quantity: 1,
        });
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      fetchCart();
    }
  };

  const removeFromCart = async (productId: string) => {
    try {
      const updatedItems = cart.items.filter((item) => item.id !== productId);
      setCart(calculateCartState(updatedItems));

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const { data: cartData } = await supabase
        .from("carts")
        .select("id")
        .eq("user_id", session.user.id)
        .single();

      if (cartData) {
        await supabase
          .from("cart_items")
          .delete()
          .eq("cart_id", cartData.id)
          .eq("product_id", productId);
      }
    } catch (error) {
      console.error("Error removing from cart:", error);
      fetchCart();
    }
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    if (quantity < 0) return;

    try {
      const updatedItems = cart.items
        .map((item) => (item.id === productId ? { ...item, quantity } : item))
        .filter((item) => item.quantity > 0);

      setCart(calculateCartState(updatedItems));

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const { data: cartData } = await supabase
        .from("carts")
        .select("id")
        .eq("user_id", session.user.id)
        .single();

      if (cartData) {
        if (quantity === 0) {
          await supabase
            .from("cart_items")
            .delete()
            .eq("cart_id", cartData.id)
            .eq("product_id", productId);
        } else {
          const { data: existingItem } = await supabase
            .from("cart_items")
            .select("id")
            .eq("cart_id", cartData.id)
            .eq("product_id", productId)
            .single();

          if (existingItem) {
            await supabase
              .from("cart_items")
              .update({ quantity })
              .eq("cart_id", cartData.id)
              .eq("product_id", productId);
          } else {
            await supabase.from("cart_items").insert({
              cart_id: cartData.id,
              product_id: productId,
              quantity,
            });
          }
        }
      }
    } catch (error) {
      console.error("Error updating quantity:", error);
      fetchCart();
    }
  };

  const clearCart = async () => {
    try {
      setCart(initialState);

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const { data: cartData } = await supabase
        .from("carts")
        .select("id")
        .eq("user_id", session.user.id)
        .single();

      if (cartData) {
        await supabase.from("cart_items").delete().eq("cart_id", cartData.id);
      }
    } catch (error) {
      console.error("Error clearing cart:", error);
      fetchCart();
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}

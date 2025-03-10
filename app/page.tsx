"use client";

import { useEffect, useState } from "react";
import { useCart } from "@/hooks/use-cart";
import { CartSheet } from "@/components/ui/cart-sheet";
import { Button } from "@/components/ui/button";
import { Leaf, Shield, Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { formatCurrency } from "@/lib/utils";
import { Product } from "@/lib/types";

export default function Home() {
  const { addToCart, ensureAnonymousAuth } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .order("created_at", { ascending: true });

        if (error) throw error;
        setProducts(data || []);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    }
    ensureAnonymousAuth();
    fetchProducts();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <header className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-md border-b z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center">
            <img
              src="https://i.imgur.com/pd18P2J.png"
              alt="Astravé"
              className="h-12 w-auto"
              loading="eager"
            />
          </div>
          <CartSheet />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold mb-3 tracking-tight slide-up animation-delay-0">
            Astravé
          </h1>
          <p className="text-xl font-medium text-muted-foreground mb-6 slide-up animation-delay-200">
            Ignite Elegance
          </p>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed slide-up animation-delay-400">
            Discover our collection of artisanal luxury candles, meticulously
            crafted with the finest natural ingredients and rare essential oils.
            Each candle doubles as a nourishing body lotion, made with 100%
            natural ingredients that melt into a luxurious, skin-safe
            moisturizer.
          </p>
          <div className="flex justify-center gap-12 text-sm uppercase tracking-wider font-medium text-muted-foreground slide-up animation-delay-600">
            <div className="flex items-center gap-2">
              <Leaf className="w-5 h-5" />
              <span>100% Natural</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              <span>Skin Safe</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              <span>Body Lotion</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-8 max-w-xl mx-auto slide-up animation-delay-800">
            Our innovative formula transforms from a warm, aromatic candle into
            a silky-smooth body lotion, perfect for an indulgent self-care
            ritual.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 slide-up animation-delay-1000">
          {loading
            ? // Loading placeholders
              Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="bg-white rounded-xl border shadow-sm overflow-hidden animate-pulse"
                >
                  <div className="aspect-square bg-gray-200" />
                  <div className="p-6">
                    <div className="h-6 bg-gray-200 rounded mb-2" />
                    <div className="h-20 bg-gray-200 rounded mb-6" />
                    <div className="flex items-center justify-between mb-6">
                      <div className="h-6 w-20 bg-gray-200 rounded" />
                      <div className="h-4 w-16 bg-gray-200 rounded" />
                    </div>
                    <div className="h-10 bg-gray-200 rounded" />
                  </div>
                </div>
              ))
            : products.map((product) => (
                <div
                  key={product.id}
                  className="group bg-white rounded-xl border shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col"
                >
                  <div className="aspect-square overflow-hidden">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-6 flex flex-col flex-grow">
                    <h3 className="font-semibold text-xl mb-2">
                      {product.name}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {product.description}
                    </p>
                    <div className="mt-auto">
                      <div className="mt-6 flex items-center justify-between">
                        <span className="font-medium text-xl">
                          {formatCurrency(product.price)}
                        </span>
                        <span
                          className={`text-sm ${
                            product.stock > 5
                              ? "text-green-600"
                              : "text-orange-600"
                          }`}
                        >
                          {product.stock > 5 ? "In Stock" : "Low Stock"}
                        </span>
                      </div>
                      <Button
                        className="w-full mt-6 bg-[#ddcfc6] hover:bg-[#d0bfb3] text-black font-medium tracking-wide transition-all duration-300 hover:shadow-md"
                        onClick={() => addToCart(product)}
                      >
                        Add to Cart
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
        </div>
      </main>
    </div>
  );
}

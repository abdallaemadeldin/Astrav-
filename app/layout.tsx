import { CartProvider } from "@/context/cart-context";
import "./globals.css";
import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { StrictMode } from "react";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Astravé | Luxury Candles",
  description: "Discover our collection of hand-crafted luxury candles",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={poppins.className}>
        <StrictMode>
          <CartProvider>{children}</CartProvider>
        </StrictMode>
      </body>
    </html>
  );
}

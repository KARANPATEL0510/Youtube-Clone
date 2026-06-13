import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/header";
import Sidebar from "@/components/sidebar";
import CategoryTab from "@/components/category-tab";
import CallManager from "@/components/call-manager";
import { AuthProvider } from "@/lib/contexts/auth-context";
import { CategoryProvider } from "@/lib/contexts/category-context";
import { ThemeLocationProvider } from "@/lib/contexts/theme-location-context";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "YouTube Clone"
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeLocationProvider>
          <AuthProvider>
            <CategoryProvider>
              <Header />
              <div className="flex">
                <Sidebar />
                <main className="flex-1 mt-14 min-w-0 transition-all duration-300">
                  <CategoryTab />
                  <div className="p-4">
                    {children}
                  </div>
                </main>
              </div>
              <CallManager />
            </CategoryProvider>
          </AuthProvider>
        </ThemeLocationProvider>
      </body>
    </html>
  );
}
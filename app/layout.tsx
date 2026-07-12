import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const isDev = process.env.NODE_ENV === "development";

export const metadata: Metadata = {
  title: "Relatório de Serviços",
  description: "Sistema de relatórios e orçamentos para serviços de desentupimento",
  ...(isDev
    ? {}
    : {
        manifest: "/manifest.json",
        appleWebApp: {
          capable: true,
          statusBarStyle: "default",
          title: "Relatórios",
        },
      }),
};

export const viewport: Viewport = {
  themeColor: "#0369a1",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${geist.variable} h-full antialiased`}>
      <head>
        {isDev && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
                if ('serviceWorker' in navigator) {
                  navigator.serviceWorker.getRegistrations().then(function(regs) {
                    regs.forEach(function(r) { r.unregister(); });
                  });
                }
                if ('caches' in window) {
                  caches.keys().then(function(keys) {
                    keys.forEach(function(k) { caches.delete(k); });
                  });
                }
              `,
            }}
          />
        )}
      </head>
      <body className="min-h-full">
        {children}
        {!isDev && <ServiceWorkerRegister />}
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import "./globals.css";
import PWAInstaller from "@/components/PWAInstaller";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://atsc-match-beta.vercel.app'),
  title: "Andes Talleres Futsal | Entradas Oficiales",
  description: "Comprá tus entradas online para los partidos de Andes Talleres Futsal. Mendoza, Argentina. #SomosTalleres #ElMatador",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/Talleres_Futsal.png",
    shortcut: "/Talleres_Futsal.png",
    apple: "/Talleres_Futsal.png",
  },
  openGraph: {
    title: "Andes Talleres Futsal | Venta de Entradas",
    description: "Comprá tus entradas online con QR para los partidos de Andes Talleres Futsal.",
    type: "website",
    images: ["/Talleres_Futsal.png"],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#070B19" },
    { media: "(prefers-color-scheme: light)", color: "#F3F4F8" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        {/* Anti-FOUC script for instantaneous theme loading */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('theme');
                  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  var theme = saved ? saved : (prefersDark ? 'dark' : 'dark');
                  document.documentElement.classList.add(theme);
                  document.documentElement.setAttribute('data-theme', theme);
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-dvh flex flex-col antialiased selection:bg-rose-500 selection:text-white">
        {/* Atmospheric lighting layers */}
        <div className="stadium-bg" />
        <div className="court-pattern" />

        {/* Content container */}
        <div className="relative z-10 flex flex-col min-h-dvh">
          {children}
        </div>

        {/* PWA prompt */}
        <PWAInstaller />
      </body>
    </html>
  );
}

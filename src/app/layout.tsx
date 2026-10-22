import type { Metadata, Viewport } from "next";
import "./globals.css";
import PWAInstaller from "@/components/PWAInstaller";

export const metadata: Metadata = {
  title: "Andes Talleres Futsal | Entradas",
  description: "Comprá tus entradas para los partidos de Andes Talleres Futsal. Mendoza, Argentina. #SomosTalleres #SomosFamilia",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icons/icon-192.svg",
    apple: "/icons/icon-192.svg",
  },
  openGraph: {
    title: "Andes Talleres Futsal | Entradas",
    description: "Comprá tus entradas online para los partidos de Andes Talleres Futsal.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0A1230",
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
    <html lang="es">
      <body className="min-h-dvh">
        {/* Stadium lights background */}
        <div className="stadium-bg" />
        <div className="court-pattern" />

        {/* App content */}
        <div className="relative z-10 flex flex-col min-h-dvh">
          {children}
        </div>

        {/* PWA installer prompt */}
        <PWAInstaller />
      </body>
    </html>
  );
}


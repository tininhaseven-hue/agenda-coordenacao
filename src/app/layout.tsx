import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Image from "next/image";
import "./globals.css";
import logoImg from "../../public/logo.png";

const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

export const metadata: Metadata = {
  title: "Agenda de Coordenação | Ibersol",
  description: "Task Manager de Rotinas para Coordenação",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-PT">
      <body className={inter.className}>
        <div className="container">
          <header className="mb-6 no-print header-with-logo">
            <Image 
              src={logoImg} 
              alt="Logotipo ANA" 
              width={64} 
              height={64} 
              className="app-logo"
              priority
            />
            <div className="header-text-content">
              <h1 className="page-title">
                Agenda de Coordenação <span style={{ fontSize: '0.6em', opacity: 0.8, marginLeft: '0.5rem', fontWeight: 600 }}>Ana Neves</span>
              </h1>
              <p className="page-subtitle">Gestão Diária de Rotinas</p>
            </div>
          </header>
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}

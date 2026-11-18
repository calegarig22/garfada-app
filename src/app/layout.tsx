import type { Metadata, Viewport } from "next";
import { Big_Shoulders, Permanent_Marker, Schibsted_Grotesk } from "next/font/google";
import "./globals.css";

// Fontes: Big Shoulders (letreiro, títulos) + Schibsted Grotesk (texto)
// + Permanent Marker (pincel atômico, só nas plaquinhas de nota)
const bigShoulders = Big_Shoulders({
  variable: "--font-big-shoulders",
  subsets: ["latin"],
  axes: ["opsz"],
});
const schibsted = Schibsted_Grotesk({
  variable: "--font-schibsted",
  subsets: ["latin"],
});
const permanentMarker = Permanent_Marker({
  variable: "--font-permanent-marker",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: { default: "Garfada", template: "%s · Garfada" },
  description: "Descubra, avalie e guarde seus restaurantes favoritos.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover", // usa a tela inteira em celulares com "notch"
  // Cor da barra do navegador no celular = verde-garrafa do topo (token --accent)
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#1e5a3c" },
    { media: "(prefers-color-scheme: dark)", color: "#133a27" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${bigShoulders.variable} ${schibsted.variable} ${permanentMarker.variable} h-full`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}

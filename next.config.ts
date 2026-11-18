import type { NextConfig } from "next";

// Configuração do Next.js.
// Desliguei "cacheComponents" e "partialPrefetching" (recursos novos e avançados de cache)
// para o app se comportar do jeito clássico: cada página é montada na hora do pedido.
// Isso deixa o login mais simples. Dá para ligar depois, se precisarmos de velocidade extra.
const nextConfig: NextConfig = {
  // Formulários com até 4 fotos (o navegador comprime cada uma para ~300 KB).
  experimental: {
    serverActions: { bodySizeLimit: "4mb" },
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;

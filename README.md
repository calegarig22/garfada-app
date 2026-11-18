# Garfada

App web mobile-first de avaliação de restaurantes: descoberta por fotos e coleções (estilo Pinterest) com diário, notas e perfil (estilo Letterboxd).

## O que faz
- Explorar restaurantes em mosaico, com busca, ordenação e filtros (tipo de comida, preço, distância de 1 a 50+ km, estação de metrô mais próxima em SP).
- Avaliar com estrelas (meia estrela), texto e fotos; editar a própria avaliação e os próprios comentários.
- Parte social: perfis, seguir, curtir, comentar e notificações.
- Salvos: "Quero ir", favoritos e listas/coleções públicas ou privadas.
- Cadastro de lugares com busca no Google Places, pino ajustável no mapa e aviso de duplicados; redes com várias unidades.
- Área de administração para corrigir pinos reportados.

## Destaques técnicos
- Next.js (App Router) com Server Actions e TypeScript em todo o projeto.
- Auth.js com Google OAuth, link mágico por e-mail (Resend) e login por senha (scrypt + sal, `timingSafeEqual`).
- Postgres com Drizzle ORM e migrations versionadas; busca tolerante a erros com `pg_trgm` + `unaccent`; nota média mantida por trigger.
- Fotos em armazenamento S3-compatível (Backblaze B2, Cloudflare R2, MinIO) com balde privado e URLs assinadas temporárias.
- Fallback de imagens: fotos livres da Wikimedia Commons com crédito, foto do Google Places e foto ilustrativa por tipo de cozinha.
- Mapas com Leaflet/OpenStreetMap e geocodificação via Nominatim; design system baseado em tokens (`DESIGN_SYSTEM.md`).

## Stack
Next.js 16 · React 19 · TypeScript · Tailwind CSS 4 · Auth.js (next-auth v5) · Drizzle ORM · Postgres (Neon serverless) · AWS SDK S3 · Leaflet · Zod · pnpm

## Como rodar
1. `cp .env.example .env.local` e preencha (veja os comentários no arquivo; S3, Resend e Google Places são opcionais).
2. `pnpm install`
3. `npx auth secret` para gerar o `AUTH_SECRET`.
4. `pnpm db:migrate` para criar as tabelas.
5. `pnpm dev` e abra http://localhost:3000

Para o login com Google, cadastre `http://localhost:3000/api/auth/callback/google` como URI de redirecionamento no Google Cloud Console.

Dados de teste opcionais: `node scripts/seed-teste.mjs` cria contas fictícias (`@garfada.test`) com avaliações; `node scripts/limpar-teste.mjs` remove tudo.

| Comando | O que faz |
|---|---|
| `pnpm dev` | servidor de desenvolvimento |
| `pnpm db:generate` | gera migration após mudar `src/db/schema.ts` |
| `pnpm db:migrate` | aplica as migrations |
| `pnpm typecheck` / `pnpm lint` | checagens de tipo e lint |

## Estrutura
```
src/
  app/(app)/     telas com barra de abas (explorar, social, salvos, perfil, restaurantes, admin…)
  app/entrar/    login; bem-vindo/ escolha do @username; api/auth/ callbacks do Auth.js
  components/    componentes reutilizáveis (cartões, carrossel, mapas, estrelas…)
  lib/           regras de negócio (restaurantes, social, listas, storage, geo, Google Places)
  db/            schema Drizzle e conexão
  data/          estações de metrô de SP
drizzle/         migrations SQL (inclui seed de cozinhas e restaurantes de SP)
scripts/         seed e limpeza de dados de teste
```

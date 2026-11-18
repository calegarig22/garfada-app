// ─────────────────────────────────────────────────────────────
// LOGIN (Auth.js). Aqui ficam os "provedores" (jeitos de entrar):
// - e-mail e senha: sempre;
// - Google: só quando AUTH_GOOGLE_ID e AUTH_GOOGLE_SECRET existem;
// - link mágico por e-mail: só quando o Resend está configurado.
// A sessão fica num cookie assinado e criptografado (JWT), porque o
// login por senha do Auth.js só funciona assim.
// ─────────────────────────────────────────────────────────────
import NextAuth from "next-auth";
import type { Provider } from "next-auth/providers";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { accounts, sessions, users, verificationTokens } from "@/db/schema";
import { DUMMY_HASH, verifyPassword } from "@/lib/password";

export const googleEnabled = Boolean(
  process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET,
);

/** O link mágico só liga quando as duas variáveis do Resend existem. */
export const magicLinkEnabled = Boolean(
  process.env.AUTH_RESEND_KEY && process.env.EMAIL_FROM,
);

const providers: Provider[] = [
  Credentials({
    id: "senha",
    credentials: { email: {}, password: {} },
    async authorize(credentials) {
      const email = String(credentials?.email ?? "").trim().toLowerCase();
      const password = String(credentials?.password ?? "");
      if (!email || !password) return null;

      const user = await db.query.users.findFirst({
        where: sql`lower(${users.email}) = ${email}`,
      });
      // Confere sempre (com hash falso se o e-mail não existe) para gastar o mesmo tempo.
      const ok = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH).catch(() => false);
      if (!user || !ok) {
        await new Promise((r) => setTimeout(r, 700)); // freia quem tenta adivinhar senhas
        return null;
      }
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        username: user.username,
      };
    },
  }),
];
if (googleEnabled) providers.push(Google);
if (magicLinkEnabled) providers.push(Resend({ from: process.env.EMAIL_FROM }));

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  session: { strategy: "jwt" },
  providers,
  pages: {
    signIn: "/entrar",
    verifyRequest: "/entrar/verifique",
    error: "/entrar",
  },
  callbacks: {
    // Roda ao entrar e a cada visita: guarda id e @username no cookie.
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.username = user.username ?? null;
      }
      // A cada visita conferimos no banco (como no BuscaJob): conta apagada
      // sai na hora, e o @ escolhido em /bem-vindo já entra no cookie.
      if (token.sub) {
        const row = await db.query.users.findFirst({
          where: eq(users.id, token.sub),
          columns: { username: true },
        });
        if (!row) return null; // conta apagada: sai do login
        token.username = row.username;
      }
      return token;
    },
    // Acrescenta id e @username nos dados da sessão, para as telas usarem.
    session({ session, token }) {
      session.user.id = token.sub!;
      session.user.username = typeof token.username === "string" ? token.username : null;
      return session;
    },
  },
});

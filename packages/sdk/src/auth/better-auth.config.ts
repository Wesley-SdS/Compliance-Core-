import { betterAuth } from 'better-auth';
import { nextCookies } from 'better-auth/next-js';
import { magicLink } from 'better-auth/plugins';
import { organization } from 'better-auth/plugins';
import { Pool } from 'pg';

export interface SendEmailParams {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export type SendEmailFn = (params: SendEmailParams) => Promise<void>;

export interface BetterAuthOptions {
  pool: Pool;
  sendEmail?: SendEmailFn;
}

export function createBetterAuthInstance(options: BetterAuthOptions) {
  const { pool, sendEmail } = options;

  return betterAuth({
    database: new Pool(pool.options),
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: process.env.BETTER_AUTH_URL,
    emailAndPassword: {
      enabled: true,
      sendResetPassword: sendEmail
        ? async ({ user, url }) => {
            void sendEmail({
              to: user.email,
              subject: 'Redefinir sua senha — ComplianceCore',
              text: `Clique no link para redefinir sua senha: ${url}`,
              html: `<p>Clique <a href="${url}">aqui</a> para redefinir sua senha.</p>`,
            });
          }
        : undefined,
      resetPasswordTokenExpiresIn: 3600,
    },
    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID || '',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
        enabled: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
      },
      github: {
        clientId: process.env.GITHUB_CLIENT_ID || '',
        clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
        enabled: !!(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET),
      },
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
    },
    plugins: [
      magicLink({
        sendMagicLink: sendEmail
          ? async ({ email, url }) => {
              void sendEmail({
                to: email,
                subject: 'Seu link de acesso — ComplianceCore',
                text: `Clique no link para acessar: ${url}`,
                html: `<p>Clique <a href="${url}">aqui</a> para acessar sua conta.</p>`,
              });
            }
          : async () => {
              console.warn('[BetterAuth] sendEmail not configured — magic link not sent');
            },
        expiresIn: 300,
      }),
      organization({
        allowUserToCreateOrganization: true,
        creatorRole: 'owner',
        membershipLimit: 100,
      }),
      nextCookies(),
    ],
  });
}

export type BetterAuthInstance = ReturnType<typeof createBetterAuthInstance>;

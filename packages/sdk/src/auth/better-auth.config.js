"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBetterAuthInstance = createBetterAuthInstance;
const better_auth_1 = require("better-auth");
const next_js_1 = require("better-auth/next-js");
const plugins_1 = require("better-auth/plugins");
const plugins_2 = require("better-auth/plugins");
const pg_1 = require("pg");
function createBetterAuthInstance(options) {
    const { pool, sendEmail } = options;
    return (0, better_auth_1.betterAuth)({
        database: new pg_1.Pool(pool.options),
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
            (0, plugins_1.magicLink)({
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
            (0, plugins_2.organization)({
                allowUserToCreateOrganization: true,
                creatorRole: 'owner',
                membershipLimit: 100,
            }),
            (0, next_js_1.nextCookies)(),
        ],
    });
}
//# sourceMappingURL=better-auth.config.js.map
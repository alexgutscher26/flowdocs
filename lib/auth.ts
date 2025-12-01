import { createHash } from "crypto";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { admin, magicLink } from "better-auth/plugins";
import { sendPasswordResetEmail, sendMagicLinkEmail } from "@/app/actions/email";
import { indexUser } from "@/lib/search";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });
export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          // Generate Gravatar URL if no image is provided
          let image = user.image;
          if (!image && user.email) {
            const emailHash = createHash("md5")
              .update(user.email.toLowerCase().trim())
              .digest("hex");
            image = `https://www.gravatar.com/avatar/${emailHash}?d=mp`;
          }

          const userCount = await prisma.user.count();
          const data = {
            ...user,
            image: image || user.image,
          };

          if (userCount === 0) {
            return {
              data: {
                ...data,
                role: "admin",
              },
            };
          }
          return { data };
        },
        after: async (user) => {
          await indexUser(user);
        },
      },
    },
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        input: false, // Don't allow users to set their own role
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url, token }) => {
      // Send password reset email using our email service
      await sendPasswordResetEmail(
        {
          firstName: user.name?.split(" ")[0] || "there",
          resetUrl: url,
          expiresInMinutes: 60, // 1 hour
        },
        user.email
      );
    },
    resetPasswordTokenExpiresIn: 3600, // 1 hour in seconds
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      scope: ["https://www.googleapis.com/auth/drive.readonly"],
      accessType: "offline",
      prompt: "consent",
    },
  },
  plugins: [
    nextCookies(),
    admin({
      adminRoles: ["admin"],
      impersonationSessionDuration: 60 * 60, // 1 hour
    }),
    magicLink({
      sendMagicLink: async ({ email, token, url }, request) => {
        await sendMagicLinkEmail(
          {
            firstName: "there",
            magicLinkUrl: url,
            expiresInMinutes: 10,
          },
          email
        );
      },
    }),
  ],
});

"use client";

import { AuthUIProvider } from "@daveyplate/better-auth-ui";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { ThemeProvider } from "@/components/common/theme-provider";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { authClient } from "@/lib/auth/auth-client";
import { getPublicEnv } from "./public-env";
import { ApiError } from "@/lib/api-error";

export function Providers({ children }: { children: ReactNode }) {
  const env = getPublicEnv();
  const router = useRouter();
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
            retry: (failureCount, error) => {
              if (failureCount >= 3) return false;
              if (error instanceof ApiError) {
                // Don't retry for unauthorized or not found (access denied)
                if ([401, 403, 404].includes(error.status)) {
                  return false;
                }
              }
              return true;
            },
          },
        },
      })
  );

  return (
    <NuqsAdapter>
      <QueryClientProvider client={queryClient}>
        <AuthUIProvider
          authClient={authClient}
          navigate={router.push}
          replace={router.replace}
          onSessionChange={() => {
            // Clear router cache (protected routes)
            router.refresh();
          }}
          Link={Link}
          redirectTo="/projects"
          emailVerification={env.REQUIRE_EMAIL_VERIFICATION === "true"}
          avatar
          genericOAuth={
            env.OPENID_NAME && env.OPENID_ID
              ? {
                  providers: [
                    {
                      name: env.OPENID_NAME,
                      provider: env.OPENID_ID,
                    },
                  ],
                }
              : undefined
          }
          signUp={env.DISABLE_SIGN_UP !== "true"}
          credentials={env.DISABLE_EMAIL_PASSWORD_AUTH !== "true"}
        >
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </AuthUIProvider>
      </QueryClientProvider>
    </NuqsAdapter>
  );
}

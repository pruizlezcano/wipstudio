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

export function Providers({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
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
          viewPaths={{
            SIGN_IN: "login",
            SIGN_OUT: "logout",
            SIGN_UP: "register",
          }}
          emailVerification={
            process.env.NEXT_PUBLIC_REQUIRE_EMAIL_VERIFICATION === "true"
          }
          avatar
          genericOAuth={
            process.env.NEXT_PUBLIC_OPENID_NAME &&
            process.env.NEXT_PUBLIC_OPENID_ID
              ? {
                  providers: [
                    {
                      name: process.env.NEXT_PUBLIC_OPENID_NAME,
                      provider: process.env.NEXT_PUBLIC_OPENID_ID,
                    },
                  ],
                }
              : undefined
          }
          signUp={process.env.NEXT_PUBLIC_DISABLE_SIGN_UP !== "true"}
          credentials={
            process.env.NEXT_PUBLIC_DISABLE_EMAIL_PASSWORD_AUTH !== "true"
          }
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

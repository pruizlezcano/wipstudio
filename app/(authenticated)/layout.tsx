import { RedirectToSignIn, SignedIn } from "@daveyplate/better-auth-ui";

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <RedirectToSignIn />
      <SignedIn>{children}</SignedIn>
    </>
  );
}

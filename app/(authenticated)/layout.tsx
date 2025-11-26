import { RedirectToSignIn, SignedIn } from "@daveyplate/better-auth-ui";
import NavBar from "@/components/common/nav-bar";

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <RedirectToSignIn />
      <SignedIn>
        <div className="min-h-screen flex flex-col">
          <NavBar />
          <main className="flex-1">{children}</main>
        </div>
      </SignedIn>
    </>
  );
}

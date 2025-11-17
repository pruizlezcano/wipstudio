import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background font-sans">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 sm:items-start">
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-foreground">
            Welcome to the Backstage.
          </h1>
          <p className="max-w-md text-lg leading-8 text-muted-foreground">
            Lorem ipsum dolor sit amet consectetur, adipisicing elit. Ex
            temporibus excepturi vel cum quaerat minima obcaecati adipisci illo
            odio. Molestias voluptate deserunt excepturi ducimus, modi
            cupiditate ut possimus architecto rem.
          </p>
        </div>
        <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
          <Link
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] md:w-[158px]"
            href="/auth/login"
          >
            Log In
          </Link>
          <Link
            className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-black/8 px-5 transition-colors hover:border-transparent hover:bg-black/4 dark:border-white/[.145] dark:hover:bg-[#1a1a1a] md:w-[158px]"
            href="/auth/register"
          >
            Sign Up
          </Link>
        </div>
      </main>
    </div>
  );
}

"use client";

import { authClient, type Session } from "@/lib/auth/auth-client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function UserPage() {
  const [user, setUser] = useState<Session["user"] | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const session = await authClient.getSession();
      if (!session.data) {
        router.push("/login");
      } else {
        setUser(session.data.user);
        setLoading(false);
      }
    };
    checkAuth();
  }, [router]);

  const handleSignout = async () => {
    await authClient.signOut();
    router.push("/login");
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>User Profile</h1>
      {user && (
        <div>
          <p>
            <strong>Name:</strong> {user.name}
          </p>
          <p>
            <strong>Email:</strong> {user.email}
          </p>
          <p>
            <strong>ID:</strong> {user.id}
          </p>
        </div>
      )}
      <button onClick={handleSignout}>Sign Out</button>
    </div>
  );
}

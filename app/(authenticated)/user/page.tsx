import { AccountSettingsCards } from "@daveyplate/better-auth-ui";

export default function UserPage() {
  return (
    <div className="container mx-auto py-12 px-4">
      <h1 className="text-2xl font-bold mb-6">User Profile</h1>
      <AccountSettingsCards />
    </div>
  );
}

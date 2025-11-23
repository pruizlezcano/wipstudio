import {
  AccountSettingsCards,
  ChangePasswordCard,
  DeleteAccountCard,
  SessionsCard,
} from "@daveyplate/better-auth-ui";

export default function UserPage() {
  return (
    <div className="container mx-auto py-12 max-w-6xl px-6 min-h-screen flex flex-col gap-4 md:gap-6">
      <h1 className="text-2xl font-bold mb-6 uppercase tracking-tighter">
        User Profile
      </h1>
      <AccountSettingsCards
        classNames={{
          card: {
            footer: "sm:flex-row flex-col",
            button: "w-full sm:w-auto",
          },
        }}
      />
      <ChangePasswordCard
        classNames={{
          footer: "sm:flex-row flex-col",
          button: "w-full sm:w-auto",
        }}
      />
      <SessionsCard />
      <DeleteAccountCard
        localization={{
          DELETE_ACCOUNT_DESCRIPTION:
            "This action permanently deletes your account and is irreversible. All you projects and comments will be lost. Please proceed with caution.",
        }}
      />
    </div>
  );
}

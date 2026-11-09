"use client";

import { useRouter } from "next/navigation";

export default function AdminSignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      className="text-sm text-foreground-muted underline underline-offset-2 hover:text-brand"
    >
      Sign out
    </button>
  );
}

"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();
  return (
    <button
      onClick={async () => { await fetch("/api/admin/logout", { method: "POST" }); router.push("/admin/login"); }}
      className="mt-2 block text-xs text-red-800 underline hover:text-red-900"
    >
      Sign out
    </button>
  );
}

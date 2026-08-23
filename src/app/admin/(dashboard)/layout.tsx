import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import LogoutButton from "@/components/admin/LogoutButton";

export const dynamic = "force-dynamic";

const LINKS = [
  ["/admin", "Dashboard"],
  ["/admin/products", "Products"],
  ["/admin/categories", "Categories"],
  ["/admin/orders", "Orders"],
] as const;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "SUPERADMIN")) redirect("/admin/login");

  return (
    <div className="mx-auto flex w-[96%] max-w-7xl gap-6 py-8">
      <aside className="hidden w-52 shrink-0 md:block">
        <p className="font-display text-lg font-bold text-maroon">॥ Admin</p>
        <nav className="mt-4 space-y-1 text-sm">
          {LINKS.map(([href, label]) => (
            <Link key={href} href={href} className="block rounded-xl px-3 py-2 text-muted hover:bg-gold/10 hover:text-maroon">
              {label}
            </Link>
          ))}
        </nav>
        <div className="mt-6 border-t border-gold/20 pt-4 text-xs text-muted">
          {session.email}
          <LogoutButton />
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <nav className="mb-4 flex gap-2 overflow-x-auto md:hidden">
          {LINKS.map(([href, label]) => (
            <Link key={href} href={href} className="whitespace-nowrap rounded-full border border-gold/50 px-4 py-1.5 text-sm text-maroon">{label}</Link>
          ))}
        </nav>
        {children}
      </div>
    </div>
  );
}

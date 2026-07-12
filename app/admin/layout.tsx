"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Users,
  UserCog,
  Wrench,
  FileText,
  Receipt,
  Settings,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { EmpresaSetupBanner } from "@/components/empresa/EmpresaSetupBanner";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/usuarios", label: "Usuários", icon: UserCog },
  { href: "/admin/clientes", label: "Clientes", icon: Users },
  { href: "/admin/catalogo", label: "Catálogo", icon: Wrench },
  { href: "/admin/relatorios", label: "Relatórios", icon: FileText },
  { href: "/admin/orcamentos", label: "Orçamentos", icon: Receipt },
  { href: "/admin/configuracoes", label: "Configurações", icon: Settings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ nome: string } | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.user?.role !== "ADMIN") {
          router.push("/campo");
        } else {
          setUser(d.user);
        }
      });
  }, [router]);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 flex-col bg-slate-900 text-white md:flex">
        <div className="border-b border-slate-700 p-4">
          <h1 className="font-bold">Relatórios</h1>
          <p className="text-xs text-slate-400">{user?.nome}</p>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  pathname === item.href
                    ? "bg-primary text-white"
                    : "text-slate-300 hover:bg-slate-800"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <button
          onClick={logout}
          className="flex items-center gap-3 border-t border-slate-700 p-4 text-sm text-slate-400 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </button>
      </aside>

      <div className="flex-1">
        <header className="flex items-center justify-between border-b bg-white px-4 py-3 md:hidden">
          <h1 className="font-semibold">Admin</h1>
          <button onClick={logout}>
            <LogOut className="h-5 w-5" />
          </button>
        </header>

        <nav className="flex overflow-x-auto border-b bg-white px-2 py-1 md:hidden">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium",
                pathname === item.href
                  ? "bg-primary text-white"
                  : "text-slate-600"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <main className="p-4 md:p-6">
          <EmpresaSetupBanner />
          {children}
        </main>
      </div>
    </div>
  );
}

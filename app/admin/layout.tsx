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
  Menu,
  X,
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

function NavLinks({
  pathname,
  onNavigate,
  className,
}: {
  pathname: string;
  onNavigate?: () => void;
  className?: string;
}) {
  return (
    <nav className={cn("flex-1 space-y-1 p-3", className)}>
      {navItems.map((item) => {
        const Icon = item.icon;
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
              active
                ? "bg-primary text-white"
                : "text-slate-300 hover:bg-slate-800"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ nome: string } | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

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

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const currentLabel =
    navItems.find(
      (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
    )?.label ?? "Admin";

  return (
    <div className="flex min-h-screen min-h-dvh">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col bg-slate-900 text-white md:flex">
        <div className="border-b border-slate-700 p-4">
          <h1 className="font-bold">Relatórios</h1>
          <p className="text-xs text-slate-400">{user?.nome}</p>
        </div>
        <NavLinks pathname={pathname} />
        <button
          onClick={logout}
          className="flex items-center gap-3 border-t border-slate-700 p-4 text-sm text-slate-400 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </button>
      </aside>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Fechar menu"
            className="absolute inset-0 bg-black/50"
            onClick={() => setMenuOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-[min(18rem,85vw)] flex-col bg-slate-900 text-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-700 p-4">
              <div>
                <h1 className="font-bold">Relatórios</h1>
                <p className="text-xs text-slate-400">{user?.nome}</p>
              </div>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="rounded-lg p-2 text-slate-300 hover:bg-slate-800"
                aria-label="Fechar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <NavLinks pathname={pathname} onNavigate={() => setMenuOpen(false)} />
            <button
              onClick={logout}
              className="flex items-center gap-3 border-t border-slate-700 p-4 text-sm text-slate-400 hover:text-white"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </button>
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b bg-white/95 px-3 py-3 backdrop-blur md:hidden supports-[backdrop-filter]:bg-white/80">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="rounded-lg p-2 hover:bg-slate-100"
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1 text-center">
            <p className="truncate text-sm font-semibold">{currentLabel}</p>
            {user?.nome && (
              <p className="truncate text-xs text-muted">{user.nome}</p>
            )}
          </div>
          <button
            type="button"
            onClick={logout}
            className="rounded-lg p-2 hover:bg-slate-100"
            aria-label="Sair"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </header>

        <main className="min-w-0 flex-1 overflow-x-hidden p-3 sm:p-4 md:p-6">
          <EmpresaSetupBanner />
          {children}
        </main>
      </div>
    </div>
  );
}

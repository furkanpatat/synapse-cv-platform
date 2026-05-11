"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import { authApi } from "@/lib/auth-api";
import { Button } from "./ui/Button";

interface NavProps {
  title: string;
  links?: { href: string; label: string }[];
}

export function Nav({ title, links = [] }: NavProps) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const clear = useAuthStore((s) => s.clear);

  const handleLogout = async () => {
    if (refreshToken) {
      try {
        await authApi.logout(refreshToken);
      } catch {
        // proceed even if backend rejects
      }
    }
    clear();
    router.replace("/login");
  };

  return (
    <header className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-lg font-bold text-brand">
            CV Platform
          </Link>
          <span className="text-sm text-gray-500">{title}</span>
          <nav className="ml-6 flex gap-4 text-sm">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-gray-700 hover:text-brand dark:text-gray-300"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          {user && (
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {user.firstName} {user.lastName} · {user.role}
            </span>
          )}
          <Button variant="ghost" onClick={handleLogout}>
            Çıkış
          </Button>
        </div>
      </div>
    </header>
  );
}

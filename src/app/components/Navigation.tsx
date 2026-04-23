'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import Image from 'next/image';

export default function Navigation() {
  const { data: session } = useSession();
  const pathname = usePathname();

  if (!session || pathname === '/login') {
    return null;
  }

  return (
    <nav style={{ backgroundColor: '#2f2f30' }} className="text-white shadow">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo and Company Name */}
        <Link href="/customers" className="flex items-center gap-3 hover:opacity-90">
          <Image
            src="/logo.jpg"
            alt="Platinum Installs"
            width={40}
            height={40}
            className="rounded-sm"
          />
          <span className="font-bold text-lg" style={{ letterSpacing: '0.8px' }}>
            PLATINUM INSTALLS
          </span>
        </Link>

        {/* Nav Links */}
        <div className="flex items-center gap-6">
          <Link
            href="/customers"
            className={`font-medium transition ${pathname.includes('/customers') ? 'text-white' : 'text-gray-300 hover:text-white'}`}
          >
            Customers
          </Link>
          <Link
            href="/admin"
            className={`font-medium transition ${pathname.includes('/admin') ? 'text-white' : 'text-gray-300 hover:text-white'}`}
          >
            Admin
          </Link>

          {/* Logout Button */}
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="px-4 py-2 text-sm text-gray-300 hover:text-white transition"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}

'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { useState } from 'react';

export default function Navigation() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  if (!session || pathname === '/login') {
    return null;
  }

  const linkClass = (path: string) =>
    `block font-medium transition py-2 ${pathname.includes(path) ? 'text-white' : 'text-gray-300 hover:text-white'}`;

  return (
    <nav style={{ backgroundColor: '#2f2f30' }} className="text-white shadow">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo and Company Name */}
        <Link href="/customers" className="flex items-center gap-3 hover:opacity-90">
          <Image
            src="/logo.jpg"
            alt="Platinum Installs"
            width={36}
            height={36}
            className="rounded-sm"
          />
          <span className="font-bold text-base" style={{ letterSpacing: '0.8px' }}>
            PLATINUM INSTALLS
          </span>
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center gap-6">
          <Link href="/customers" className={`font-medium transition ${pathname.includes('/customers') ? 'text-white' : 'text-gray-300 hover:text-white'}`}>
            Customers
          </Link>
          <Link href="/inquiries" className={`font-medium transition ${pathname.includes('/inquiries') ? 'text-white' : 'text-gray-300 hover:text-white'}`}>
            Inquiries
          </Link>
          <Link href="/admin" className={`font-medium transition ${pathname.includes('/admin') ? 'text-white' : 'text-gray-300 hover:text-white'}`}>
            Admin
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="px-4 py-2 text-sm text-gray-300 hover:text-white transition"
          >
            Logout
          </button>
        </div>

        {/* Mobile Hamburger */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden flex flex-col justify-center gap-1.5 p-2 rounded"
          aria-label="Toggle menu"
        >
          <span className={`block w-6 h-0.5 bg-white transition-transform ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
          <span className={`block w-6 h-0.5 bg-white transition-opacity ${menuOpen ? 'opacity-0' : ''}`} />
          <span className={`block w-6 h-0.5 bg-white transition-transform ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
        </button>
      </div>

      {/* Mobile Dropdown Menu */}
      {menuOpen && (
        <div className="md:hidden px-4 pb-4 border-t border-gray-600 mt-1">
          <Link href="/customers" className={linkClass('/customers')} onClick={() => setMenuOpen(false)}>
            Customers
          </Link>
          <Link href="/inquiries" className={linkClass('/inquiries')} onClick={() => setMenuOpen(false)}>
            Inquiries
          </Link>
          <Link href="/admin" className={linkClass('/admin')} onClick={() => setMenuOpen(false)}>
            Admin
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="block w-full text-left font-medium text-gray-300 hover:text-white transition py-2"
          >
            Logout
          </button>
        </div>
      )}
    </nav>
  );
}

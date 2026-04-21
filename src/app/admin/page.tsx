"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect } from "react";

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") return <div className="p-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Admin Panel</h1>
          <div className="space-x-4">
            <Link href="/customers" className="text-blue-600 hover:underline">
              Back to Customers
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-8">
        <h2 className="text-3xl font-bold mb-8">Manage Estimate Options</h2>

        <div className="grid grid-cols-2 gap-6">
          <Link
            href="/admin/sections"
            className="block bg-white p-6 rounded-lg shadow hover:shadow-lg transition"
          >
            <h3 className="text-xl font-bold mb-2">Sections</h3>
            <p className="text-gray-600">Manage estimate sections (e.g., Base Coat, Design)</p>
            <div className="mt-4 text-blue-600">→ Manage</div>
          </Link>

          <Link
            href="/admin/products"
            className="block bg-white p-6 rounded-lg shadow hover:shadow-lg transition"
          >
            <h3 className="text-xl font-bold mb-2">Products</h3>
            <p className="text-gray-600">Manage products, pricing, and pricing types</p>
            <div className="mt-4 text-blue-600">→ Manage</div>
          </Link>
        </div>
      </div>
    </div>
  );
}

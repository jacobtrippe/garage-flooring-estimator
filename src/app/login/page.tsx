"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid credentials");
    } else {
      router.push("/customers");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F9FAFB' }}>
      <div
        className="max-w-md w-full bg-white p-8 rounded-lg shadow-sm"
        style={{ borderTop: '4px solid #1B3A5C' }}
      >
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <Image
            src="/logo.jpg"
            alt="Platinum Installs"
            width={80}
            height={80}
            className="rounded-md"
          />
        </div>

        {/* Title and Tagline */}
        <h1 className="text-center text-2xl font-bold mb-2" style={{ color: '#2f2f30', letterSpacing: '0.5px' }}>
          PLATINUM INSTALLS
        </h1>
        <p className="text-center text-sm mb-8" style={{ color: '#666666' }}>
          Professional Garage Floor Coatings
        </p>

        {error && (
          <div className="text-red-600 mb-4 text-sm font-medium">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#2f2f30' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-offset-0"
              style={{ '--tw-ring-color': '#1B3A5C' } as any}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#2f2f30' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-offset-0"
              style={{ '--tw-ring-color': '#1B3A5C' } as any}
            />
          </div>

          <button
            type="submit"
            className="w-full text-white py-2 rounded-md font-medium hover:opacity-90 transition mt-6"
            style={{ backgroundColor: '#1B3A5C' }}
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}

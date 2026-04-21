"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewCustomer() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    street: "",
    city: "",
    state: "",
    zip: "",
    garageSqft: "",
    carPorts: "1",
    notes: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...formData,
        garageSqft: parseFloat(formData.garageSqft),
        carPorts: parseInt(formData.carPorts),
      }),
    });

    if (res.ok) {
      router.push("/customers");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">Garage Flooring Estimator</h1>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto p-8">
        <div className="mb-6">
          <Link href="/customers" className="text-blue-600 hover:underline">
            ← Back to Customers
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-2xl font-bold mb-6">Add New Customer</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                name="name"
                placeholder="Full Name"
                value={formData.name}
                onChange={handleChange}
                required
                className="border rounded px-4 py-2"
              />
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                required
                className="border rounded px-4 py-2"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <input
                type="tel"
                name="phone"
                placeholder="Phone"
                value={formData.phone}
                onChange={handleChange}
                required
                className="border rounded px-4 py-2"
              />
              <input
                type="text"
                name="street"
                placeholder="Street Address"
                value={formData.street}
                onChange={handleChange}
                required
                className="border rounded px-4 py-2"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <input
                type="text"
                name="city"
                placeholder="City"
                value={formData.city}
                onChange={handleChange}
                required
                className="border rounded px-4 py-2"
              />
              <input
                type="text"
                name="state"
                placeholder="State"
                value={formData.state}
                onChange={handleChange}
                required
                className="border rounded px-4 py-2"
              />
              <input
                type="text"
                name="zip"
                placeholder="ZIP"
                value={formData.zip}
                onChange={handleChange}
                required
                className="border rounded px-4 py-2"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <input
                type="number"
                name="garageSqft"
                placeholder="Garage Sqft"
                value={formData.garageSqft}
                onChange={handleChange}
                required
                className="border rounded px-4 py-2"
              />
              <select
                name="carPorts"
                value={formData.carPorts}
                onChange={handleChange}
                className="border rounded px-4 py-2"
              >
                <option value="1">1 Car Port</option>
                <option value="2">2 Car Ports</option>
                <option value="3">3 Car Ports</option>
                <option value="4">4+ Car Ports</option>
              </select>
            </div>

            <textarea
              name="notes"
              placeholder="Notes"
              value={formData.notes}
              onChange={handleChange}
              className="border rounded px-4 py-2 w-full h-24"
            />

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
            >
              Create Customer
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

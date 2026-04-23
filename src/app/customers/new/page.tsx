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
    <div className="min-h-screen" style={{ backgroundColor: '#F9FAFB' }}>
      <div className="max-w-2xl mx-auto p-8">
        <div className="mb-6">
          <Link href="/customers" className="font-medium hover:opacity-75 transition" style={{ color: '#1B3A5C' }}>
            ← Back to Customers
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8">
          <h2 className="text-3xl font-bold mb-8" style={{ color: '#2f2f30' }}>Add New Customer</h2>
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Contact Information Section */}
            <div>
              <h3 className="text-lg font-semibold mb-4" style={{ color: '#2f2f30', paddingBottom: '8px', borderBottom: '2px solid #1B3A5C' }}>
                Contact Information
              </h3>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#2f2f30' }}>
                    Full Name <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:outline-none"
                    style={{ '--tw-ring-color': '#1B3A5C' } as any}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#2f2f30' }}>
                    Email <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:outline-none"
                    style={{ '--tw-ring-color': '#1B3A5C' } as any}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#2f2f30' }}>
                    Phone <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:outline-none"
                    style={{ '--tw-ring-color': '#1B3A5C' } as any}
                  />
                </div>
              </div>
            </div>

            {/* Address Section */}
            <div>
              <h3 className="text-lg font-semibold mb-4" style={{ color: '#2f2f30', paddingBottom: '8px', borderBottom: '2px solid #1B3A5C' }}>
                Address
              </h3>
              <div className="grid grid-cols-1 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#2f2f30' }}>
                    Street Address <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="text"
                    name="street"
                    value={formData.street}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:outline-none"
                    style={{ '--tw-ring-color': '#1B3A5C' } as any}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#2f2f30' }}>
                    City <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:outline-none"
                    style={{ '--tw-ring-color': '#1B3A5C' } as any}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#2f2f30' }}>
                    State <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:outline-none"
                    style={{ '--tw-ring-color': '#1B3A5C' } as any}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#2f2f30' }}>
                    ZIP <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="text"
                    name="zip"
                    value={formData.zip}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:outline-none"
                    style={{ '--tw-ring-color': '#1B3A5C' } as any}
                  />
                </div>
              </div>
            </div>

            {/* Garage Details Section */}
            <div>
              <h3 className="text-lg font-semibold mb-4" style={{ color: '#2f2f30', paddingBottom: '8px', borderBottom: '2px solid #1B3A5C' }}>
                Garage Details
              </h3>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#2f2f30' }}>
                    Garage Sqft <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="number"
                    name="garageSqft"
                    value={formData.garageSqft}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:outline-none"
                    style={{ '--tw-ring-color': '#1B3A5C' } as any}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#2f2f30' }}>
                    Car Ports <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <select
                    name="carPorts"
                    value={formData.carPorts}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:outline-none"
                    style={{ '--tw-ring-color': '#1B3A5C' } as any}
                  >
                    <option value="1">1 Car Port</option>
                    <option value="2">2 Car Ports</option>
                    <option value="3">3 Car Ports</option>
                    <option value="4">4+ Car Ports</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Notes Section */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#2f2f30' }}>
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:outline-none h-24"
                style={{ '--tw-ring-color': '#1B3A5C' } as any}
              />
            </div>

            <button
              type="submit"
              className="w-full text-white py-2 rounded-md font-medium hover:opacity-90 transition mt-8"
              style={{ backgroundColor: '#1B3A5C' }}
            >
              Create Customer
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

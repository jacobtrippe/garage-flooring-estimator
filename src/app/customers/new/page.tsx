"use client";

import { useState, useRef } from "react";
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

  const [autoFillOpen, setAutoFillOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState("");
  const cameraRef = useRef<HTMLInputElement>(null);
  const screenshotRef = useRef<HTMLInputElement>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const applyExtracted = (extracted: Record<string, string>) => {
    setFormData((prev) => ({
      ...prev,
      name: extracted.name || prev.name,
      email: extracted.email || prev.email,
      phone: extracted.phone || prev.phone,
      street: extracted.street || prev.street,
      city: extracted.city || prev.city,
      state: extracted.state || prev.state,
      zip: extracted.zip || prev.zip,
      notes: extracted.notes || prev.notes,
    }));
    setAutoFillOpen(false);
    setPasteText("");
    setExtractError("");
  };

  const extractFromText = async () => {
    if (!pasteText.trim()) return;
    setExtracting(true);
    setExtractError("");
    try {
      const res = await fetch("/api/extract-customer-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: pasteText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      applyExtracted(data.extracted);
    } catch (err) {
      setExtractError("Could not extract info. Try editing fields manually.");
    } finally {
      setExtracting(false);
    }
  };

  const extractFromImage = async (file: File) => {
    setExtracting(true);
    setExtractError("");
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = (e.target?.result as string).split(",")[1];
        const mediaType = file.type || "image/jpeg";
        const res = await fetch("/api/extract-customer-info", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: base64, mediaType }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        applyExtracted(data.extracted);
        setExtracting(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setExtractError("Could not read image. Try again or paste text.");
      setExtracting(false);
    }
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
      <div className="max-w-2xl mx-auto p-4 md:p-8">
        <div className="mb-6">
          <Link href="/customers" className="font-medium hover:opacity-75 transition py-2 inline-block" style={{ color: '#1B3A5C' }}>
            ← Back to Customers
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl md:text-3xl font-bold" style={{ color: '#2f2f30' }}>Add New Customer</h2>
            <button
              type="button"
              onClick={() => { setAutoFillOpen(!autoFillOpen); setExtractError(""); }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition"
              style={{ backgroundColor: '#059669' }}
            >
              ✦ Auto-fill
            </button>
          </div>

          {/* Auto-fill Panel */}
          {autoFillOpen && (
            <div className="mb-6 border-2 border-green-200 rounded-xl p-4 bg-green-50">
              <p className="text-sm font-semibold text-green-800 mb-4">Choose how to import customer info:</p>

              {/* Hidden file inputs */}
              <input
                ref={cameraRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && extractFromImage(e.target.files[0])}
              />
              <input
                ref={screenshotRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && extractFromImage(e.target.files[0])}
              />

              {/* Option buttons */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <button
                  type="button"
                  onClick={() => cameraRef.current?.click()}
                  disabled={extracting}
                  className="flex flex-col items-center gap-2 p-4 bg-white border-2 border-green-300 rounded-xl text-center hover:bg-green-50 transition disabled:opacity-50"
                >
                  <span className="text-2xl">📷</span>
                  <span className="text-xs font-semibold text-gray-700">Take Photo</span>
                </button>
                <button
                  type="button"
                  onClick={() => screenshotRef.current?.click()}
                  disabled={extracting}
                  className="flex flex-col items-center gap-2 p-4 bg-white border-2 border-green-300 rounded-xl text-center hover:bg-green-50 transition disabled:opacity-50"
                >
                  <span className="text-2xl">🖼️</span>
                  <span className="text-xs font-semibold text-gray-700">Screenshot</span>
                </button>
                <button
                  type="button"
                  onClick={() => document.getElementById('paste-area')?.focus()}
                  className="flex flex-col items-center gap-2 p-4 bg-white border-2 border-green-300 rounded-xl text-center hover:bg-green-50 transition"
                >
                  <span className="text-2xl">📋</span>
                  <span className="text-xs font-semibold text-gray-700">Paste Text</span>
                </button>
              </div>

              {/* Paste area */}
              <textarea
                id="paste-area"
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder="Paste calendar event, contact info, or any text with customer details here..."
                className="w-full border-2 border-green-300 rounded-lg px-3 py-3 text-sm text-gray-800 focus:outline-none focus:border-green-500 resize-none"
                rows={4}
              />

              {extractError && (
                <p className="text-red-600 text-sm mt-2">{extractError}</p>
              )}

              <div className="flex gap-3 mt-3">
                {pasteText.trim() && (
                  <button
                    type="button"
                    onClick={extractFromText}
                    disabled={extracting}
                    className="flex-1 py-3 rounded-lg text-white font-semibold text-sm transition disabled:opacity-50"
                    style={{ backgroundColor: '#059669' }}
                  >
                    {extracting ? "Reading..." : "Fill from Text"}
                  </button>
                )}
                {extracting && !pasteText.trim() && (
                  <div className="flex-1 py-3 rounded-lg bg-green-600 text-white font-semibold text-sm text-center">
                    Reading image...
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => { setAutoFillOpen(false); setPasteText(""); setExtractError(""); }}
                  className="px-4 py-3 rounded-lg bg-gray-200 text-gray-700 font-semibold text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Contact Information Section */}
            <div>
              <h3 className="text-lg font-semibold mb-4" style={{ color: '#2f2f30', paddingBottom: '8px', borderBottom: '2px solid #1B3A5C' }}>
                Contact Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
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

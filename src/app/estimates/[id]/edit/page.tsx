"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";

const SignatureModal = dynamic(() => import("@/components/SignatureModal"), { ssr: false });

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  garageSqft: number;
  carPorts: number;
  notes: string;
}

interface Product {
  id: string;
  name: string;
  pricingType: string;
  price: number;
  sectionId: string;
  displayOrder: number;
  isActive: boolean;
}

interface Section {
  id: string;
  title: string;
  displayOrder: number;
  products: Product[];
}

interface SelectedItem {
  productId: string;
  name: string;
  pricingType: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
}

interface EstimateItem {
  id: string;
  productId: string;
  name: string;
  price: number;
}

interface Estimate {
  id: string;
  customerId: string;
  items: EstimateItem[];
  totalPrice: number;
  status: string;
}

export default function EstimateEditor() {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(false);
  const [savingCustomer, setSavingCustomer] = useState(false);
  const [editForm, setEditForm] = useState<Customer | null>(null);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const { status } = useSession();
  const router = useRouter();
  const params = useParams();
  const estimateId = params.id as string;

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (estimateId) {
      fetchEstimate();
      fetchSections();
    }
  }, [estimateId]);

  const fetchEstimate = async () => {
    try {
      const res = await fetch(`/api/estimates/${estimateId}`);
      if (!res.ok) {
        console.error("Failed to fetch estimate:", res.status);
        setLoading(false);
        return;
      }
      const estimate: Estimate = await res.json();

      const res2 = await fetch(`/api/customers/${estimate.customerId}`);
      if (!res2.ok) {
        console.error("Failed to fetch customer:", res2.status);
        setLoading(false);
        return;
      }
      const customerData = await res2.json();
      setCustomer(customerData);

      const selected = estimate.items.map((item) => ({
        productId: item.productId,
        name: item.name,
        pricingType: "FLAT",
        unitPrice: item.price,
        quantity: 1,
        totalPrice: item.price,
      }));
      setSelectedItems(selected);
    } catch (error) {
      console.error("Error fetching estimate:", error);
    }
  };

  const fetchSections = async () => {
    try {
      const res = await fetch("/api/sections");
      if (!res.ok) {
        console.error("Failed to fetch sections:", res.status);
        setLoading(false);
        return;
      }
      const allSections = await res.json();

      const sectionsWithProducts = allSections.map((section: Section) => ({
        ...section,
        products: section.products.filter((p: Product) => p.isActive),
      }));

      setSections(sectionsWithProducts);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching sections:", error);
      setLoading(false);
    }
  };

  const toggleEditCustomer = () => {
    if (!editingCustomer && customer) {
      setEditForm({ ...customer });
    }
    setEditingCustomer(!editingCustomer);
  };

  const handleCustomerFieldChange = (field: keyof Customer, value: any) => {
    if (editForm) {
      setEditForm({ ...editForm, [field]: value });
    }
  };

  const handleSaveCustomer = async () => {
    if (!editForm || !customer) return;

    setSavingCustomer(true);
    try {
      const res = await fetch(`/api/customers/${customer.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });

      if (!res.ok) {
        console.error("Failed to update customer:", res.status);
        setSavingCustomer(false);
        return;
      }

      const updated = await res.json();
      setCustomer(updated);
      setEditingCustomer(false);
      setSavingCustomer(false);
    } catch (error) {
      console.error("Error updating customer:", error);
      setSavingCustomer(false);
    }
  };

  const handleGeneratePDF = () => {
    if (!customer || selectedItems.length === 0) {
      alert("Please select at least one item");
      return;
    }
    setShowSignatureModal(true);
  };

  const calculatePrice = (product: Product): number => {
    if (!customer) return 0;
    if (product.pricingType === "PER_SQFT") {
      return product.price * customer.garageSqft;
    }
    return product.price;
  };

  const handleProductToggle = (product: Product) => {
    const existingItem = selectedItems.find((item) => item.productId === product.id);
    const productSection = sections.find((s) => s.id === product.sectionId);
    const isDiscountSection = productSection?.title === "Discounts";

    if (existingItem) {
      setSelectedItems(selectedItems.filter((item) => item.productId !== product.id));
    } else {
      let newItems = [...selectedItems];

      // For non-discount sections, remove other products from the same section (one-per-section)
      if (!isDiscountSection) {
        newItems = newItems.filter((item) => {
          const itemProduct = sections
            .flatMap((section) => section.products)
            .find((p) => p.id === item.productId);

          // Keep item only if it's from a different section
          if (itemProduct && itemProduct.sectionId === product.sectionId) {
            return false; // Remove it (same section)
          }
          return true; // Keep it (different section or not found)
        });
      }
      // For discount section, allow multiple selections - just add without removing

      // Add the new product
      const itemPrice = calculatePrice(product);
      newItems.push({
        productId: product.id,
        name: product.name,
        pricingType: product.pricingType,
        unitPrice: product.price,
        quantity: 1,
        totalPrice: itemPrice,
      });

      setSelectedItems(newItems);
    }
  };

  const getTotalPrice = (): number => {
    return selectedItems.reduce((sum, item) => sum + item.totalPrice, 0);
  };

  const isProductSelected = (productId: string): boolean => {
    return selectedItems.some((item) => item.productId === productId);
  };

  const handleSaveDraft = async () => {
    if (!customer || selectedItems.length === 0) return;

    setSaving(true);
    try {
      const totalPrice = getTotalPrice();
      const items = selectedItems.map((item) => ({
        productId: item.productId,
        name: item.name,
        price: item.totalPrice,
      }));

      const res = await fetch(`/api/estimates/${estimateId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          totalPrice,
          status: "draft",
        }),
      });

      if (!res.ok) {
        console.error("Failed to update estimate:", res.status);
        setSaving(false);
        return;
      }

      setSaving(false);
    } catch (error) {
      console.error("Error saving estimate:", error);
      setSaving(false);
    }
  };

  if (loading || !customer) return <div className="p-8">Loading...</div>;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F9FAFB' }}>
      <div className="max-w-6xl mx-auto p-8">
        <div className="mb-6">
          <Link href="/customers" className="font-medium hover:opacity-75 transition" style={{ color: '#1B3A5C' }}>
            ← Back to Customers
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-8">
          {/* Left: Customer Info */}
          <div className="col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Customer Info</h2>
                <button
                  onClick={toggleEditCustomer}
                  className="text-sm font-semibold hover:opacity-75 transition"
                  style={{ color: '#1B3A5C' }}
                >
                  {editingCustomer ? "Cancel" : "Edit"}
                </button>
              </div>

              {!editingCustomer ? (
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="font-semibold text-gray-700">Name</p>
                    <p className="text-gray-900">{customer.name}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-700">Email</p>
                    <p className="text-gray-900">{customer.email}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-700">Phone</p>
                    <p className="text-gray-900">{customer.phone}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-700">Address</p>
                    <p className="text-gray-900">
                      {customer.street}, {customer.city}, {customer.state} {customer.zip}
                    </p>
                  </div>
                  <div className="pt-4 border-t">
                    <p className="font-semibold text-gray-700">Garage Size</p>
                    <p className="text-lg font-bold" style={{ color: '#1B3A5C' }}>{customer.garageSqft} sqft</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-700">Car Ports</p>
                    <p className="text-lg font-bold" style={{ color: '#1B3A5C' }}>{customer.carPorts}</p>
                  </div>
                  {customer.notes && (
                    <div className="pt-4 border-t">
                      <p className="font-semibold text-gray-700">Notes</p>
                      <p className="text-gray-900 text-xs">{customer.notes}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3 text-sm">
                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">Name</label>
                    <input
                      type="text"
                      value={editForm?.name || ""}
                      onChange={(e) => handleCustomerFieldChange("name", e.target.value)}
                      className="w-full border rounded px-2 py-1"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">Email</label>
                    <input
                      type="email"
                      value={editForm?.email || ""}
                      onChange={(e) => handleCustomerFieldChange("email", e.target.value)}
                      className="w-full border rounded px-2 py-1"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">Phone</label>
                    <input
                      type="tel"
                      value={editForm?.phone || ""}
                      onChange={(e) => handleCustomerFieldChange("phone", e.target.value)}
                      className="w-full border rounded px-2 py-1"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">Street</label>
                    <input
                      type="text"
                      value={editForm?.street || ""}
                      onChange={(e) => handleCustomerFieldChange("street", e.target.value)}
                      className="w-full border rounded px-2 py-1"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-semibold text-gray-700 block mb-1">City</label>
                      <input
                        type="text"
                        value={editForm?.city || ""}
                        onChange={(e) => handleCustomerFieldChange("city", e.target.value)}
                        className="w-full border rounded px-2 py-1"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-gray-700 block mb-1">State</label>
                      <input
                        type="text"
                        value={editForm?.state || ""}
                        onChange={(e) => handleCustomerFieldChange("state", e.target.value)}
                        className="w-full border rounded px-2 py-1"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">Zip</label>
                    <input
                      type="text"
                      value={editForm?.zip || ""}
                      onChange={(e) => handleCustomerFieldChange("zip", e.target.value)}
                      className="w-full border rounded px-2 py-1"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">Garage Size (sqft)</label>
                    <input
                      type="number"
                      value={editForm?.garageSqft || ""}
                      onChange={(e) => handleCustomerFieldChange("garageSqft", parseFloat(e.target.value))}
                      className="w-full border rounded px-2 py-1"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">Car Ports</label>
                    <input
                      type="number"
                      value={editForm?.carPorts || ""}
                      onChange={(e) => handleCustomerFieldChange("carPorts", parseInt(e.target.value))}
                      className="w-full border rounded px-2 py-1"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">Notes</label>
                    <textarea
                      value={editForm?.notes || ""}
                      onChange={(e) => handleCustomerFieldChange("notes", e.target.value)}
                      className="w-full border rounded px-2 py-1 text-xs"
                      rows={3}
                    />
                  </div>
                  <button
                    onClick={handleSaveCustomer}
                    disabled={savingCustomer}
                    className="w-full bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700 transition disabled:bg-gray-400 mt-3"
                  >
                    {savingCustomer ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Middle: Products */}
          <div className="col-span-1">
            <h2 className="text-2xl font-bold mb-6" style={{ color: '#2f2f30' }}>Available Products</h2>
            <div className="space-y-6">
              {sections.map((section) => (
                <div key={section.id} className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-bold mb-4 pb-3 border-b-2" style={{ color: '#1B3A5C', borderColor: '#1B3A5C' }}>{section.title}</h3>
                  <div className="space-y-3">
                    {section.products.length === 0 ? (
                      <p className="text-gray-500 text-sm">No products in this section</p>
                    ) : (
                      section.products.map((product) => {
                        const itemPrice = calculatePrice(product);
                        const isSelected = isProductSelected(product.id);

                        return (
                          <label
                            key={product.id}
                            className={`flex items-start p-3 border-2 rounded-md cursor-pointer transition ${
                              isSelected
                                ? "bg-opacity-10 border-2"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                            style={isSelected ? {
                              backgroundColor: 'rgba(27, 58, 92, 0.08)',
                              borderColor: '#1B3A5C'
                            } : {}}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleProductToggle(product)}
                              className="mt-1 mr-3"
                            />
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900">{product.name}</p>
                              <p className="text-sm font-bold mt-2" style={{ color: '#1B3A5C' }}>
                                ${itemPrice.toFixed(2)}
                              </p>
                            </div>
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Selected Items & Total */}
          <div className="col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
              <h2 className="text-2xl font-bold mb-4" style={{ color: '#2f2f30' }}>Estimate Summary</h2>

              <div className="space-y-3 max-h-96 overflow-y-auto mb-6">
                {selectedItems.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No items selected</p>
                ) : (
                  selectedItems.map((item) => (
                    <div key={item.productId} className="border-b pb-3">
                      <div className="flex justify-between items-start mb-1">
                        <p className="font-semibold text-gray-900">{item.name}</p>
                        <button
                          onClick={() =>
                            setSelectedItems(
                              selectedItems.filter((i) => i.productId !== item.productId)
                            )
                          }
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          ✕
                        </button>
                      </div>
                      {item.totalPrice > 0 && (
                        <p className="text-sm font-bold mt-2" style={{ color: '#1B3A5C' }}>
                          ${item.totalPrice.toFixed(2)}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>

              {selectedItems.length > 0 && (
                <div className="border-t pt-4 space-y-3">
                  <div className="flex justify-between items-center text-lg font-bold" style={{ color: '#2f2f30' }}>
                    <span>Total:</span>
                    <span className="text-2xl font-bold" style={{ color: '#1B3A5C' }}>${getTotalPrice().toFixed(2)}</span>
                  </div>

                  <button
                    onClick={handleSaveDraft}
                    disabled={saving}
                    className="w-full text-white py-3 rounded-md font-semibold hover:opacity-90 transition disabled:opacity-50"
                    style={{ backgroundColor: '#1B3A5C' }}
                  >
                    {saving ? "Saving..." : "Save Draft"}
                  </button>

                  <button
                    onClick={handleGeneratePDF}
                    className="w-full text-white py-3 rounded-md font-semibold hover:opacity-90 transition"
                    style={{ backgroundColor: '#1B3A5C' }}
                  >
                    Generate PDF & Sign
                  </button>
                </div>
              )}

              <button
                onClick={() => router.back()}
                className="w-full mt-3 text-gray-900 py-2 rounded-md hover:opacity-75 transition font-medium"
                style={{ backgroundColor: '#e5e7eb' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>

      {customer && (
        <SignatureModal
          isOpen={showSignatureModal}
          onClose={() => setShowSignatureModal(false)}
          customer={customer}
          items={selectedItems}
          totalPrice={getTotalPrice()}
          estimateId={estimateId}
        />
      )}
    </div>
  );
}

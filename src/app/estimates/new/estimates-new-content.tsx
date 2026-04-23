"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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

export function EstimatesNewContent() {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [estimateId, setEstimateId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(false);
  const [savingCustomer, setSavingCustomer] = useState(false);
  const [editForm, setEditForm] = useState<Customer | null>(null);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const customerId = searchParams.get("customer");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (customerId) {
      fetchCustomer();
      fetchSections();
    }
  }, [customerId]);

  const fetchCustomer = async () => {
    try {
      const res = await fetch(`/api/customers/${customerId}`);
      if (!res.ok) {
        console.error("Failed to fetch customer:", res.status);
        return;
      }
      const data = await res.json();
      setCustomer(data);
    } catch (error) {
      console.error("Error fetching customer:", error);
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
    if (!editForm) return;

    setSavingCustomer(true);
    try {
      const res = await fetch(`/api/customers/${customerId}`, {
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

  const handleGeneratePDF = async () => {
    if (!customer || selectedItems.length === 0) {
      alert("Please select at least one item from each section");
      return;
    }

    if (!areAllSectionsSelected()) {
      alert("Please select one product from each section");
      return;
    }

    if (!estimateId) {
      const totalPrice = getTotalPrice();
      const items = selectedItems.map((item) => ({
        productId: item.productId,
        name: item.name,
        price: item.totalPrice,
      }));

      try {
        const res = await fetch("/api/estimates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customerId: customer.id,
            items,
            totalPrice,
            status: "draft",
          }),
        });

        if (!res.ok) {
          alert("Failed to save estimate");
          return;
        }

        const savedEstimate = await res.json();
        setEstimateId(savedEstimate.id);
        setShowSignatureModal(true);
      } catch (error) {
        console.error("Error saving estimate:", error);
        alert("Error saving estimate");
      }
    } else {
      setShowSignatureModal(true);
    }
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
      // Deselect if already selected
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

  const areAllSectionsSelected = (): boolean => {
    return sections.every((section) => {
      // Discounts section is optional - skip the requirement
      if (section.title === "Discounts") {
        return true;
      }

      // All other sections require at least one selection
      return selectedItems.some((item) => {
        const product = section.products.find((p) => p.id === item.productId);
        return product !== undefined;
      });
    });
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

      let newEstimateId = estimateId;

      if (!estimateId) {
        const res = await fetch("/api/estimates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customerId: customer.id,
            items,
            totalPrice,
            status: "draft",
          }),
        });

        if (!res.ok) {
          console.error("Failed to save estimate:", res.status);
          setSaving(false);
          return;
        }

        const savedEstimate = await res.json();
        newEstimateId = savedEstimate.id;
        setEstimateId(newEstimateId);
        router.replace(`/estimates/${newEstimateId}/edit`);
      } else {
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
        <div className="grid grid-cols-3 gap-8">
          {/* Left: Customer Info */}
          <div className="col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold" style={{ color: '#2f2f30' }}>Customer Info</h2>
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
                    className="w-full text-white py-2 rounded-md font-semibold hover:opacity-90 transition disabled:opacity-50 mt-3"
                    style={{ backgroundColor: '#1B3A5C' }}
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
                            className={`flex items-start p-4 border-2 rounded-md cursor-pointer transition ${
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
                              className="sr-only"
                            />
                            <div className="mt-0.5 mr-3 flex-shrink-0">
                              <div
                                className="w-5 h-5 rounded-full border-2 flex items-center justify-center transition"
                                style={{ borderColor: isSelected ? '#1B3A5C' : '#d1d5db' }}
                              >
                                {isSelected && (
                                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#1B3A5C' }} />
                                )}
                              </div>
                            </div>
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
                      <div className="flex justify-between items-start mb-2">
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
                      <p className="text-sm font-bold" style={{ color: '#1B3A5C' }}>
                        ${item.totalPrice.toFixed(2)}
                      </p>
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
                    disabled={!areAllSectionsSelected()}
                    className="w-full text-white py-3 rounded-md font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: '#1B3A5C' }}
                  >
                    {areAllSectionsSelected() ? "Generate PDF & Sign" : "Select one from each section"}
                  </button>
                </div>
              )}

              <button
                onClick={() => router.back()}
                className="w-full mt-3 py-2 rounded-md hover:opacity-75 transition text-gray-900 font-medium"
                style={{ backgroundColor: '#e5e7eb' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>

      {customer && estimateId && (
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

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
  category: string;
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
  quoteType: string;
  exteriorSqft: number | null;
  approvedDiscount: number;
  installationDate?: string;
  signatureDataUrl?: string;
}

type QuoteType = "interior" | "exterior" | "both";

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
  const [showRemoteSignModal, setShowRemoteSignModal] = useState(false);
  const [sendingRemoteSign, setSendingRemoteSign] = useState(false);
  const [remoteSignInstallationDate, setRemoteSignInstallationDate] = useState<string>('');
  const [remoteSigningUrl, setRemoteSigningUrl] = useState<string>('');
  const [preSignedSignatureDataUrl, setPreSignedSignatureDataUrl] = useState<string | undefined>();
  const [installationDate, setInstallationDate] = useState<string>('');
  const [quoteType, setQuoteType] = useState<QuoteType>("interior");
  const [exteriorSqft, setExteriorSqft] = useState<number>(0);
  const [approvedDiscount, setApprovedDiscount] = useState<number>(0);
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

  const filteredSections = sections.filter((section) => {
    if (quoteType === "interior") return section.category === "interior" || section.category === "both";
    if (quoteType === "exterior") return section.category === "exterior" || section.category === "both";
    return true;
  });

  useEffect(() => {
    const visibleSectionIds = new Set(filteredSections.map((s) => s.id));
    setSelectedItems((prev) =>
      prev.filter((item) => {
        const product = sections.flatMap((s) => s.products).find((p) => p.id === item.productId);
        return product ? visibleSectionIds.has(product.sectionId) : false;
      })
    );
  }, [quoteType]);

  useEffect(() => {
    setSelectedItems((prev) => recalculateItems(prev));
  }, [exteriorSqft, sections]);

  const fetchEstimate = async () => {
    try {
      const res = await fetch(`/api/estimates/${estimateId}`);
      if (!res.ok) {
        console.error("Failed to fetch estimate:", res.status);
        setLoading(false);
        return;
      }
      const estimate: Estimate = await res.json();

      setQuoteType((estimate.quoteType as QuoteType) || "interior");
      setExteriorSqft(estimate.exteriorSqft ?? 0);
      setApprovedDiscount(estimate.approvedDiscount ?? 0);
      if (estimate.installationDate) {
        setInstallationDate(estimate.installationDate);
      }
      if (estimate.signatureDataUrl) {
        setPreSignedSignatureDataUrl(estimate.signatureDataUrl);
      }

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
        pricingType: "FLAT", // Will be updated when sections load
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

      // Auto-save estimate with current exteriorSqft, quoteType, and approvedDiscount
      if (estimateId) {
        await fetch(`/api/estimates/${estimateId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            quoteType,
            exteriorSqft: quoteType !== "interior" ? exteriorSqft : null,
            approvedDiscount,
          }),
        });
      }

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

  const handleSendRemoteSignature = async () => {
    if (!customer) {
      alert("Customer not found");
      return;
    }

    if (!remoteSignInstallationDate) {
      alert("Please select an installation date");
      return;
    }

    setSendingRemoteSign(true);
    try {
      // First, save the installation date to the estimate
      const updateRes = await fetch(`/api/estimates/${estimateId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          installationDate: remoteSignInstallationDate,
        }),
      });

      if (!updateRes.ok) {
        throw new Error("Failed to save installation date");
      }

      // Then generate the signing link
      const res = await fetch(`/api/estimates/${estimateId}/send-signature`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerEmail: customer.email,
          customerName: customer.name,
          installationDate: remoteSignInstallationDate,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to generate signing link");
      }

      const data = await res.json();
      setRemoteSigningUrl(data.signingUrl);
      setShowRemoteSignModal(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to send signing link");
    } finally {
      setSendingRemoteSign(false);
    }
  };

  const calculatePrice = (product: Product): number => {
    if (!customer) return 0;
    if (product.pricingType === "PER_SQFT") {
      let sqft: number;
      if (quoteType === "exterior") {
        sqft = exteriorSqft;
      } else if (quoteType === "interior") {
        sqft = customer.garageSqft;
      } else {
        // combined: exterior sections use exteriorSqft, everything else uses garageSqft
        const section = sections.find((s) => s.id === product.sectionId);
        sqft = section?.category === "exterior" ? exteriorSqft : customer.garageSqft;
      }
      return product.price * sqft;
    }
    return product.price;
  };

  const recalculateItems = (items: SelectedItem[]): SelectedItem[] => {
    const allProducts = sections.flatMap((s) => s.products);

    // Pass 1: price non-PERCENT items (update pricingType from product)
    const pass1 = items.map((item) => {
      const product = allProducts.find((p) => p.id === item.productId);
      if (!product) return item;

      const correctedItem = { ...item, pricingType: product.pricingType };
      if (product.pricingType === "PERCENT") return correctedItem;

      return { ...correctedItem, totalPrice: calculatePrice(product) };
    });

    // Compute base subtotal (sum of non-PERCENT items)
    const baseSubtotal = pass1
      .filter((i) => i.pricingType !== "PERCENT")
      .reduce((sum, i) => sum + i.totalPrice, 0);

    // Pass 2: apply PERCENT items
    return pass1.map((item) => {
      if (item.pricingType !== "PERCENT") return item;
      const product = allProducts.find((p) => p.id === item.productId);
      if (!product) return item;
      return { ...item, totalPrice: baseSubtotal * (product.price / 100) };
    });
  };

  const handleProductToggle = (product: Product) => {
    const existingItem = selectedItems.find((item) => item.productId === product.id);
    const productSection = sections.find((s) => s.id === product.sectionId);
    const isMultiSelectSection = productSection?.title === "Discounts" || productSection?.title === "Exterior Prep";

    if (existingItem) {
      // Deselect if already selected
      const newItems = selectedItems.filter((item) => item.productId !== product.id);
      setSelectedItems(recalculateItems(newItems));
    } else {
      let newItems = [...selectedItems];

      // For non-multi-select sections, remove other products from the same section (one-per-section)
      if (!isMultiSelectSection) {
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
      // For multi-select sections (Discounts, Exterior Prep), allow multiple selections - just add without removing

      // Add the new product
      newItems.push({
        productId: product.id,
        name: product.name,
        pricingType: product.pricingType,
        unitPrice: product.price,
        quantity: 1,
        totalPrice: 0, // Will be set by recalculateItems
      });

      setSelectedItems(recalculateItems(newItems));
    }
  };

  const getTotalPrice = (): number => {
    const itemsTotal = selectedItems.reduce((sum, item) => sum + item.totalPrice, 0);
    return itemsTotal - approvedDiscount;
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
          quoteType,
          exteriorSqft: quoteType !== "interior" ? exteriorSqft : null,
          approvedDiscount,
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
      <div className="max-w-6xl mx-auto p-4 md:p-8">
        <div className="mb-6">
          <Link href="/customers" className="font-medium hover:opacity-75 transition py-2 inline-block" style={{ color: '#1B3A5C' }}>
            ← Back to Customers
          </Link>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Customer Info */}
          <div className="col-span-1">
            <div className="bg-white rounded-lg shadow p-6 lg:sticky lg:top-8">
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
                    <div className="flex items-center gap-2">
                      <p className="text-gray-900">{customer.name}</p>
                      {preSignedSignatureDataUrl && (
                        <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-semibold">
                          <span>✓</span> Signed
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-700">Email</p>
                    <p className="text-gray-900">{customer.email}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-700">Phone</p>
                    <p className="text-gray-900">{customer.phone}</p>
                    <div className="flex gap-3 mt-1">
                      <a href={`tel:${customer.phone}`} className="text-xs font-medium text-blue-600">Call</a>
                      <a href={`sms:${customer.phone}`} className="text-xs font-medium text-green-600">Text</a>
                    </div>
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
                  {(quoteType === "exterior" || quoteType === "both") && (
                    <div className="pt-4 border-t">
                      <p className="font-semibold text-gray-700">Exterior Area</p>
                      <p className="text-lg font-bold" style={{ color: '#1B3A5C' }}>{exteriorSqft} sqft</p>
                    </div>
                  )}
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
                  {(quoteType === "exterior" || quoteType === "both") && (
                    <div>
                      <label className="font-semibold text-gray-700 block mb-1">Exterior Area (sqft)</label>
                      <input
                        type="number"
                        value={exteriorSqft || ""}
                        onChange={(e) => setExteriorSqft(parseFloat(e.target.value) || 0)}
                        className="w-full border rounded px-2 py-1"
                      />
                    </div>
                  )}
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
            <div className="mb-6 flex flex-wrap gap-2 justify-center">
              {(["interior", "exterior", "both"] as QuoteType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setQuoteType(type)}
                  className={`px-4 py-2 rounded-md font-semibold transition capitalize ${
                    quoteType === type
                      ? "text-white"
                      : "bg-white border border-gray-300 text-gray-700 hover:border-gray-400"
                  }`}
                  style={quoteType === type ? { backgroundColor: '#1B3A5C' } : {}}
                >
                  {type === "both" ? "Interior + Exterior" : type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
            <h2 className="text-2xl font-bold mb-6" style={{ color: '#2f2f30' }}>Available Products</h2>
            <div className="space-y-6">
              {filteredSections.map((section) => (
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
            <div className="bg-white rounded-lg shadow-sm p-6 lg:sticky lg:top-8">
              <h2 className="text-2xl font-bold mb-4" style={{ color: '#2f2f30' }}>Estimate Summary</h2>

              <div className="space-y-3 max-h-48 lg:max-h-96 overflow-y-auto mb-6">
                {selectedItems.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No items selected</p>
                ) : (
                  selectedItems.map((item) => (
                    <div key={item.productId} className="border-b pb-3">
                      <div className="flex justify-between items-start mb-1">
                        <p className="font-semibold text-gray-900">{item.name}</p>
                        <button
                          onClick={() => {
                            if (confirm(`Remove ${item.name} from estimate?`)) {
                              setSelectedItems(
                                selectedItems.filter((i) => i.productId !== item.productId)
                              );
                            }
                          }}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          ✕
                        </button>
                      </div>
                      {item.totalPrice !== 0 && (
                        <p className="text-sm font-bold mt-2" style={{ color: item.totalPrice < 0 ? '#dc2626' : '#1B3A5C' }}>
                          {item.totalPrice < 0 ? '-$' : '$'}{Math.abs(item.totalPrice).toFixed(2)}
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

                  <div className="border-t pt-3 mt-3">
                    <label className="font-semibold text-gray-700 block mb-2">Approved Discount</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={approvedDiscount}
                      onChange={(e) => setApprovedDiscount(parseFloat(e.target.value) || 0)}
                      className="w-full border-2 rounded px-3 py-2 text-gray-900"
                      placeholder="Enter discount amount"
                    />
                    {approvedDiscount > 0 && (
                      <p className="text-sm text-green-700 font-medium mt-1">-${approvedDiscount.toFixed(2)}</p>
                    )}
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

                  <button
                    onClick={() => setShowRemoteSignModal(true)}
                    className="w-full text-white py-3 rounded-md font-semibold hover:opacity-90 transition"
                    style={{ backgroundColor: '#059669' }}
                  >
                    Send for Remote Signature
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
          quoteType={quoteType}
          exteriorSqft={exteriorSqft}
          itemCategories={Object.fromEntries(
            selectedItems.map((item) => {
              const section = sections.find((s) => s.products.some((p) => p.id === item.productId));
              return [item.productId, section?.category || "interior"];
            })
          )}
          preSignedSignatureDataUrl={preSignedSignatureDataUrl}
          installationDate={installationDate}
          approvedDiscount={approvedDiscount}
        />
      )}

      {remoteSigningUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4">
              <h2 className="text-xl font-bold text-white">✓ Signing Link Ready</h2>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-gray-700">
                The signing link has been generated for <strong>{customer.name}</strong>. Share this link via email, text, or however you prefer.
              </p>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-xs text-gray-600 mb-2 font-semibold">SIGNING LINK (expires in 14 days):</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={remoteSigningUrl}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm font-mono text-gray-900 bg-white"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(remoteSigningUrl);
                      alert('Link copied to clipboard!');
                    }}
                    className="px-3 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 whitespace-nowrap"
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-700">
                <p className="font-semibold mb-2">Next steps:</p>
                <ul className="space-y-1 text-xs list-disc list-inside">
                  <li>Send the link to {customer.email}</li>
                  <li>They can sign from any device</li>
                  <li>You'll get an SMS when they sign</li>
                  <li>Then complete the process by signing from the app</li>
                </ul>
              </div>

              <button
                onClick={() => {
                  setRemoteSigningUrl('');
                  setRemoteSignInstallationDate('');
                }}
                className="w-full px-4 py-2 bg-green-600 text-white rounded font-medium hover:bg-green-700"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {showRemoteSignModal && customer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4">
              <h2 className="text-xl font-bold text-white">Send for Remote Signature</h2>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-gray-700">
                A signing link will be sent to <strong>{customer.email}</strong> so they can review and sign the agreement remotely on any device.
              </p>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Installation Date *</label>
                <input
                  type="date"
                  value={remoteSignInstallationDate}
                  onChange={(e) => setRemoteSignInstallationDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  min={new Date().toISOString().split('T')[0]}
                />
                <p className="text-xs text-gray-500 mt-1">This date will be filled in on the agreement PDF</p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded p-4 text-sm text-blue-700">
                <p className="font-semibold mb-2">What happens:</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Customer receives an email with a secure link</li>
                  <li>They open it on any device and review the agreement</li>
                  <li>They draw their signature and submit</li>
                  <li>You'll get an SMS notification when they sign</li>
                  <li>Then you can sign from the app to complete it</li>
                </ul>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowRemoteSignModal(false);
                    setRemoteSignInstallationDate('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendRemoteSignature}
                  disabled={sendingRemoteSign || !remoteSignInstallationDate}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded font-medium hover:bg-green-700 disabled:opacity-50"
                >
                  {sendingRemoteSign ? "Sending..." : "Send Link"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

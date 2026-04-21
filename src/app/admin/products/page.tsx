"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";

interface Product {
  id: string;
  name: string;
  pricingType: string;
  price: number;
  isActive: boolean;
  sectionId: string;
  displayOrder: number;
}

interface Section {
  id: string;
  title: string;
}

export default function ProductsAdmin() {
  const [products, setProducts] = useState<Product[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedSection, setSelectedSection] = useState("");
  const [name, setName] = useState("");
  const [pricingType, setPricingType] = useState("PER_SQFT");
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPricingType, setEditPricingType] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    fetchSections();
    const section = searchParams.get("section");
    if (section) setSelectedSection(section);
  }, []);

  useEffect(() => {
    if (selectedSection) fetchProducts();
  }, [selectedSection]);

  const fetchSections = async () => {
    const res = await fetch("/api/sections");
    const data = await res.json();
    setSections(data);
    setLoading(false);
  };

  const fetchProducts = async () => {
    const res = await fetch(`/api/products?sectionId=${selectedSection}`);
    const data = await res.json();
    setProducts(data);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !selectedSection || !price) return;

    await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sectionId: selectedSection,
        name,
        pricingType,
        price: parseFloat(price),
        isActive: true,
      }),
    });

    setName("");
    setPrice("");
    setPricingType("PER_SQFT");
    fetchProducts();
  };

  const startEdit = (product: Product) => {
    setEditingId(product.id);
    setEditName(product.name);
    setEditPricingType(product.pricingType);
    setEditPrice(product.price.toString());
  };

  const handleSaveEdit = async (id: string) => {
    await fetch("/api/products", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        name: editName,
        pricingType: editPricingType,
        price: parseFloat(editPrice),
      }),
    });
    setEditingId(null);
    fetchProducts();
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      return;
    }

    const draggedIndex = products.findIndex((p) => p.id === draggedId);
    const targetIndex = products.findIndex((p) => p.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newProducts = [...products];
    const [draggedProduct] = newProducts.splice(draggedIndex, 1);
    newProducts.splice(targetIndex, 0, draggedProduct);

    setProducts(newProducts);
    setDraggedId(null);

    for (let i = 0; i < newProducts.length; i++) {
      await fetch("/api/products", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: newProducts[i].id,
          displayOrder: i + 1,
        }),
      });
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    await fetch("/api/products", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isActive: !isActive }),
    });
    fetchProducts();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/products?id=${id}`, { method: "DELETE" });
    fetchProducts();
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link href="/admin" className="text-blue-600 hover:underline">
            ← Back to Admin
          </Link>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto p-8">
        <h2 className="text-3xl font-bold mb-6">Manage Products</h2>

        <div className="mb-6">
          <label className="block text-lg font-semibold mb-2">Select Section:</label>
          <select
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            className="border rounded px-4 py-2 w-full"
          >
            <option value="">Choose a section...</option>
            {sections.map((section) => (
              <option key={section.id} value={section.id}>
                {section.title}
              </option>
            ))}
          </select>
        </div>

        {selectedSection && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h3 className="text-xl font-bold mb-4">Add New Product</h3>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <input
                  type="text"
                  placeholder="Product name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="border rounded px-4 py-2"
                  required
                />
                <select
                  value={pricingType}
                  onChange={(e) => setPricingType(e.target.value)}
                  className="border rounded px-4 py-2"
                >
                  <option value="PER_SQFT">Per Sqft</option>
                  <option value="FLAT">Flat Fee</option>
                </select>
                <input
                  type="number"
                  placeholder="Price"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="border rounded px-4 py-2"
                  required
                />
              </div>
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
              >
                Add Product
              </button>
            </form>
          </div>
        )}

        {selectedSection && (
          <>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold w-8">⋮</th>
                    <th className="px-6 py-3 text-left font-semibold">Name</th>
                    <th className="px-6 py-3 text-left font-semibold">Type</th>
                    <th className="px-6 py-3 text-left font-semibold">Price</th>
                    <th className="px-6 py-3 text-left font-semibold">Active</th>
                    <th className="px-6 py-3 text-left font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                        No products in this section
                      </td>
                    </tr>
                  ) : (
                    products.map((product) => (
                      <tr
                        key={product.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, product.id)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, product.id)}
                        className={`border-b hover:bg-gray-50 transition ${
                          draggedId === product.id ? "opacity-50 bg-blue-50" : ""
                        }`}
                      >
                        <td className="px-4 py-4 cursor-grab active:cursor-grabbing text-gray-400">
                          ⋮⋮
                        </td>
                        {editingId === product.id ? (
                          <>
                            <td className="px-6 py-4">
                              <input
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="border rounded px-3 py-1 w-full"
                              />
                            </td>
                            <td className="px-6 py-4">
                              <select
                                value={editPricingType}
                                onChange={(e) => setEditPricingType(e.target.value)}
                                className="border rounded px-3 py-1"
                              >
                                <option value="PER_SQFT">Per Sqft</option>
                                <option value="FLAT">Flat Fee</option>
                              </select>
                            </td>
                            <td className="px-6 py-4">
                              <input
                                type="number"
                                step="0.01"
                                value={editPrice}
                                onChange={(e) => setEditPrice(e.target.value)}
                                className="border rounded px-3 py-1 w-24"
                              />
                            </td>
                            <td className="px-6 py-4">
                              <button
                                onClick={() => toggleActive(product.id, product.isActive)}
                                className={`px-3 py-1 rounded text-white text-sm ${
                                  product.isActive ? "bg-green-600" : "bg-gray-400"
                                }`}
                              >
                                {product.isActive ? "Active" : "Inactive"}
                              </button>
                            </td>
                            <td className="px-6 py-4 space-x-2">
                              <button
                                onClick={() => handleSaveEdit(product.id)}
                                className="text-green-600 hover:underline text-sm font-semibold"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="text-gray-600 hover:underline text-sm"
                              >
                                Cancel
                              </button>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-6 py-4">{product.name}</td>
                            <td className="px-6 py-4">{product.pricingType}</td>
                            <td className="px-6 py-4">${product.price.toFixed(2)}</td>
                            <td className="px-6 py-4">
                              <button
                                onClick={() => toggleActive(product.id, product.isActive)}
                                className={`px-3 py-1 rounded text-white text-sm ${
                                  product.isActive ? "bg-green-600" : "bg-gray-400"
                                }`}
                              >
                                {product.isActive ? "Active" : "Inactive"}
                              </button>
                            </td>
                            <td className="px-6 py-4 space-x-2">
                              <button
                                onClick={() => startEdit(product)}
                                className="text-blue-600 hover:underline text-sm"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(product.id)}
                                className="text-red-600 hover:underline text-sm"
                              >
                                Delete
                              </button>
                            </td>
                          </>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <p className="text-gray-600 text-sm mt-4">💡 Drag products to reorder them</p>
          </>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

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

function SortableProductRow({
  product,
  editingId,
  editName,
  editPricingType,
  editPrice,
  onEditName,
  onEditPricingType,
  onEditPrice,
  onSaveEdit,
  onCancelEdit,
  onToggleActive,
  onDelete,
  onStartEdit,
}: {
  product: Product;
  editingId: string | null;
  editName: string;
  editPricingType: string;
  editPrice: string;
  onEditName: (val: string) => void;
  onEditPricingType: (val: string) => void;
  onEditPrice: (val: string) => void;
  onSaveEdit: (id: string) => void;
  onCancelEdit: () => void;
  onToggleActive: (id: string, isActive: boolean) => void;
  onDelete: (id: string) => void;
  onStartEdit: (product: Product) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: product.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    backgroundColor: isDragging ? "#eff6ff" : "",
  };

  return (
    <tr ref={setNodeRef} style={style} className="border-b hover:bg-gray-50">
      <td
        className="px-4 py-4 cursor-grab active:cursor-grabbing text-gray-400"
        {...attributes}
        {...listeners}
      >
        ⋮⋮
      </td>
      {editingId === product.id ? (
        <>
          <td className="px-6 py-4">
            <input
              type="text"
              value={editName}
              onChange={(e) => onEditName(e.target.value)}
              className="border rounded px-3 py-1 w-full"
            />
          </td>
          <td className="px-6 py-4">
            <select
              value={editPricingType}
              onChange={(e) => onEditPricingType(e.target.value)}
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
              onChange={(e) => onEditPrice(e.target.value)}
              className="border rounded px-3 py-1 w-24"
            />
          </td>
          <td className="px-6 py-4">
            <button
              onClick={() => onToggleActive(product.id, product.isActive)}
              className={`px-3 py-1 rounded text-white text-sm ${
                product.isActive ? "bg-green-600" : "bg-gray-400"
              }`}
            >
              {product.isActive ? "Active" : "Inactive"}
            </button>
          </td>
          <td className="px-6 py-4 space-x-2">
            <button
              onClick={() => onSaveEdit(product.id)}
              className="text-green-600 hover:underline text-sm font-semibold"
            >
              Save
            </button>
            <button
              onClick={onCancelEdit}
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
              onClick={() => onToggleActive(product.id, product.isActive)}
              className={`px-3 py-1 rounded text-white text-sm ${
                product.isActive ? "bg-green-600" : "bg-gray-400"
              }`}
            >
              {product.isActive ? "Active" : "Inactive"}
            </button>
          </td>
          <td className="px-6 py-4 space-x-2">
            <button
              onClick={() => onStartEdit(product)}
              className="text-blue-600 hover:underline text-sm"
            >
              Edit
            </button>
            <button
              onClick={() => onDelete(product.id)}
              className="text-red-600 hover:underline text-sm"
            >
              Delete
            </button>
          </td>
        </>
      )}
    </tr>
  );
}

export function ProductsAdminContent() {
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
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 5 },
    })
  );

  const productIds = useMemo(() => products.map((p) => p.id), [products]);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    fetchSections();
    const section = searchParams.get("section");
    if (section) setSelectedSection(section);
  }, [searchParams]);

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

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = products.findIndex((p) => p.id === active.id);
    const newIndex = products.findIndex((p) => p.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const newProducts = arrayMove(products, oldIndex, newIndex);
    setProducts(newProducts);

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
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={productIds}
              strategy={verticalListSortingStrategy}
            >
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
                        <SortableProductRow
                          key={product.id}
                          product={product}
                          editingId={editingId}
                          editName={editName}
                          editPricingType={editPricingType}
                          editPrice={editPrice}
                          onEditName={setEditName}
                          onEditPricingType={setEditPricingType}
                          onEditPrice={setEditPrice}
                          onSaveEdit={handleSaveEdit}
                          onCancelEdit={() => setEditingId(null)}
                          onToggleActive={toggleActive}
                          onDelete={handleDelete}
                          onStartEdit={startEdit}
                        />
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <p className="text-gray-600 text-sm mt-4">💡 Grip and drag the ⋮⋮ handle to reorder products</p>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
}

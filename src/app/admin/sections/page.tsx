"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";

interface Section {
  id: string;
  title: string;
  displayOrder: number;
}

export default function SectionsAdmin() {
  const [sections, setSections] = useState<Section[]>([]);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
    const res = await fetch("/api/sections");
    const data = await res.json();
    setSections(data);
    setLoading(false);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    await fetch("/api/sections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });

    setTitle("");
    fetchSections();
  };

  const startEdit = (section: Section) => {
    setEditingId(section.id);
    setEditTitle(section.title);
  };

  const handleSaveEdit = async (id: string) => {
    await fetch(`/api/sections/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: editTitle }),
    });
    setEditingId(null);
    fetchSections();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/sections/${id}`, { method: "DELETE" });
    fetchSections();
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

    const draggedIndex = sections.findIndex((s) => s.id === draggedId);
    const targetIndex = sections.findIndex((s) => s.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newSections = [...sections];
    const [draggedSection] = newSections.splice(draggedIndex, 1);
    newSections.splice(targetIndex, 0, draggedSection);

    setSections(newSections);
    setDraggedId(null);

    for (let i = 0; i < newSections.length; i++) {
      await fetch(`/api/sections/${newSections[i].id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayOrder: i + 1 }),
      });
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F9FAFB' }}>
      <div className="max-w-4xl mx-auto p-8">
        <div className="mb-8">
          <Link href="/admin" className="font-medium hover:opacity-75 transition" style={{ color: '#1B3A5C' }}>
            ← Back to Admin
          </Link>
        </div>

        <h2 className="text-3xl font-bold mb-6" style={{ color: '#2f2f30' }}>Manage Sections</h2>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h3 className="text-xl font-bold mb-4" style={{ color: '#2f2f30' }}>Add New Section</h3>
          <form onSubmit={handleAdd} className="flex gap-4">
            <input
              type="text"
              placeholder="Section name (e.g., Base Coat, Design Options)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="flex-1 border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:outline-none"
              style={{ '--tw-ring-color': '#1B3A5C' } as any}
            />
            <button
              type="submit"
              className="text-white px-6 py-2 rounded-md font-medium hover:opacity-90 transition"
              style={{ backgroundColor: '#1B3A5C' }}
            >
              Add
            </button>
          </form>
        </div>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="min-w-full">
            <thead className="border-b" style={{ backgroundColor: '#F9FAFB', borderColor: '#e5e7eb' }}>
              <tr>
                <th className="px-4 py-3 text-left font-semibold w-8" style={{ color: '#2f2f30' }}>⋮</th>
                <th className="px-6 py-3 text-left font-semibold" style={{ color: '#2f2f30' }}>Section Name</th>
                <th className="px-6 py-3 text-left font-semibold" style={{ color: '#2f2f30' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sections.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-center text-gray-500">
                    No sections yet
                  </td>
                </tr>
              ) : (
                sections.map((section) => (
                  <tr
                    key={section.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, section.id)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, section.id)}
                    className={`border-b hover:bg-gray-50 transition ${
                      draggedId === section.id ? "opacity-50" : ""
                    }`}
                    style={draggedId === section.id ? { backgroundColor: 'rgba(27, 58, 92, 0.08)' } : {}}
                  >
                    <td className="px-4 py-4 cursor-grab active:cursor-grabbing text-gray-400">
                      ⋮⋮
                    </td>
                    {editingId === section.id ? (
                      <>
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="border rounded px-3 py-1 w-full"
                          />
                        </td>
                        <td className="px-6 py-4 space-x-2">
                          <button
                            onClick={() => handleSaveEdit(section.id)}
                            className="text-sm font-semibold hover:opacity-75 transition"
                            style={{ color: '#1B3A5C' }}
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="text-sm hover:opacity-75 transition"
                            style={{ color: '#666666' }}
                          >
                            Cancel
                          </button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-6 py-4">{section.title}</td>
                        <td className="px-6 py-4 space-x-4">
                          <button
                            onClick={() => startEdit(section)}
                            className="hover:opacity-75 transition font-medium"
                            style={{ color: '#1B3A5C' }}
                          >
                            Edit
                          </button>
                          <Link
                            href={`/admin/products?section=${section.id}`}
                            className="hover:opacity-75 transition font-medium"
                            style={{ color: '#1B3A5C' }}
                          >
                            Products
                          </Link>
                          <button
                            onClick={() => handleDelete(section.id)}
                            className="hover:opacity-75 transition font-medium"
                            style={{ color: '#dc2626' }}
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
        <p className="text-sm mt-4" style={{ color: '#666666' }}>💡 Drag sections to reorder them</p>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
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

interface Section {
  id: string;
  title: string;
  displayOrder: number;
}

function SortableSectionRow({
  section,
  editingId,
  editTitle,
  onEditTitle,
  onSaveEdit,
  onCancelEdit,
  onStartEdit,
  onDelete,
}: {
  section: Section;
  editingId: string | null;
  editTitle: string;
  onEditTitle: (val: string) => void;
  onSaveEdit: (id: string) => void;
  onCancelEdit: () => void;
  onStartEdit: (section: Section) => void;
  onDelete: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    backgroundColor: isDragging ? "rgba(27, 58, 92, 0.08)" : "",
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
      {editingId === section.id ? (
        <>
          <td className="px-6 py-4">
            <input
              type="text"
              value={editTitle}
              onChange={(e) => onEditTitle(e.target.value)}
              className="border rounded px-3 py-1 w-full"
            />
          </td>
          <td className="px-6 py-4 space-x-2">
            <button
              onClick={() => onSaveEdit(section.id)}
              className="text-sm font-semibold hover:opacity-75 transition"
              style={{ color: "#1B3A5C" }}
            >
              Save
            </button>
            <button
              onClick={onCancelEdit}
              className="text-sm hover:opacity-75 transition"
              style={{ color: "#666666" }}
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
              onClick={() => onStartEdit(section)}
              className="hover:opacity-75 transition font-medium"
              style={{ color: "#1B3A5C" }}
            >
              Edit
            </button>
            <Link
              href={`/admin/products?section=${section.id}`}
              className="hover:opacity-75 transition font-medium"
              style={{ color: "#1B3A5C" }}
            >
              Products
            </Link>
            <button
              onClick={() => onDelete(section.id)}
              className="hover:opacity-75 transition font-medium"
              style={{ color: "#dc2626" }}
            >
              Delete
            </button>
          </td>
        </>
      )}
    </tr>
  );
}

export default function SectionsAdmin() {
  const [sections, setSections] = useState<Section[]>([]);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const { status } = useSession();
  const router = useRouter();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 5 },
    })
  );

  const sectionIds = useMemo(() => sections.map((s) => s.id), [sections]);

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

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = sections.findIndex((s) => s.id === active.id);
    const newIndex = sections.findIndex((s) => s.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const newSections = arrayMove(sections, oldIndex, newIndex);
    setSections(newSections);

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

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sectionIds}
            strategy={verticalListSortingStrategy}
          >
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
                      <SortableSectionRow
                        key={section.id}
                        section={section}
                        editingId={editingId}
                        editTitle={editTitle}
                        onEditTitle={setEditTitle}
                        onSaveEdit={handleSaveEdit}
                        onCancelEdit={() => setEditingId(null)}
                        onStartEdit={startEdit}
                        onDelete={handleDelete}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <p className="text-sm mt-4" style={{ color: '#666666' }}>💡 Grip and drag the ⋮⋮ handle to reorder sections</p>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}

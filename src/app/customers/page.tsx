"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface Estimate {
  id: string;
  totalPrice: number;
  createdAt: string;
  pdfUrl?: string;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  garageSqft: number;
  carPorts: number;
  createdAt?: string;
}

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [estimatesByCustomerId, setEstimatesByCustomerId] = useState<
    Record<string, Estimate[]>
  >({});
  const [expandedCustomerId, setExpandedCustomerId] = useState<string | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Customer | null>(null);
  const [savingCustomer, setSavingCustomer] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deletingCustomer, setDeletingCustomer] = useState(false);
  const { data: session, status } = useSession();
  const router = useRouter();
  const dropdownRefs = useRef<Record<string, HTMLDivElement | null>>({});


  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const res = await fetch("/api/customers");
      const data = await res.json();
      setCustomers(data);

      const estimatesMap: Record<string, Estimate[]> = {};
      for (const customer of data) {
        try {
          const estRes = await fetch(`/api/estimates?customerId=${customer.id}`);
          if (estRes.ok) {
            const estimates = await estRes.json();
            console.log(`Estimates for ${customer.id}:`, estimates);
            estimatesMap[customer.id] = estimates;
          } else {
            console.error(`Failed to fetch estimates for ${customer.id}: ${estRes.status}`);
          }
        } catch (error) {
          console.error(`Failed to fetch estimates for customer ${customer.id}:`, error);
        }
      }
      console.log("Final estimatesMap:", estimatesMap);
      setEstimatesByCustomerId(estimatesMap);
    } finally {
      setLoading(false);
    }
  };

  const toggleEstimates = (customerId: string) => {
    setExpandedCustomerId(expandedCustomerId === customerId ? null : customerId);
  };

  const toggleDropdown = (customerId: string) => {
    setOpenDropdownId(openDropdownId === customerId ? null : customerId);
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomerId(customer.id);
    setEditForm({ ...customer });
  };

  const handleCustomerFieldChange = (field: keyof Customer, value: any) => {
    if (editForm) {
      setEditForm({ ...editForm, [field]: value });
    }
  };

  const handleSaveCustomer = async () => {
    if (!editForm || !editingCustomerId) return;

    setSavingCustomer(true);
    try {
      const res = await fetch(`/api/customers/${editingCustomerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });

      if (!res.ok) {
        alert('Failed to save customer');
        setSavingCustomer(false);
        return;
      }

      setCustomers(customers.map(c => c.id === editingCustomerId ? editForm : c));
      setEditingCustomerId(null);
      setEditForm(null);
      setSavingCustomer(false);
    } catch (error) {
      console.error('Error saving customer:', error);
      setSavingCustomer(false);
      alert('Error saving customer');
    }
  };

  const handleDeleteCustomer = async () => {
    if (!editingCustomerId) return;

    setDeletingCustomer(true);
    try {
      const res = await fetch(`/api/customers/${editingCustomerId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        alert('Failed to delete customer');
        setDeletingCustomer(false);
        return;
      }

      setCustomers(customers.filter(c => c.id !== editingCustomerId));
      setEditingCustomerId(null);
      setEditForm(null);
      setConfirmDelete(false);
      setDeletingCustomer(false);
    } catch (error) {
      console.error('Error deleting customer:', error);
      setDeletingCustomer(false);
      alert('Error deleting customer');
    }
  };

  const filteredCustomers = customers.filter((customer) => {
    const search = searchTerm.toLowerCase();
    return (
      customer.name.toLowerCase().includes(search) ||
      customer.email.toLowerCase().includes(search) ||
      customer.phone.toLowerCase().includes(search) ||
      customer.garageSqft.toString().includes(search) ||
      customer.carPorts.toString().includes(search) ||
      (customer.createdAt && new Date(customer.createdAt).toLocaleDateString().includes(search))
    );
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openDropdownId && dropdownRefs.current[openDropdownId]) {
        if (!dropdownRefs.current[openDropdownId]?.contains(event.target as Node)) {
          setOpenDropdownId(null);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openDropdownId]);

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Garage Flooring Estimator</h1>
          <div className="flex gap-4">
            <Link
              href="/admin"
              className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
            >
              Admin Settings
            </Link>
            <button
              onClick={() => signOut()}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-3xl font-bold">Customers</h2>
          <Link
            href="/customers/new"
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            Add Customer
          </Link>
        </div>

        <div className="mb-6">
          <input
            type="text"
            placeholder="Search by name, email, phone, sqft, car ports, or date..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="bg-white rounded-lg shadow pb-64">
          <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="px-6 py-3 text-left font-semibold">Name</th>
                <th className="px-6 py-3 text-left font-semibold">Email</th>
                <th className="px-6 py-3 text-left font-semibold">Phone</th>
                <th className="px-6 py-3 text-left font-semibold">Sqft</th>
                <th className="px-6 py-3 text-left font-semibold">Car</th>
                <th className="px-6 py-3 text-left font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    {searchTerm ? 'No customers match your search' : 'No customers yet'}
                  </td>
                </tr>
              ) : (
                filteredCustomers.flatMap((customer) => {
                  const estimates = estimatesByCustomerId[customer.id] || [];
                  const isExpanded = expandedCustomerId === customer.id;

                  const rows = [
                    <tr key={customer.id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-gray-900">{customer.name}</p>
                          {customer.createdAt && (
                            <p className="text-xs text-gray-500">
                              {new Date(customer.createdAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">{customer.email}</td>
                      <td className="px-6 py-4">{customer.phone}</td>
                      <td className="px-6 py-4">{customer.garageSqft}</td>
                      <td className="px-6 py-4">{customer.carPorts}</td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2 items-center">
                          <button
                            onClick={() => handleEditCustomer(customer)}
                            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
                          >
                            ✎ Edit
                          </button>
                          {estimates && estimates.length > 0 ? (
                            <>
                              {estimates[0].pdfUrl ? (
                                <a
                                  href={estimates[0].pdfUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                                >
                                  📄 Signed Estimate
                                </a>
                              ) : (
                                <Link
                                  href={`/estimates/${estimates[0].id}/edit`}
                                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                                >
                                  Current Estimate
                                </Link>
                              )}

                              <div className="relative inline-block" ref={(el) => { if (el) dropdownRefs.current[customer.id] = el; }}>
                                <button
                                  onClick={() => toggleDropdown(customer.id)}
                                  className="bg-gray-200 text-gray-900 px-3 py-2 rounded hover:bg-gray-300"
                                >
                                  ▼ ({estimates.length})
                                </button>

                                {openDropdownId === customer.id && (
                                  <div className="absolute bottom-full right-0 mb-1 bg-white border border-gray-200 rounded shadow-lg z-50 min-w-56 max-h-64 overflow-y-auto">
                                    <div className="px-4 py-2 text-xs font-semibold text-gray-600 bg-gray-50 border-b sticky top-0">
                                      Saved Estimates ({estimates.length})
                                    </div>
                                    {Array.isArray(estimates) && estimates.map((estimate: any, idx: number) => {
                                      console.log("Rendering estimate:", estimate);
                                      return (
                                        <div key={estimate.id} className="border-b">
                                          <Link
                                            href={`/estimates/${estimate.id}/edit`}
                                            className="block px-4 py-2 hover:bg-blue-50 text-sm"
                                          >
                                            {idx === 0 && "⭐ "} ${(estimate.totalPrice || 0).toFixed(2)} • {new Date(estimate.createdAt).toLocaleDateString()}
                                          </Link>
                                          {estimate.pdfUrl && (
                                            <a
                                              href={estimate.pdfUrl}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="block px-4 py-1 text-xs text-green-600 hover:bg-green-50"
                                            >
                                              📄 Download PDF
                                            </a>
                                          )}
                                        </div>
                                      );
                                    })}
                                    <div className="border-t"></div>

                                    <Link
                                      href={`/estimates/new?customer=${customer.id}`}
                                      className="block px-4 py-2 hover:bg-green-50 text-sm text-green-700 font-semibold"
                                    >
                                      ➕ New Estimate
                                    </Link>
                                  </div>
                                )}
                              </div>
                            </>
                          ) : (
                            <Link
                              href={`/estimates/new?customer=${customer.id}`}
                              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                            >
                              New Estimate
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>,
                  ];

                  if (isExpanded && estimates.length > 0) {
                    rows.push(
                      <tr key={`${customer.id}-estimates`} className="bg-gray-50 border-b">
                        <td colSpan={6} className="px-6 py-4">
                          <div className="space-y-2">
                            <h4 className="font-semibold text-gray-700 mb-3">
                              Past Estimates ({estimates.length})
                            </h4>
                            <div className="space-y-2">
                              {estimates.map((estimate) => (
                                <div
                                  key={estimate.id}
                                  className="flex justify-between items-center p-3 bg-white rounded border border-gray-200"
                                >
                                  <div>
                                    <p className="font-semibold text-gray-900">
                                      ${estimate.totalPrice.toFixed(2)}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {new Date(estimate.createdAt).toLocaleDateString()}
                                    </p>
                                    {estimate.pdfUrl && (
                                      <a
                                        href={estimate.pdfUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-green-600 hover:underline"
                                      >
                                        📄 Download PDF
                                      </a>
                                    )}
                                  </div>
                                  <Link
                                    href={`/estimates/${estimate.id}/edit`}
                                    className="text-blue-600 hover:underline"
                                  >
                                    Edit
                                  </Link>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  return rows;
                })
              )}
            </tbody>
          </table>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {confirmDelete && editForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4 text-red-600">Delete Customer?</h2>
            <p className="text-gray-700 mb-2">
              Are you sure you want to delete <strong>{editForm.name}</strong>?
            </p>
            <p className="text-sm text-gray-600 mb-6">
              This action cannot be undone. All estimates and data associated with this customer will be deleted.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(false)}
                className="flex-1 bg-gray-300 text-gray-900 px-4 py-2 rounded font-semibold hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCustomer}
                disabled={deletingCustomer}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded font-semibold hover:bg-red-700 disabled:bg-gray-400"
              >
                {deletingCustomer ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingCustomerId && editForm && !confirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-6">Edit Customer</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => handleCustomerFieldChange('name', e.target.value)}
                  className="w-full px-4 py-2 border rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => handleCustomerFieldChange('email', e.target.value)}
                  className="w-full px-4 py-2 border rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => handleCustomerFieldChange('phone', e.target.value)}
                  className="w-full px-4 py-2 border rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Garage Sqft</label>
                <input
                  type="number"
                  value={editForm.garageSqft}
                  onChange={(e) => handleCustomerFieldChange('garageSqft', parseFloat(e.target.value))}
                  className="w-full px-4 py-2 border rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Car Ports</label>
                <select
                  value={editForm.carPorts}
                  onChange={(e) => handleCustomerFieldChange('carPorts', parseInt(e.target.value))}
                  className="w-full px-4 py-2 border rounded"
                >
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4+</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setEditingCustomerId(null);
                  setEditForm(null);
                  setConfirmDelete(false);
                }}
                className="flex-1 bg-gray-300 text-gray-900 px-4 py-2 rounded font-semibold hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCustomer}
                disabled={savingCustomer}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded font-semibold hover:bg-blue-700 disabled:bg-gray-400"
              >
                {savingCustomer ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => setConfirmDelete(true)}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded font-semibold hover:bg-red-700"
              >
                🗑 Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface Estimate {
  id: string;
  totalPrice: number;
  createdAt: string;
  updatedAt: string;
  status: string;
  pdfUrl?: string;
  estimatePdfUrl?: string;
  agreementPdfUrl?: string;
  customerSignedAt?: string | null;
  contractorSignatureDataUrl?: string | null;
}

const WarningBadge = () => (
  <span
    title="Customer signed — awaiting your signature"
    className="inline-flex items-center justify-center w-6 h-6 text-xs font-black flex-shrink-0"
    style={{
      clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
      backgroundColor: '#FBBF24',
      color: '#78350F',
      paddingTop: '6px',
    }}
  >
    !
  </span>
);

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  garageSqft: number;
  carPorts: number;
  createdAt?: string;
}

function getEstimatePriority(e: Estimate): number {
  if (e.contractorSignatureDataUrl) return 0;
  if (e.customerSignedAt && !e.contractorSignatureDataUrl) return 1;
  if (e.status === 'signed') return 2;
  if (e.status === 'sent') return 3;
  return 4;
}

function sortEstimates(estimates: Estimate[]): Estimate[] {
  return [...estimates].sort((a, b) => {
    const pa = getEstimatePriority(a);
    const pb = getEstimatePriority(b);
    if (pa !== pb) return pa - pb;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}

function getEstimateStatusInfo(e: Estimate): { label: string; bgColor: string; textColor: string } {
  if (e.contractorSignatureDataUrl || e.status === 'signed') {
    return { label: 'Signed', bgColor: '#D1FAE5', textColor: '#065F46' };
  }
  if (e.customerSignedAt) {
    return { label: 'Awaiting Your Sig', bgColor: '#FEF3C7', textColor: '#92400E' };
  }
  if (e.status === 'sent') {
    return { label: 'Sent', bgColor: '#DBEAFE', textColor: '#1E40AF' };
  }
  return { label: 'Draft', bgColor: '#F3F4F6', textColor: '#6B7280' };
}

function formatSummaryDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

type Tab = 'active' | 'signed' | 'no-estimates' | 'all';

function isFullySigned(e: Estimate): boolean {
  return !!(e.contractorSignatureDataUrl || e.status === 'signed');
}

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [estimatesByCustomerId, setEstimatesByCustomerId] = useState<Record<string, Estimate[]>>({});
  const [expandedCustomerId, setExpandedCustomerId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('active');
  const [loading, setLoading] = useState(true);
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Customer | null>(null);
  const [savingCustomer, setSavingCustomer] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deletingCustomer, setDeletingCustomer] = useState(false);
  const { data: session, status } = useSession();
  const router = useRouter();

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
            estimatesMap[customer.id] = sortEstimates(estimates);
          } else {
            console.error(`Failed to fetch estimates for ${customer.id}: ${estRes.status}`);
          }
        } catch (error) {
          console.error(`Failed to fetch estimates for customer ${customer.id}:`, error);
        }
      }
      setEstimatesByCustomerId(estimatesMap);
    } finally {
      setLoading(false);
    }
  };

  const toggleEstimates = (customerId: string) => {
    setExpandedCustomerId(expandedCustomerId === customerId ? null : customerId);
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

  // Tab counts computed from search-filtered list (before tab filter)
  const tabCounts = {
    active: filteredCustomers.filter(c => {
      const ests = estimatesByCustomerId[c.id] || [];
      return ests.length > 0 && !isFullySigned(ests[0]);
    }).length,
    signed: filteredCustomers.filter(c => {
      const ests = estimatesByCustomerId[c.id] || [];
      return ests.length > 0 && isFullySigned(ests[0]);
    }).length,
    'no-estimates': filteredCustomers.filter(c => (estimatesByCustomerId[c.id] || []).length === 0).length,
    all: filteredCustomers.length,
  };

  // Tab filter applied on top of search filter
  const displayCustomers = filteredCustomers.filter(c => {
    const ests = estimatesByCustomerId[c.id] || [];
    if (activeTab === 'all')          return true;
    if (activeTab === 'no-estimates') return ests.length === 0;
    if (activeTab === 'signed')       return ests.length > 0 && isFullySigned(ests[0]);
    if (activeTab === 'active')       return ests.length > 0 && !isFullySigned(ests[0]);
    return true;
  });

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setExpandedCustomerId(null);
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F9FAFB' }}>
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-2xl md:text-3xl font-bold" style={{ color: '#2f2f30' }}>Customers</h2>
          <Link
            href="/customers/new"
            className="text-white px-4 py-2 rounded-md font-medium hover:opacity-90 transition text-sm md:text-base"
            style={{ backgroundColor: '#1B3A5C' }}
          >
            + Add
          </Link>
        </div>

        <div className="mb-4">
          <input
            type="text"
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2"
            style={{ '--tw-ring-color': '#1B3A5C' } as any}
          />
        </div>

        {/* Tab bar */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {([
            { key: 'active',       label: 'Active' },
            { key: 'signed',       label: 'Signed' },
            { key: 'no-estimates', label: 'No Estimates' },
            { key: 'all',          label: 'All' },
          ] as { key: Tab; label: string }[]).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => handleTabChange(key)}
              className="flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition hover:opacity-90"
              style={activeTab === key
                ? { backgroundColor: '#1B3A5C', color: '#ffffff' }
                : { backgroundColor: '#F3F4F6', color: '#374151' }
              }
            >
              {label} <span className="ml-1 opacity-75">({tabCounts[key]})</span>
            </button>
          ))}
        </div>

        {/* Mobile Card List */}
        <div className="md:hidden space-y-3 mb-4">
          {displayCustomers.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              {searchTerm ? 'No customers match your search' : 'No customers yet'}
            </p>
          ) : displayCustomers.map((customer) => {
            const estimates = estimatesByCustomerId[customer.id] || [];
            const priorityEstimate = estimates[0];
            const isExpanded = expandedCustomerId === customer.id;
            const hasWarning = estimates.some(e => e.customerSignedAt && !e.contractorSignatureDataUrl);

            return (
              <div key={customer.id} className="bg-white rounded-lg shadow-sm p-4">
                {/* Header */}
                <div className="flex justify-between items-start mb-1">
                  <div className="flex-1 min-w-0 mr-2">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-semibold text-gray-900 text-base">{customer.name}</p>
                      {hasWarning && <WarningBadge />}
                    </div>
                    {/* At-a-glance estimate summary */}
                    {priorityEstimate && (() => {
                      const { label, textColor } = getEstimateStatusInfo(priorityEstimate);
                      return (
                        <p className="text-xs" style={{ color: '#6B7280' }}>
                          <span className="font-semibold" style={{ color: '#2f2f30' }}>
                            ${priorityEstimate.totalPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                          {' · '}
                          <span style={{ color: textColor }}>{label}</span>
                          {' · '}
                          {formatSummaryDate(priorityEstimate.updatedAt)}
                        </p>
                      );
                    })()}
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0 pt-0.5">
                    {estimates.length} estimate{estimates.length !== 1 ? 's' : ''}
                  </span>
                </div>

                <p className="text-sm text-gray-600 mt-2">{customer.phone}</p>
                <div className="flex gap-3 mt-1 mb-2">
                  <a href={`tel:${customer.phone}`} className="text-sm font-medium text-blue-600">Call</a>
                  <a href={`sms:${customer.phone}`} className="text-sm font-medium text-green-600">Text</a>
                </div>
                <p className="text-sm text-gray-500 mb-3">{customer.garageSqft} sqft · {customer.carPorts} car</p>

                {/* Primary action buttons */}
                <div className="flex gap-2 mb-2">
                  <button
                    onClick={() => handleEditCustomer(customer)}
                    className="text-white py-2 px-3 rounded-md text-sm font-medium hover:opacity-90 transition flex-shrink-0"
                    style={{ backgroundColor: '#1B3A5C' }}
                  >
                    Edit
                  </button>
                  {priorityEstimate ? (
                    <Link
                      href={`/estimates/${priorityEstimate.id}/edit`}
                      className="flex-1 text-white py-2 rounded-md text-sm font-medium hover:opacity-90 transition text-center"
                      style={{
                        backgroundColor: (priorityEstimate.contractorSignatureDataUrl || priorityEstimate.status === 'signed')
                          ? '#059669'
                          : '#1B3A5C'
                      }}
                    >
                      Open Estimate →
                    </Link>
                  ) : (
                    <Link
                      href={`/estimates/new?customer=${customer.id}`}
                      className="flex-1 text-white py-2 rounded-md text-sm font-medium hover:opacity-90 transition text-center"
                      style={{ backgroundColor: '#059669' }}
                    >
                      + New Estimate
                    </Link>
                  )}
                </div>

                {/* Expand toggle — shown when at least one estimate exists */}
                {estimates.length > 0 && (
                  <button
                    onClick={() => toggleEstimates(customer.id)}
                    className="w-full text-left text-sm py-1.5 px-2 rounded hover:bg-gray-50 transition flex items-center justify-between"
                    style={{ color: '#1B3A5C' }}
                  >
                    <span>{isExpanded ? '▲' : '▾'} All Estimates ({estimates.length})</span>
                  </button>
                )}

                {/* Expanded estimate list */}
                {isExpanded && (
                  <div className="mt-2 space-y-2 border-t pt-3">
                    {estimates.map((estimate, idx) => {
                      const { label, bgColor, textColor } = getEstimateStatusInfo(estimate);
                      return (
                        <div
                          key={estimate.id}
                          className="flex items-center justify-between p-2 rounded-md border border-gray-100 bg-gray-50"
                        >
                          <div className="min-w-0 mr-2">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {idx === 0 && <span className="text-yellow-500 text-xs">★</span>}
                              <span className="text-sm font-semibold text-gray-900">
                                ${estimate.totalPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                              <span
                                className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                                style={{ backgroundColor: bgColor, color: textColor }}
                              >
                                {label}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">{formatSummaryDate(estimate.updatedAt)}</p>
                          </div>
                          <Link
                            href={`/estimates/${estimate.id}/edit`}
                            className="text-white text-xs px-3 py-1.5 rounded-md font-medium hover:opacity-90 transition flex-shrink-0"
                            style={{ backgroundColor: '#1B3A5C' }}
                          >
                            Open
                          </Link>
                        </div>
                      );
                    })}
                    {/* Always-visible new estimate option */}
                    <Link
                      href={`/estimates/new?customer=${customer.id}`}
                      className="block w-full text-center py-2 rounded-md text-sm font-semibold hover:opacity-90 transition border-2 border-dashed"
                      style={{ color: '#059669', borderColor: '#059669' }}
                    >
                      + New Estimate
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block bg-white rounded-lg shadow-sm pb-64">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="border-b" style={{ backgroundColor: '#F9FAFB', borderColor: '#e5e7eb' }}>
                <tr>
                  <th className="px-6 py-3 text-left font-semibold" style={{ color: '#2f2f30' }}>Name</th>
                  <th className="px-6 py-3 text-left font-semibold" style={{ color: '#2f2f30' }}>Email</th>
                  <th className="px-6 py-3 text-left font-semibold" style={{ color: '#2f2f30' }}>Phone</th>
                  <th className="px-6 py-3 text-left font-semibold" style={{ color: '#2f2f30' }}>Sqft</th>
                  <th className="px-6 py-3 text-left font-semibold" style={{ color: '#2f2f30' }}>Car</th>
                  <th className="px-6 py-3 text-left font-semibold" style={{ color: '#2f2f30' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                      {searchTerm ? 'No customers match your search' : 'No customers yet'}
                    </td>
                  </tr>
                ) : (
                  displayCustomers.flatMap((customer) => {
                    const estimates = estimatesByCustomerId[customer.id] || [];
                    const priorityEstimate = estimates[0];
                    const isExpanded = expandedCustomerId === customer.id;
                    const hasWarning = estimates.some(e => e.customerSignedAt && !e.contractorSignatureDataUrl);

                    const rows = [
                      <tr key={customer.id} className="border-b hover:bg-gray-50">
                        {/* Name cell — includes at-a-glance summary */}
                        <td className="px-6 py-4">
                          <div className="flex items-start gap-2">
                            <p className="font-semibold text-gray-900">{customer.name}</p>
                            {hasWarning && <WarningBadge />}
                          </div>
                          {priorityEstimate && (() => {
                            const { label, textColor } = getEstimateStatusInfo(priorityEstimate);
                            return (
                              <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>
                                <span className="font-semibold" style={{ color: '#2f2f30' }}>
                                  ${priorityEstimate.totalPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                                {' · '}
                                <span style={{ color: textColor }}>{label}</span>
                                {' · '}
                                {formatSummaryDate(priorityEstimate.updatedAt)}
                              </p>
                            );
                          })()}
                          {customer.createdAt && (
                            <p className="text-xs text-gray-400 mt-1">
                              Added {new Date(customer.createdAt).toLocaleDateString()}
                            </p>
                          )}
                        </td>
                        <td className="px-6 py-4">{customer.email}</td>
                        <td className="px-6 py-4">
                          <div>{customer.phone}</div>
                          <div className="flex gap-3 mt-1">
                            <a href={`tel:${customer.phone}`} className="text-xs font-medium text-blue-600">Call</a>
                            <a href={`sms:${customer.phone}`} className="text-xs font-medium text-green-600">Text</a>
                          </div>
                        </td>
                        <td className="px-6 py-4">{customer.garageSqft}</td>
                        <td className="px-6 py-4">{customer.carPorts}</td>
                        {/* Actions cell */}
                        <td className="px-6 py-4">
                          <div className="flex gap-2 items-center flex-wrap">
                            <button
                              onClick={() => handleEditCustomer(customer)}
                              className="text-white px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 transition"
                              style={{ backgroundColor: '#1B3A5C' }}
                            >
                              Edit
                            </button>
                            {priorityEstimate ? (
                              <>
                                <Link
                                  href={`/estimates/${priorityEstimate.id}/edit`}
                                  className="text-white px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 transition"
                                  style={{
                                    backgroundColor: (priorityEstimate.contractorSignatureDataUrl || priorityEstimate.status === 'signed')
                                      ? '#059669'
                                      : '#1B3A5C'
                                  }}
                                >
                                  Open Estimate →
                                </Link>
                                <button
                                  onClick={() => toggleEstimates(customer.id)}
                                  className="px-3 py-2 rounded-md text-sm font-medium hover:opacity-90 transition"
                                  style={{ backgroundColor: '#F3F4F6', color: '#374151' }}
                                >
                                  {isExpanded ? '▲' : '▾'} All ({estimates.length})
                                </button>
                              </>
                            ) : (
                              <Link
                                href={`/estimates/new?customer=${customer.id}`}
                                className="text-white px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 transition"
                                style={{ backgroundColor: '#059669' }}
                              >
                                + New Estimate
                              </Link>
                            )}
                          </div>
                        </td>
                      </tr>,
                    ];

                    if (isExpanded) {
                      rows.push(
                        <tr key={`${customer.id}-estimates`} className="bg-gray-50 border-b">
                          <td colSpan={6} className="px-6 py-4">
                            <h4 className="font-semibold text-gray-700 mb-3">
                              All Estimates ({estimates.length})
                            </h4>
                            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                              {estimates.map((estimate, idx) => {
                                const { label, bgColor, textColor } = getEstimateStatusInfo(estimate);
                                return (
                                  <div
                                    key={estimate.id}
                                    className="flex justify-between items-center p-3 bg-white rounded-md border border-gray-200"
                                  >
                                    <div className="min-w-0 mr-2">
                                      <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                                        {idx === 0 && <span className="text-yellow-500 text-xs">★</span>}
                                        <p className="font-semibold text-gray-900 text-sm">
                                          ${estimate.totalPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </p>
                                        <span
                                          className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                                          style={{ backgroundColor: bgColor, color: textColor }}
                                        >
                                          {label}
                                        </span>
                                      </div>
                                      <p className="text-xs text-gray-500">{formatSummaryDate(estimate.updatedAt)}</p>
                                    </div>
                                    <Link
                                      href={`/estimates/${estimate.id}/edit`}
                                      className="text-white text-xs px-3 py-1.5 rounded-md font-medium hover:opacity-90 transition flex-shrink-0"
                                      style={{ backgroundColor: '#1B3A5C' }}
                                    >
                                      Open
                                    </Link>
                                  </div>
                                );
                              })}
                              {/* New estimate card */}
                              <Link
                                href={`/estimates/new?customer=${customer.id}`}
                                className="flex items-center justify-center p-3 rounded-md border-2 border-dashed text-sm font-semibold hover:opacity-90 transition"
                                style={{ color: '#059669', borderColor: '#059669', backgroundColor: '#F0FDF4' }}
                              >
                                + New Estimate
                              </Link>
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
            <h2 className="text-2xl font-bold mb-4" style={{ color: '#dc2626' }}>Delete Customer?</h2>
            <p className="text-gray-700 mb-2">
              Are you sure you want to delete <strong>{editForm.name}</strong>?
            </p>
            <p className="text-sm text-gray-600 mb-6">
              This action cannot be undone. All estimates and data associated with this customer will be deleted.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(false)}
                className="flex-1 px-4 py-2 rounded-md font-semibold hover:opacity-90 transition text-gray-900"
                style={{ backgroundColor: '#e5e7eb' }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCustomer}
                disabled={deletingCustomer}
                className="flex-1 text-white px-4 py-2 rounded-md font-semibold hover:opacity-90 transition disabled:opacity-50"
                style={{ backgroundColor: '#dc2626' }}
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
            <h2 className="text-2xl font-bold mb-6" style={{ color: '#2f2f30' }}>Edit Customer</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1" style={{ color: '#2f2f30' }}>Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => handleCustomerFieldChange('name', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:outline-none"
                  style={{ '--tw-ring-color': '#1B3A5C' } as any}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1" style={{ color: '#2f2f30' }}>Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => handleCustomerFieldChange('email', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:outline-none"
                  style={{ '--tw-ring-color': '#1B3A5C' } as any}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1" style={{ color: '#2f2f30' }}>Phone</label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => handleCustomerFieldChange('phone', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:outline-none"
                  style={{ '--tw-ring-color': '#1B3A5C' } as any}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1" style={{ color: '#2f2f30' }}>Garage Sqft</label>
                <input
                  type="number"
                  value={editForm.garageSqft}
                  onChange={(e) => handleCustomerFieldChange('garageSqft', parseFloat(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:outline-none"
                  style={{ '--tw-ring-color': '#1B3A5C' } as any}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1" style={{ color: '#2f2f30' }}>Car Ports</label>
                <select
                  value={editForm.carPorts}
                  onChange={(e) => handleCustomerFieldChange('carPorts', parseInt(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:outline-none"
                  style={{ '--tw-ring-color': '#1B3A5C' } as any}
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
                className="flex-1 px-4 py-2 rounded-md font-semibold hover:opacity-90 transition text-gray-900"
                style={{ backgroundColor: '#e5e7eb' }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCustomer}
                disabled={savingCustomer}
                className="flex-1 text-white px-4 py-2 rounded-md font-semibold hover:opacity-90 transition disabled:opacity-50"
                style={{ backgroundColor: '#1B3A5C' }}
              >
                {savingCustomer ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => setConfirmDelete(true)}
                className="flex-1 text-white px-4 py-2 rounded-md font-semibold hover:opacity-90 transition"
                style={{ backgroundColor: '#dc2626' }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

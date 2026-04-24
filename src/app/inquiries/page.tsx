'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface PlatinumInquiry {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  projectType: string;
  garageSize: string;
  coatingSystem?: string;
  projectDetails?: string;
  address?: string;
  createdAt: string;
}

export default function InquiriesPage() {
  const [inquiries, setInquiries] = useState<PlatinumInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchInquiries();
  }, []);

  async function fetchInquiries() {
    try {
      const res = await fetch('/api/inquiries/get');
      if (res.ok) {
        const data = await res.json();
        setInquiries(data);
      }
    } catch (error) {
      console.error('Failed to fetch inquiries:', error);
    } finally {
      setLoading(false);
    }
  }

  async function createCustomerFromInquiry(inquiry: PlatinumInquiry) {
    try {
      // Map garage size to car ports and square footage
      const garageMap: Record<string, { carPorts: number; sqft: number | string }> = {
        '1 Car': { carPorts: 1, sqft: 200 },
        '2 Car': { carPorts: 2, sqft: 400 },
        '3 Car': { carPorts: 3, sqft: 600 },
        '4 Car': { carPorts: 4, sqft: 800 },
        '5+ Car': { carPorts: 5, sqft: 1000 },
        'Commercial Site': { carPorts: 10, sqft: 'unknown' },
      };

      const garageInfo = garageMap[inquiry.garageSize] || { carPorts: 2, sqft: 400 };

      // Extract city from address if available
      const addressParts = inquiry.address?.split(',') || [];
      const city = addressParts.length > 1 ? addressParts[1].trim() : '';

      const customerData = {
        name: `${inquiry.firstName} ${inquiry.lastName}`,
        phone: inquiry.phone,
        email: '', // Empty email - user can fill in later
        street: inquiry.address || '',
        city: city || '',
        state: 'TX', // Default to Texas
        zip: '',
        garageSqft: typeof garageInfo.sqft === 'number' ? garageInfo.sqft : 5000,
        carPorts: garageInfo.carPorts,
        notes: `Project Type: ${inquiry.projectType}\nCoating System: ${inquiry.coatingSystem || 'Not specified'}\nDetails: ${inquiry.projectDetails || 'None provided'}\n\nFrom Platinum Installs Inquiry`,
      };

      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerData),
      });

      if (res.ok) {
        const customer = await res.json();
        alert(`Customer created! Redirecting to estimate builder...`);
        router.push(`/estimates/new?customer=${customer.id}`);
      }
    } catch (error) {
      console.error('Failed to create customer:', error);
      alert('Error creating customer. Please try again.');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">Loading inquiries...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Platinum Installs Inquiries</h1>
          <p className="text-slate-600">
            {inquiries.length} {inquiries.length === 1 ? 'inquiry' : 'inquiries'} received
          </p>
        </div>

        {inquiries.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-slate-500 text-lg">No inquiries yet</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {inquiries.map((inquiry) => (
              <div key={inquiry.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">
                      {inquiry.firstName} {inquiry.lastName}
                    </h2>
                    <p className="text-slate-600">{inquiry.phone}</p>
                  </div>
                  <button
                    onClick={() => createCustomerFromInquiry(inquiry)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition"
                  >
                    Create Customer & Start Estimate
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-slate-500 font-semibold">PROJECT TYPE</p>
                    <p className="text-slate-900">{inquiry.projectType || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 font-semibold">GARAGE SIZE</p>
                    <p className="text-slate-900">{inquiry.garageSize || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 font-semibold">COATING SYSTEM</p>
                    <p className="text-slate-900">{inquiry.coatingSystem || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 font-semibold">RECEIVED</p>
                    <p className="text-slate-900">
                      {new Date(inquiry.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                {inquiry.address && (
                  <div className="mb-4">
                    <p className="text-sm text-slate-500 font-semibold">ADDRESS</p>
                    <p className="text-slate-900">{inquiry.address}</p>
                  </div>
                )}

                {inquiry.projectDetails && (
                  <div>
                    <p className="text-sm text-slate-500 font-semibold">PROJECT DETAILS</p>
                    <p className="text-slate-900 whitespace-pre-wrap">{inquiry.projectDetails}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

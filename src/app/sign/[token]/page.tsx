'use client';

import { useEffect, useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';

interface EstimateData {
  id: string;
  customer: {
    name: string;
    street: string;
    city: string;
    state: string;
    zip: string;
    phone: string;
    email: string;
    garageSqft?: number;
  };
  items: Array<{
    productId: string;
    name: string;
    totalPrice: number;
  }>;
  totalPrice: number;
  quoteType: string;
  exteriorSqft?: number;
  signatureDataUrl?: string;
  customerSignedAt?: string;
  contractorSignatureDataUrl?: string;
  installationDate?: string;
}

export default function SignPage({ params }: { params: Promise<{ token: string }> }) {
  const [estimate, setEstimate] = useState<EstimateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successCustomerName, setSuccessCustomerName] = useState('');
  const signaturePadRef = useRef<SignatureCanvas>(null);
  const [token, setToken] = useState<string>('');

  useEffect(() => {
    (async () => {
      const resolvedParams = await params;
      setToken(resolvedParams.token);
    })();
  }, [params]);

  useEffect(() => {
    if (!token) return;

    const fetchEstimate = async () => {
      try {
        const res = await fetch(`/api/estimates/${token}?byToken=true`);
        if (!res.ok) {
          setError('Signing link not found or has expired.');
          setLoading(false);
          return;
        }
        const data = await res.json();
        setEstimate(data.estimate);
        setLoading(false);
      } catch (err) {
        setError('Failed to load agreement.');
        setLoading(false);
      }
    };

    fetchEstimate();
  }, [token]);

  const handleSignatureSubmit = async () => {
    if (!signaturePadRef.current?.toDataURL()) {
      alert('Please sign before submitting.');
      return;
    }

    setSubmitting(true);
    try {
      const signatureData = signaturePadRef.current.toDataURL();

      const res = await fetch(`/api/sign/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signatureDataUrl: signatureData }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to submit signature');
      }

      if (estimate) {
        setSuccessCustomerName(estimate.customer.name);
      }
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit signature');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading agreement...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md text-center">
          <p className="text-red-600 font-semibold mb-4">{error}</p>
          <p className="text-gray-600 text-sm">Please contact Platinum Installs for a new signing link.</p>
        </div>
      </div>
    );
  }

  if (!estimate) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <p className="text-gray-600">Agreement not found.</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4 py-12">
        <div className="bg-white rounded-2xl shadow-lg max-w-md w-full overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-6 text-center">
            <div className="text-5xl mb-3">✓</div>
            <h1 className="text-2xl font-bold text-white">Signature Received</h1>
          </div>
          <div className="p-6 space-y-4 text-center">
            <p className="text-gray-800 text-lg font-medium">
              Thank you, {successCustomerName}!
            </p>
            <p className="text-gray-600">
              Your signature has been received. Copies of your signed estimate and service agreement will be emailed to you once the contractor has added their signature.
            </p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-800">
              Our team will be in touch to confirm your installation details.
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (estimate.customerSignedAt) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md text-center">
          <p className="text-gray-600">This agreement has already been signed. Thank you!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
            <h1 className="text-2xl font-bold text-white">Review & Sign Agreement</h1>
            <p className="text-blue-100 mt-1">Please review the agreement below and sign to proceed</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 p-6">
            <div className="lg:col-span-1">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Estimate</h3>
              <div className="bg-gray-50 rounded-lg border border-gray-200 p-2 h-80 overflow-auto">
                {token && (
                  <iframe
                    src={`/api/sign/${token}/estimate-pdf`}
                    className="w-full h-full border-0"
                    title="Estimate"
                  />
                )}
              </div>
            </div>

            <div className="lg:col-span-1">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Service Agreement</h3>
              <div className="bg-gray-50 rounded-lg border border-gray-200 p-2 h-80 overflow-auto">
                {token && (
                  <iframe
                    src={`/api/sign/${token}/pdf`}
                    className="w-full h-full border-0"
                    title="Service Agreement"
                  />
                )}
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h2 className="font-semibold text-gray-800 mb-4">Your Signature</h2>
                <div className="border-2 border-gray-300 rounded bg-white mb-4 cursor-crosshair" style={{ height: '200px' }}>
                  <SignatureCanvas
                    ref={signaturePadRef}
                    canvasProps={{
                      className: 'w-full h-full',
                    }}
                  />
                </div>
                <button
                  onClick={() => {
                    signaturePadRef.current?.clear();
                  }}
                  className="w-full mb-3 px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded hover:bg-gray-50 font-medium"
                >
                  Clear Signature
                </button>
                <button
                  onClick={handleSignatureSubmit}
                  disabled={submitting}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 font-semibold"
                >
                  {submitting ? 'Submitting...' : 'Submit Signature'}
                </button>
              </div>

              <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-600">
                  <strong>Name:</strong> {estimate.customer.name}
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  <strong>Agreement Total:</strong> ${estimate.totalPrice.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

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

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return '';
  try {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export default function SignPage({ params }: { params: Promise<{ token: string }> }) {
  const [estimate, setEstimate] = useState<EstimateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(1);
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
      } catch {
        setError('Failed to load agreement.');
        setLoading(false);
      }
    };
    fetchEstimate();
  }, [token]);

  const handleSubmit = async () => {
    if (!signaturePadRef.current || signaturePadRef.current.isEmpty()) {
      alert('Please draw your signature before submitting.');
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
      if (estimate) setSuccessCustomerName(estimate.customer.name);
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
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-800 mx-auto mb-4" />
          <p className="text-gray-600 text-sm">Loading your agreement...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-sm w-full text-center">
          <p className="text-red-600 font-semibold mb-3">{error}</p>
          <p className="text-gray-500 text-sm">Please contact Platinum Installs for a new signing link.</p>
        </div>
      </div>
    );
  }

  if (!estimate) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-gray-600">Agreement not found.</p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4 py-12">
        <div className="bg-white rounded-2xl shadow-lg max-w-sm w-full overflow-hidden">
          <div className="bg-[#2f2f30] px-6 py-8 text-center">
            <div className="w-14 h-14 rounded-full bg-green-500 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-white">Signature Received</h1>
          </div>
          <div className="p-6 text-center space-y-4">
            <p className="text-gray-800 font-medium">Thank you, {successCustomerName}!</p>
            <p className="text-gray-500 text-sm leading-relaxed">
              Your signature has been received. Copies of your signed estimate and service agreement will be emailed to you once the contractor has countersigned.
            </p>
            <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
              Our team will be in touch to confirm your installation details.
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (estimate.customerSignedAt) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-sm w-full text-center">
          <p className="text-gray-700 font-medium mb-2">Already signed</p>
          <p className="text-gray-500 text-sm">This agreement has already been signed. Thank you!</p>
        </div>
      </div>
    );
  }

  const docTitle =
    estimate.quoteType === 'exterior' ? 'Exterior Concrete Sealer Proposal' :
    estimate.quoteType === 'both' ? 'Floor Coating & Sealer Proposal' :
    'Garage Floor Proposal';

  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="min-h-screen bg-gray-100">

      {/* Top header */}
      <div className="bg-[#2f2f30] px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div>
          <div className="text-white font-bold text-sm tracking-widest">PLATINUM INSTALLS</div>
          <div className="text-gray-400 text-xs mt-0.5">Review &amp; Sign</div>
        </div>
        <div className="text-gray-400 text-xs">Step {step} of 3</div>
      </div>

      {/* Step progress */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center max-w-xs mx-auto">
          {(['Estimate', 'Agreement', 'Sign'] as const).map((label, i) => {
            const num = i + 1;
            const done = step > num;
            const active = step === num;
            return (
              <div key={label} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    done ? 'bg-green-500 text-white' :
                    active ? 'bg-[#2f2f30] text-white' :
                    'bg-gray-200 text-gray-400'
                  }`}>
                    {done ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : num}
                  </div>
                  <span className={`text-xs mt-1 whitespace-nowrap ${active ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
                    {label}
                  </span>
                </div>
                {i < 2 && (
                  <div className={`h-px flex-1 mx-2 mb-4 transition-colors ${done ? 'bg-green-500' : 'bg-gray-200'}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── STEP 1: ESTIMATE ── */}
      {step === 1 && (
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">

          {/* Proposal header card */}
          <div className="bg-[#2f2f30] rounded-xl p-5 text-white">
            <div className="text-xs text-gray-400 tracking-widest uppercase mb-1">Proposal</div>
            <div className="text-xl font-bold">{docTitle}</div>
            <div className="text-gray-400 text-xs mt-1">#{estimate.id.slice(-8).toUpperCase()} &nbsp;·&nbsp; {today}</div>
          </div>

          {/* Customer info */}
          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Prepared For</div>
            <div className="font-semibold text-gray-900">{estimate.customer.name}</div>
            <div className="text-sm text-gray-500 mt-1 space-y-0.5">
              <div>{estimate.customer.street}</div>
              <div>{estimate.customer.city}, {estimate.customer.state} {estimate.customer.zip}</div>
              <div>{estimate.customer.phone}</div>
              <div>{estimate.customer.email}</div>
            </div>
            {estimate.installationDate && (
              <div className="mt-3 pt-3 border-t border-gray-100 text-sm">
                <span className="text-gray-400">Scheduled Install: </span>
                <span className="font-medium text-gray-800">{formatDate(estimate.installationDate)}</span>
              </div>
            )}
          </div>

          {/* Scope summary */}
          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Scope of Work</div>
            {estimate.quoteType === 'exterior' ? (
              <ul className="text-sm text-gray-600 space-y-1.5">
                <li className="flex gap-2"><span className="text-gray-400 mt-0.5">•</span>Professional surface cleaning and degreasing</li>
                <li className="flex gap-2"><span className="text-gray-400 mt-0.5">•</span>Concrete preparation and inspection</li>
                <li className="flex gap-2"><span className="text-gray-400 mt-0.5">•</span>Siliconate penetrating sealer application</li>
                <li className="flex gap-2"><span className="text-gray-400 mt-0.5">•</span>Siloxane water-repellent topcoat</li>
                <li className="flex gap-2"><span className="text-gray-400 mt-0.5">•</span>Edge and joint detailing</li>
              </ul>
            ) : estimate.quoteType === 'both' ? (
              <>
                <div className="text-xs font-semibold text-gray-700 mb-1">Interior — Garage Floor Coating</div>
                <ul className="text-sm text-gray-600 space-y-1 mb-3">
                  <li className="flex gap-2"><span className="text-gray-400 mt-0.5">•</span>Diamond grinding surface prep</li>
                  <li className="flex gap-2"><span className="text-gray-400 mt-0.5">•</span>Epoxy base coat</li>
                  <li className="flex gap-2"><span className="text-gray-400 mt-0.5">•</span>Polyaspartic top coat</li>
                </ul>
                <div className="text-xs font-semibold text-gray-700 mb-1">Exterior — Concrete Sealing</div>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li className="flex gap-2"><span className="text-gray-400 mt-0.5">•</span>Surface cleaning and preparation</li>
                  <li className="flex gap-2"><span className="text-gray-400 mt-0.5">•</span>Siliconate penetrating sealer</li>
                  <li className="flex gap-2"><span className="text-gray-400 mt-0.5">•</span>Siloxane water-repellent topcoat</li>
                </ul>
              </>
            ) : (
              <ul className="text-sm text-gray-600 space-y-1.5">
                <li className="flex gap-2"><span className="text-gray-400 mt-0.5">•</span>Diamond grinding surface prep</li>
                <li className="flex gap-2"><span className="text-gray-400 mt-0.5">•</span>Crack and joint repair (as needed)</li>
                <li className="flex gap-2"><span className="text-gray-400 mt-0.5">•</span>Epoxy base coat</li>
                <li className="flex gap-2"><span className="text-gray-400 mt-0.5">•</span>Decorative flake broadcast</li>
                <li className="flex gap-2"><span className="text-gray-400 mt-0.5">•</span>Polyaspartic top coat</li>
                <li className="flex gap-2"><span className="text-gray-400 mt-0.5">•</span>Clean edge work and detail finishing</li>
              </ul>
            )}
          </div>

          {/* Line items */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 pt-5 pb-2">
              <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Services</div>
            </div>
            <div className="divide-y divide-gray-100">
              {estimate.items.map((item) => (
                <div key={item.productId} className="flex justify-between items-center px-5 py-3">
                  <span className="text-sm text-gray-700">{item.name}</span>
                  <span className={`text-sm font-medium tabular-nums ${item.totalPrice < 0 ? 'text-green-600' : 'text-gray-900'}`}>
                    {item.totalPrice === 0 ? '' : item.totalPrice < 0 ? `-$${Math.abs(item.totalPrice).toFixed(2)}` : `$${item.totalPrice.toFixed(2)}`}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center px-5 py-4 border-t-2 border-gray-900">
              <span className="font-bold text-gray-900 text-sm uppercase tracking-wide">Total</span>
              <span className="text-2xl font-bold text-gray-900 tabular-nums">${estimate.totalPrice.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment split */}
          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Payment Schedule</div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Deposit to schedule</span>
                <span className="font-semibold text-gray-900 tabular-nums">${(estimate.totalPrice / 2).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Balance due at completion</span>
                <span className="font-semibold text-gray-900 tabular-nums">${(estimate.totalPrice / 2).toFixed(2)}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setStep(2)}
            className="w-full bg-[#2f2f30] text-white py-4 rounded-xl font-semibold text-sm tracking-wide hover:bg-gray-800 active:bg-gray-900 transition-colors"
          >
            Review Service Agreement →
          </button>
        </div>
      )}

      {/* ── STEP 2: AGREEMENT ── */}
      {step === 2 && (
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">

          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="text-center border-b border-gray-200 pb-4 mb-4">
              <div className="font-bold text-gray-900 tracking-wider">PLATINUM INSTALLS</div>
              <div className="text-xs text-gray-400 mt-1 uppercase tracking-widest">Service Agreement</div>
            </div>

            {/* Customer fields */}
            <div className="space-y-2 mb-4 text-sm">
              {[
                ['Customer Name', estimate.customer.name],
                ['Service Address', estimate.customer.street],
                ['City, State, ZIP', `${estimate.customer.city}, ${estimate.customer.state} ${estimate.customer.zip}`],
                ['Phone / Email', `${estimate.customer.phone} / ${estimate.customer.email}`],
                ['Scheduled Installation Date', formatDate(estimate.installationDate)],
              ].map(([label, value]) => (
                <div key={label} className="flex gap-3 items-end pb-1 border-b border-gray-100">
                  <span className="text-gray-400 text-xs font-medium w-44 shrink-0">{label}</span>
                  <span className="text-gray-800 text-xs flex-1">{value}</span>
                </div>
              ))}
            </div>

            {/* Clauses */}
            <div className="space-y-4 mt-5">
              {[
                {
                  num: 1,
                  title: 'Scope of Work',
                  text: 'Platinum Installs ("Contractor") agrees to provide professional epoxy flooring installation services as described in the approved estimate. Work may include surface preparation, base coat application, flake broadcast, and topcoat sealing.',
                },
                {
                  num: 2,
                  title: 'Materials & Workmanship',
                  text: 'All materials used are premium-grade and applied according to manufacturer specifications. Contractor guarantees professional, workmanlike performance with a promise to repair any failures due to improper installation up to, but not beyond, 15 years after the date of installation for interior coatings and 7 years after the date of installation for exterior coatings. The Contractor will honor the chosen limited warranties for material, covering peeling, delamination, or coating failure under normal residential use.',
                },
                {
                  num: 3,
                  title: 'Customer Responsibilities',
                  text: 'Customer agrees to: ensure the work space is clean, empty, and accessible, with the exception that the Contractor agrees to move specified objects before installation; provide power and water; avoid foot traffic for 24 hours and vehicle traffic for 72 hours. A $200 delay fee applies if the work space is not ready on installation day. Failure to meet these conditions may delay the project or void warranty coverage.',
                },
                {
                  num: 4,
                  title: 'Payment Terms',
                  text: `Contract Total: $${estimate.totalPrice.toFixed(2)}. A 50% deposit secures scheduling, balance due upon completion. Accepted payments: cash, check, or electronic transfer. Late payments over 5 days may incur a 5% fee.`,
                },
                {
                  num: 5,
                  title: 'Change Orders',
                  text: 'Any additional work requested beyond the original scope must be approved in writing and may adjust pricing or schedule.',
                },
                {
                  num: 6,
                  title: 'Warranty Exclusions',
                  text: 'Warranty excludes damage caused by structural movement, water intrusion, hydrostatic pressure, chemical spills, or customer negligence.',
                },
                {
                  num: 7,
                  title: 'Liability',
                  text: "Contractor carries full liability coverage. Customer agrees that Contractor's liability shall not exceed total contract price.",
                },
                {
                  num: 8,
                  title: 'Cancellation',
                  text: 'Cancellations within 48 hours of the scheduled service date may result in forfeiture of the deposit due to material and scheduling costs.',
                },
                {
                  num: 9,
                  title: 'Pre-Existing Substrate Conditions',
                  text: 'Contractor is not responsible for coating failures caused by defects in the existing concrete substrate, including but not limited to: inadequate concrete mix design, improper curing, settlement or structural cracking, excessive moisture or hydrostatic pressure, or workmanship deficiencies from prior contractors. Customer acknowledges that concrete coatings are dependent on the integrity of the underlying concrete, and that pre-existing substrate deficiencies may cause delamination, cracking, or adhesion failure that are outside the Contractor\'s control and are not covered under any warranty or guarantee provided by Platinum Installs. If substrate issues are discovered during surface preparation, Contractor will notify Customer before proceeding; additional remediation work, if agreed upon, will be documented as a change order.',
                },
              ].map(({ num, title, text }) => (
                <div key={num} className="flex gap-3">
                  <div className="text-xs font-bold text-gray-400 w-5 shrink-0 pt-0.5">{num}.</div>
                  <div>
                    <div className="text-xs font-bold text-gray-900 mb-1">{title}</div>
                    <div className="text-xs text-gray-600 leading-relaxed">{text}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep(1)}
              className="flex-1 bg-white border border-gray-300 text-gray-700 py-4 rounded-xl font-semibold text-sm hover:bg-gray-50 active:bg-gray-100 transition-colors"
            >
              ← Back
            </button>
            <button
              onClick={() => setStep(3)}
              className="flex-[2] bg-[#2f2f30] text-white py-4 rounded-xl font-semibold text-sm tracking-wide hover:bg-gray-800 active:bg-gray-900 transition-colors"
            >
              Sign Agreement →
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 3: SIGN ── */}
      {step === 3 && (
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">

          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Signing as</div>
            <div className="font-semibold text-gray-900">{estimate.customer.name}</div>
            <div className="text-sm text-gray-500">${estimate.totalPrice.toFixed(2)} total</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="text-xs text-gray-500 leading-relaxed mb-4">
              By signing below, you agree to the Platinum Installs Service Agreement and authorize the work described in the estimate above.
            </div>
            <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Your Signature</div>
            <div className="border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 cursor-crosshair" style={{ touchAction: 'none' }}>
              <SignatureCanvas
                ref={signaturePadRef}
                canvasProps={{
                  style: { width: '100%', height: '180px', display: 'block' },
                }}
                backgroundColor="rgb(249,250,251)"
              />
            </div>
            <button
              onClick={() => signaturePadRef.current?.clear()}
              className="mt-2 text-xs text-gray-400 hover:text-gray-600 underline"
            >
              Clear signature
            </button>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep(2)}
              className="flex-1 bg-white border border-gray-300 text-gray-700 py-4 rounded-xl font-semibold text-sm hover:bg-gray-50 active:bg-gray-100 transition-colors"
            >
              ← Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-[2] bg-[#2f2f30] text-white py-4 rounded-xl font-semibold text-sm tracking-wide hover:bg-gray-800 active:bg-gray-900 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Submitting...' : 'Submit Signature'}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

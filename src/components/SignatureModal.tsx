'use client';

import React, { useRef, useState, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import EstimatePDF from './EstimatePDF';
import ServiceAgreementPDF from './ServiceAgreementPDF';
import { pdf } from '@react-pdf/renderer';

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: {
    id: string;
    name: string;
    street: string;
    city: string;
    state: string;
    zip: string;
    phone: string;
    email: string;
  };
  items: Array<{
    productId: string;
    name: string;
    totalPrice: number;
  }>;
  totalPrice: number;
  estimateId: string;
  quoteType?: string;
  exteriorSqft?: number;
  itemCategories?: Record<string, string>;
  preSignedSignatureDataUrl?: string;
  installationDate?: string;
  approvedDiscount?: number;
  jobPhotos?: { id: string; url: string }[];
  onPhotoAdded?: (photo: { id: string; url: string }) => void;
  onPhotoRemoved?: (photoId: string) => void;
}

type Step = 'photo' | 'date' | 'estimate-review' | 'agreement-review' | 'customer-sign' | 'contractor-sign';

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

export default function SignatureModal({
  isOpen,
  onClose,
  customer,
  items,
  totalPrice,
  estimateId,
  quoteType = 'interior',
  exteriorSqft,
  itemCategories,
  preSignedSignatureDataUrl,
  installationDate = '',
  approvedDiscount = 0,
  jobPhotos: initialJobPhotos,
  onPhotoAdded,
  onPhotoRemoved,
}: SignatureModalProps) {
  const customerSignaturePadRef = useRef<SignatureCanvas>(null);
  const contractorSignaturePadRef = useRef<SignatureCanvas>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const libraryInputRef = useRef<HTMLInputElement>(null);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(preSignedSignatureDataUrl || null);
  const [saving, setSaving] = useState(false);
  const [dateInput, setDateInput] = useState<string>(installationDate || '');
  const [photos, setPhotos] = useState<{ id: string; url: string }[]>(initialJobPhotos ?? []);
  const [step, setStep] = useState<Step>(
    preSignedSignatureDataUrl ? 'contractor-sign' : (initialJobPhotos ?? []).length > 0 ? 'date' : 'photo'
  );
  const [sendWithoutSignature, setSendWithoutSignature] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    if (installationDate && !dateInput) {
      setDateInput(installationDate);
    }
  }, [installationDate, dateInput]);

  if (!isOpen) return null;

  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  const docTitle =
    quoteType === 'exterior' ? 'Exterior Concrete Sealer Proposal' :
    quoteType === 'both' ? 'Floor Coating & Sealer Proposal' :
    'Garage Floor Proposal';

  // ── Business logic (unchanged) ──────────────────────────────────────────

  const handleSendWithoutSignature = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/estimates/${estimateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'sent' }),
      });
      if (!res.ok) { setSaving(false); alert('Failed to update estimate'); return; }

      const estimatePdfBlob = await pdf(
        <EstimatePDF
          customer={customer} items={items} totalPrice={totalPrice}
          estimateId={estimateId} date={today} quoteType={quoteType}
          exteriorSqft={exteriorSqft} itemCategories={itemCategories} approvedDiscount={approvedDiscount}
        />
      ).toBlob();

      const estimateFormData = new FormData();
      estimateFormData.append('file', estimatePdfBlob, `Estimate-${estimateId.slice(-8)}.pdf`);
      estimateFormData.append('type', 'estimate');
      const uploadRes = await fetch(`/api/estimates/${estimateId}/upload-pdf`, { method: 'POST', body: estimateFormData });
      if (!uploadRes.ok) { setSaving(false); alert('Failed to upload PDF'); return; }

      const sendRes = await fetch(`/api/estimates/${estimateId}/send-pdf`, { method: 'POST' });
      if (!sendRes.ok) { setSaving(false); alert('PDF uploaded, but failed to send email'); return; }

      setSaving(false);
      alert('Estimate sent to customer!');
      onClose();
    } catch {
      setSaving(false);
      alert('Error sending estimate');
    }
  };

  const handleCustomerSignatureConfirm = async () => {
    if (!customerSignaturePadRef.current || customerSignaturePadRef.current.isEmpty()) {
      alert('Please provide a signature');
      return;
    }
    setSignatureDataUrl(customerSignaturePadRef.current.toDataURL());
    setStep('contractor-sign');
  };

  const handleContractorSignatureConfirm = async () => {
    if (!contractorSignaturePadRef.current || contractorSignaturePadRef.current.isEmpty()) {
      alert('Please provide a signature');
      return;
    }
    setSaving(true);
    try {
      const contractorSig = contractorSignaturePadRef.current.toDataURL();
      const finalDate = dateInput || installationDate;

      const res = await fetch(`/api/estimates/${estimateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signatureDataUrl, contractorSignatureDataUrl: contractorSig,
          status: 'signed', installationDate: finalDate,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setSaving(false);
        alert(`Failed to save signature: ${err.error || res.statusText}`);
        return;
      }

      const fetchRes = await fetch(`/api/estimates/${estimateId}`);
      const { estimate: updated } = await fetchRes.json();
      const savedDate = updated?.installationDate || finalDate;

      const estimatePdfBlob = await pdf(
        <EstimatePDF
          customer={customer} items={items} totalPrice={totalPrice}
          signatureDataUrl={signatureDataUrl || undefined}
          estimateId={estimateId} date={today} quoteType={quoteType}
          exteriorSqft={exteriorSqft} itemCategories={itemCategories} approvedDiscount={approvedDiscount}
        />
      ).toBlob();

      const agreementPdfBlob = await pdf(
        <ServiceAgreementPDF
          customer={customer} totalPrice={totalPrice} installationDate={savedDate}
          signatureDataUrl={signatureDataUrl || undefined}
          contractorSignatureDataUrl={contractorSig} date={today}
        />
      ).toBlob();

      const ef = new FormData();
      ef.append('file', estimatePdfBlob, `Estimate-${estimateId.slice(-8)}.pdf`);
      ef.append('type', 'estimate');
      const er = await fetch(`/api/estimates/${estimateId}/upload-pdf`, { method: 'POST', body: ef });
      if (!er.ok) { setSaving(false); alert('Signature saved, but failed to upload Estimate PDF'); return; }

      const af = new FormData();
      af.append('file', agreementPdfBlob, `ServiceAgreement-${estimateId.slice(-8)}.pdf`);
      af.append('type', 'agreement');
      await fetch(`/api/estimates/${estimateId}/upload-pdf`, { method: 'POST', body: af });

      const sendRes = await fetch(`/api/estimates/${estimateId}/send-pdf`, { method: 'POST' });
      if (!sendRes.ok) { setSaving(false); alert('PDFs uploaded, but failed to send email'); return; }

      setSaving(false);
      alert('Estimate and Agreement signed by both parties and sent to customer!');
      onClose();
    } catch {
      setSaving(false);
      alert('Error processing signature');
    }
  };

  const compressImage = (file: File, maxWidth = 1920, quality = 0.82): Promise<Blob> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = (ev) => {
        const img = new Image();
        img.onerror = reject;
        img.onload = () => {
          let { width, height } = img;
          if (width > maxWidth) { height = Math.round((height * maxWidth) / width); width = maxWidth; }
          const canvas = document.createElement('canvas');
          canvas.width = width; canvas.height = height;
          canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => (blob ? resolve(blob) : reject(new Error('Compression failed'))),
            'image/jpeg', quality
          );
        };
        img.src = ev.target!.result as string;
      };
      reader.readAsDataURL(file);
    });

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    e.target.value = '';
    setUploadingPhoto(true);
    for (const file of files) {
      try {
        const compressed = await compressImage(file);
        const formData = new FormData();
        formData.append('file', compressed, 'photo.jpg');
        const res = await fetch(`/api/estimates/${estimateId}/upload-photo`, { method: 'POST', body: formData });
        if (!res.ok) { alert('Failed to upload one or more photos. Please try again.'); continue; }
        const { photo } = await res.json();
        setPhotos(prev => [...prev, photo]);
        if (onPhotoAdded) onPhotoAdded(photo);
      } catch {
        alert('Error uploading photo');
      }
    }
    setUploadingPhoto(false);
  };

  const handleDeletePhoto = async (photoId: string) => {
    try {
      await fetch(`/api/estimates/${estimateId}/photos/${photoId}`, { method: 'DELETE' });
      setPhotos(prev => prev.filter(p => p.id !== photoId));
      if (onPhotoRemoved) onPhotoRemoved(photoId);
    } catch {
      console.error('Delete photo error');
    }
  };

  const handleClose = () => { setSignatureDataUrl(null); onClose(); };

  // ── Shared shell ────────────────────────────────────────────────────────

  const Shell = ({ children, title, onBack }: { children: React.ReactNode; title: string; onBack?: () => void }) => (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex flex-col">
      <div className="bg-[#2f2f30] px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          {onBack && (
            <button onClick={onBack} className="text-gray-400 hover:text-white text-lg leading-none">←</button>
          )}
          <div>
            <div className="text-white font-bold text-sm tracking-widest">PLATINUM INSTALLS</div>
            <div className="text-gray-400 text-xs mt-0.5">{title}</div>
          </div>
        </div>
        <button onClick={handleClose} className="text-gray-400 hover:text-white text-2xl leading-none">×</button>
      </div>
      <div className="flex-1 overflow-y-auto bg-gray-100">
        {children}
      </div>
    </div>
  );

  // ── Step: photo ─────────────────────────────────────────────────────────

  if (step === 'photo') {
    return (
      <Shell title="Job Photos">
        <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
          <div className="bg-white rounded-xl shadow-sm p-5">
            <p className="text-sm text-gray-500 mb-4">Add at least one job site photo before proceeding.</p>

            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFilesSelected} />
            <input ref={libraryInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFilesSelected} />

            {photos.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {photos.map(photo => (
                  <div key={photo.id} className="relative">
                    <img src={photo.url} alt="Job site" className="w-20 h-20 object-cover rounded-lg border border-gray-200" />
                    <button
                      onClick={() => handleDeletePhoto(photo.id)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs font-bold flex items-center justify-center hover:bg-red-600"
                    >×</button>
                  </div>
                ))}
              </div>
            )}

            {uploadingPhoto && <p className="text-sm text-gray-400 mb-3">Uploading…</p>}

            <div className="flex gap-2">
              <button
                onClick={() => cameraInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="flex-1 py-3 rounded-xl font-semibold text-white text-sm bg-[#2f2f30] hover:bg-gray-800 disabled:opacity-50"
              >Take Photo</button>
              <button
                onClick={() => libraryInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="flex-1 py-3 rounded-xl font-semibold text-sm border-2 border-[#2f2f30] text-[#2f2f30] hover:bg-gray-50 disabled:opacity-50"
              >Library</button>
            </div>
          </div>

          <button
            onClick={() => setStep('date')}
            disabled={photos.length === 0 || uploadingPhoto}
            className="w-full bg-[#2f2f30] text-white py-4 rounded-xl font-semibold text-sm disabled:opacity-40"
          >
            Continue ({photos.length} photo{photos.length !== 1 ? 's' : ''}) →
          </button>
        </div>
      </Shell>
    );
  }

  // ── Step: date ──────────────────────────────────────────────────────────

  if (step === 'date') {
    return (
      <Shell title="Installation Date" onBack={() => setStep('photo')}>
        <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
          {!sendWithoutSignature ? (
            <>
              <div className="bg-white rounded-xl shadow-sm p-5 space-y-4">
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Scheduled Date</div>
                  <input
                    type="date"
                    value={dateInput}
                    onChange={(e) => setDateInput(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-900 font-semibold focus:border-gray-800 focus:outline-none"
                  />
                </div>
                <label className="flex items-center gap-3 cursor-pointer pt-2 border-t border-gray-100">
                  <input
                    type="checkbox"
                    checked={sendWithoutSignature}
                    onChange={(e) => setSendWithoutSignature(e.target.checked)}
                    className="w-5 h-5 accent-gray-800"
                  />
                  <span className="text-sm text-gray-600">Send estimate without signature</span>
                </label>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep('photo')} className="flex-1 bg-white border border-gray-300 text-gray-700 py-4 rounded-xl font-semibold text-sm">← Back</button>
                <button
                  onClick={() => { if (!dateInput) { alert('Please select an installation date'); return; } setStep('estimate-review'); }}
                  className="flex-[2] bg-[#2f2f30] text-white py-4 rounded-xl font-semibold text-sm"
                >Review Estimate →</button>
              </div>
            </>
          ) : (
            <>
              <div className="bg-white rounded-xl shadow-sm p-5">
                <p className="text-sm text-gray-500 mb-3">This will send the estimate to the customer without requesting a signature.</p>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-400 mb-0.5">Sending to</div>
                  <div className="font-semibold text-gray-900 text-sm">{customer.email}</div>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setSendWithoutSignature(false)} className="flex-1 bg-white border border-gray-300 text-gray-700 py-4 rounded-xl font-semibold text-sm">← Back</button>
                <button
                  onClick={handleSendWithoutSignature}
                  disabled={saving}
                  className="flex-[2] bg-[#2f2f30] text-white py-4 rounded-xl font-semibold text-sm disabled:opacity-50"
                >{saving ? 'Sending…' : 'Send Estimate'}</button>
              </div>
            </>
          )}
        </div>
      </Shell>
    );
  }

  // ── Step: estimate-review ───────────────────────────────────────────────

  if (step === 'estimate-review') {
    const interiorItems = quoteType === 'both'
      ? items.filter((i) => (itemCategories?.[i.productId] ?? 'interior') !== 'exterior')
      : items;
    const exteriorItems = quoteType === 'both'
      ? items.filter((i) => itemCategories?.[i.productId] === 'exterior')
      : [];

    return (
      <Shell title="Review Estimate" onBack={() => setStep('date')}>
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">

          {/* Proposal header */}
          <div className="bg-[#2f2f30] rounded-xl p-5 text-white">
            <div className="text-xs text-gray-400 tracking-widest uppercase mb-1">Proposal</div>
            <div className="text-xl font-bold">{docTitle}</div>
            <div className="text-gray-400 text-xs mt-1">#{estimateId.slice(-8).toUpperCase()} · {today}</div>
          </div>

          {/* Customer info */}
          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Prepared For</div>
            <div className="font-semibold text-gray-900">{customer.name}</div>
            <div className="text-sm text-gray-500 mt-1 space-y-0.5">
              <div>{customer.street}</div>
              <div>{customer.city}, {customer.state} {customer.zip}</div>
              <div>{customer.phone}</div>
              <div>{customer.email}</div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100 text-sm">
              <span className="text-gray-400">Scheduled Install: </span>
              <span className="font-medium text-gray-800">{formatDate(dateInput)}</span>
            </div>
          </div>

          {/* Scope */}
          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Scope of Work</div>
            {quoteType === 'exterior' ? (
              <ul className="text-sm text-gray-600 space-y-1.5">
                {['Professional surface cleaning and degreasing','Concrete preparation and inspection','Siliconate penetrating sealer application','Siloxane water-repellent topcoat','Edge and joint detailing'].map(s => (
                  <li key={s} className="flex gap-2"><span className="text-gray-400 mt-0.5">•</span>{s}</li>
                ))}
              </ul>
            ) : quoteType === 'both' ? (
              <>
                <div className="text-xs font-semibold text-gray-700 mb-1">Interior — Garage Floor Coating</div>
                <ul className="text-sm text-gray-600 space-y-1 mb-3">
                  {['Diamond grinding surface prep','Epoxy base coat','Polyaspartic top coat'].map(s => (
                    <li key={s} className="flex gap-2"><span className="text-gray-400 mt-0.5">•</span>{s}</li>
                  ))}
                </ul>
                <div className="text-xs font-semibold text-gray-700 mb-1">Exterior — Concrete Sealing</div>
                <ul className="text-sm text-gray-600 space-y-1">
                  {['Surface cleaning and preparation','Siliconate penetrating sealer','Siloxane water-repellent topcoat'].map(s => (
                    <li key={s} className="flex gap-2"><span className="text-gray-400 mt-0.5">•</span>{s}</li>
                  ))}
                </ul>
              </>
            ) : (
              <ul className="text-sm text-gray-600 space-y-1.5">
                {['Diamond grinding surface prep','Crack and joint repair (as needed)','Epoxy base coat','Decorative flake broadcast','Polyaspartic top coat','Clean edge work and detail finishing'].map(s => (
                  <li key={s} className="flex gap-2"><span className="text-gray-400 mt-0.5">•</span>{s}</li>
                ))}
              </ul>
            )}
          </div>

          {/* Line items */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 pt-5 pb-2">
              <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Services</div>
            </div>
            {quoteType === 'both' && (
              <div className="px-5 py-1.5 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide border-y border-gray-100">Interior</div>
            )}
            <div className="divide-y divide-gray-100">
              {interiorItems.map((item) => (
                <div key={item.productId} className="flex justify-between items-center px-5 py-3">
                  <span className="text-sm text-gray-700">{item.name}</span>
                  <span className={`text-sm font-medium tabular-nums ${item.totalPrice < 0 ? 'text-green-600' : 'text-gray-900'}`}>
                    {item.totalPrice === 0 ? '' : item.totalPrice < 0 ? `-$${Math.abs(item.totalPrice).toFixed(2)}` : `$${item.totalPrice.toFixed(2)}`}
                  </span>
                </div>
              ))}
            </div>
            {quoteType === 'both' && exteriorItems.length > 0 && (
              <>
                <div className="px-5 py-1.5 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide border-y border-gray-100">Exterior</div>
                <div className="divide-y divide-gray-100">
                  {exteriorItems.map((item) => (
                    <div key={item.productId} className="flex justify-between items-center px-5 py-3">
                      <span className="text-sm text-gray-700">{item.name}</span>
                      <span className="text-sm font-medium tabular-nums text-gray-900">
                        {item.totalPrice === 0 ? '' : `$${item.totalPrice.toFixed(2)}`}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
            <div className="flex justify-between items-center px-5 py-4 border-t-2 border-gray-900">
              <span className="font-bold text-gray-900 text-sm uppercase tracking-wide">Total</span>
              <span className="text-2xl font-bold text-gray-900 tabular-nums">${totalPrice.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment */}
          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Payment Schedule</div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Deposit to schedule</span>
                <span className="font-semibold text-gray-900 tabular-nums">${(totalPrice / 2).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Balance due at completion</span>
                <span className="font-semibold text-gray-900 tabular-nums">${(totalPrice / 2).toFixed(2)}</span>
              </div>
            </div>
          </div>

          <button onClick={() => setStep('agreement-review')} className="w-full bg-[#2f2f30] text-white py-4 rounded-xl font-semibold text-sm">
            Review Service Agreement →
          </button>
        </div>
      </Shell>
    );
  }

  // ── Step: agreement-review ──────────────────────────────────────────────

  if (step === 'agreement-review') {
    return (
      <Shell title="Service Agreement" onBack={() => setStep('estimate-review')}>
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="text-center border-b border-gray-200 pb-4 mb-4">
              <div className="font-bold text-gray-900 tracking-wider">PLATINUM INSTALLS</div>
              <div className="text-xs text-gray-400 mt-1 uppercase tracking-widest">Service Agreement</div>
            </div>

            <div className="space-y-2 mb-4 text-sm">
              {([
                ['Customer Name', customer.name],
                ['Service Address', customer.street],
                ['City, State, ZIP', `${customer.city}, ${customer.state} ${customer.zip}`],
                ['Phone / Email', `${customer.phone} / ${customer.email}`],
                ['Scheduled Installation Date', formatDate(dateInput)],
              ] as [string, string][]).map(([label, value]) => (
                <div key={label} className="flex gap-3 items-end pb-1 border-b border-gray-100">
                  <span className="text-gray-400 text-xs font-medium w-44 shrink-0">{label}</span>
                  <span className="text-gray-800 text-xs flex-1">{value}</span>
                </div>
              ))}
            </div>

            <div className="space-y-4 mt-5">
              {[
                { num: 1, title: 'Scope of Work', text: 'Platinum Installs ("Contractor") agrees to provide professional epoxy flooring installation services as described in the approved estimate. Work may include surface preparation, base coat application, flake broadcast, and topcoat sealing.' },
                { num: 2, title: 'Materials & Workmanship', text: 'All materials used are premium-grade and applied according to manufacturer specifications. Contractor guarantees professional, workmanlike performance with a promise to repair any failures due to improper installation up to, but not beyond, 15 years after the date of installation for interior coatings and 7 years after the date of installation for exterior coatings. The Contractor will honor the chosen limited warranties for material, covering peeling, delamination, or coating failure under normal residential use.' },
                { num: 3, title: 'Customer Responsibilities', text: 'Customer agrees to: ensure the work space is clean, empty, and accessible, with the exception that the Contractor agrees to move specified objects before installation; provide power and water; avoid foot traffic for 24 hours and vehicle traffic for 72 hours. A $200 delay fee applies if the work space is not ready on installation day. Failure to meet these conditions may delay the project or void warranty coverage.' },
                { num: 4, title: 'Payment Terms', text: `Contract Total: $${totalPrice.toFixed(2)}. A 50% deposit secures scheduling, balance due upon completion. Accepted payments: cash, check, or electronic transfer. Late payments over 5 days may incur a 5% fee.` },
                { num: 5, title: 'Change Orders', text: 'Any additional work requested beyond the original scope must be approved in writing and may adjust pricing or schedule.' },
                { num: 6, title: 'Warranty Exclusions', text: 'Warranty excludes damage caused by structural movement, water intrusion, hydrostatic pressure, chemical spills, or customer negligence.' },
                { num: 7, title: 'Liability', text: "Contractor carries full liability coverage. Customer agrees that Contractor's liability shall not exceed total contract price." },
                { num: 8, title: 'Cancellation', text: 'Cancellations within 48 hours of the scheduled service date may result in forfeiture of the deposit due to material and scheduling costs.' },
                { num: 9, title: 'Pre-Existing Substrate Conditions', text: "Contractor is not responsible for coating failures caused by defects in the existing concrete substrate, including but not limited to: inadequate concrete mix design, improper curing, settlement or structural cracking, excessive moisture or hydrostatic pressure, or workmanship deficiencies from prior contractors. Customer acknowledges that concrete coatings are dependent on the integrity of the underlying concrete, and that pre-existing substrate deficiencies may cause delamination, cracking, or adhesion failure that are outside the Contractor's control and are not covered under any warranty or guarantee provided by Platinum Installs. If substrate issues are discovered during surface preparation, Contractor will notify Customer before proceeding; additional remediation work, if agreed upon, will be documented as a change order." },
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
            <button onClick={() => setStep('estimate-review')} className="flex-1 bg-white border border-gray-300 text-gray-700 py-4 rounded-xl font-semibold text-sm">← Back</button>
            <button onClick={() => setStep('customer-sign')} className="flex-[2] bg-[#2f2f30] text-white py-4 rounded-xl font-semibold text-sm">Customer Signs →</button>
          </div>
        </div>
      </Shell>
    );
  }

  // ── Step: customer-sign ─────────────────────────────────────────────────

  if (step === 'customer-sign') {
    return (
      <Shell title="Customer Signature" onBack={() => setStep('agreement-review')}>
        <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Signing as</div>
            <div className="font-semibold text-gray-900">{customer.name}</div>
            <div className="text-sm text-gray-500">${totalPrice.toFixed(2)} total · {formatDate(dateInput)}</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="text-xs text-gray-500 leading-relaxed mb-4">
              By signing below, the customer agrees to the Platinum Installs Service Agreement and authorizes the work described in the estimate.
            </div>
            <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Customer Signature</div>
            <div className="border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 cursor-crosshair" style={{ touchAction: 'none' }}>
              <SignatureCanvas
                ref={customerSignaturePadRef}
                canvasProps={{ style: { width: '100%', height: '180px', display: 'block' } }}
                backgroundColor="rgb(249,250,251)"
                penColor="#2f2f30"
              />
            </div>
            <button onClick={() => customerSignaturePadRef.current?.clear()} className="mt-2 text-xs text-gray-400 hover:text-gray-600 underline">
              Clear signature
            </button>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep('agreement-review')} className="flex-1 bg-white border border-gray-300 text-gray-700 py-4 rounded-xl font-semibold text-sm">← Back</button>
            <button onClick={handleCustomerSignatureConfirm} className="flex-[2] bg-[#2f2f30] text-white py-4 rounded-xl font-semibold text-sm">
              Confirm & Contractor Signs →
            </button>
          </div>
        </div>
      </Shell>
    );
  }

  // ── Step: contractor-sign ───────────────────────────────────────────────

  if (step === 'contractor-sign') {
    return (
      <Shell title="Contractor Signature">
        <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
          {preSignedSignatureDataUrl && (
            <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-800">
              Customer signed remotely — add your signature to complete the agreement.
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Signing as</div>
            <div className="font-semibold text-gray-900">Platinum Installs</div>
            <div className="text-sm text-gray-500">${totalPrice.toFixed(2)} total · {formatDate(dateInput || installationDate)}</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Contractor Signature</div>
            <div className="border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 cursor-crosshair" style={{ touchAction: 'none' }}>
              <SignatureCanvas
                ref={contractorSignaturePadRef}
                canvasProps={{ style: { width: '100%', height: '180px', display: 'block' } }}
                backgroundColor="rgb(249,250,251)"
                penColor="#2f2f30"
              />
            </div>
            <button onClick={() => contractorSignaturePadRef.current?.clear()} className="mt-2 text-xs text-gray-400 hover:text-gray-600 underline">
              Clear signature
            </button>
          </div>

          <button
            onClick={handleContractorSignatureConfirm}
            disabled={saving}
            className="w-full bg-[#2f2f30] text-white py-4 rounded-xl font-semibold text-sm disabled:opacity-50"
          >
            {saving ? 'Saving & Sending…' : 'Sign & Send Both Documents'}
          </button>
        </div>
      </Shell>
    );
  }

  return null;
}

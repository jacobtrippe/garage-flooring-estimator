'use client';

import React, { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import dynamic from 'next/dynamic';
import EstimatePDF from './EstimatePDF';
import ServiceAgreementPDF from './ServiceAgreementPDF';
import { pdf } from '@react-pdf/renderer';

const PDFViewer = dynamic(() => import('@react-pdf/renderer').then((mod) => mod.PDFViewer), {
  ssr: false,
});

const PDFDownloadLink = dynamic(() => import('@react-pdf/renderer').then((mod) => mod.PDFDownloadLink), {
  ssr: false,
});

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
}

export default function SignatureModal({
  isOpen,
  onClose,
  customer,
  items,
  totalPrice,
  estimateId,
}: SignatureModalProps) {
  const signaturePadRef = useRef<SignatureCanvas>(null);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [installationDate, setInstallationDate] = useState<string>('');
  const [step, setStep] = useState<'date' | 'sign'>('date');
  const [activeTab, setActiveTab] = useState<'estimate' | 'agreement'>('estimate');
  const [sendWithoutSignature, setSendWithoutSignature] = useState(false);

  if (!isOpen) return null;

  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const handleSendWithoutSignature = async () => {
    setSaving(true);
    try {
      // Update estimate status to sent (without signature)
      const res = await fetch(`/api/estimates/${estimateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'sent',
        }),
      });

      if (!res.ok) {
        console.error('Failed to update estimate:', res.status);
        setSaving(false);
        alert('Failed to update estimate');
        return;
      }

      // Generate Estimate PDF without signature
      const estimatePdf = pdf(
        <EstimatePDF
          customer={customer}
          items={items}
          totalPrice={totalPrice}
          signatureDataUrl={undefined}
          estimateId={estimateId}
          date={today}
        />
      );

      const estimatePdfBlob = await estimatePdf.toBlob();

      // Upload PDF to Supabase Storage
      const estimateFormData = new FormData();
      estimateFormData.append('file', estimatePdfBlob, `Estimate-${estimateId.slice(-8)}.pdf`);

      const uploadEstimateRes = await fetch(`/api/estimates/${estimateId}/upload-pdf`, {
        method: 'POST',
        body: estimateFormData,
      });

      if (!uploadEstimateRes.ok) {
        console.error('Failed to upload Estimate PDF:', uploadEstimateRes.status);
        setSaving(false);
        alert('Failed to upload PDF');
        return;
      }

      // Send email with PDF link
      const sendRes = await fetch(`/api/estimates/${estimateId}/send-pdf`, {
        method: 'POST',
      });

      if (!sendRes.ok) {
        console.error('Failed to send email:', sendRes.status);
        setSaving(false);
        alert('PDF uploaded, but failed to send email');
        return;
      }

      setSaving(false);
      alert('Estimate sent to customer!');
      onClose();
    } catch (error) {
      console.error('Error sending estimate:', error);
      setSaving(false);
      alert('Error sending estimate');
    }
  };

  const handleDateSubmit = () => {
    if (!installationDate) {
      alert('Please select an installation date');
      return;
    }
    setStep('sign');
  };

  const handleClearSignature = () => {
    if (signaturePadRef.current) {
      signaturePadRef.current.clear();
    }
  };

  const handleConfirmSignature = async () => {
    if (!signaturePadRef.current) return;

    const isEmpty = signaturePadRef.current.isEmpty();
    if (isEmpty) {
      alert('Please provide a signature');
      return;
    }

    setSaving(true);
    try {
      const sig = signaturePadRef.current.toDataURL();
      setSignatureDataUrl(sig);

      // Save signature and installation date to database
      const res = await fetch(`/api/estimates/${estimateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signatureDataUrl: sig,
          status: 'signed',
          installationDate: installationDate,
        }),
      });

      if (!res.ok) {
        console.error('Failed to save signature:', res.status);
        setSaving(false);
        alert('Failed to save signature');
        return;
      }

      // Generate Estimate PDF with signature
      const estimatePdf = pdf(
        <EstimatePDF
          customer={customer}
          items={items}
          totalPrice={totalPrice}
          signatureDataUrl={sig}
          estimateId={estimateId}
          date={today}
        />
      );

      const estimatePdfBlob = await estimatePdf.toBlob();

      // Generate Agreement PDF with signature
      const agreementPdf = pdf(
        <ServiceAgreementPDF
          customer={customer}
          totalPrice={totalPrice}
          installationDate={installationDate}
          signatureDataUrl={sig}
          date={today}
        />
      );

      const agreementPdfBlob = await agreementPdf.toBlob();

      // Upload both PDFs to Supabase Storage
      const estimateFormData = new FormData();
      estimateFormData.append('file', estimatePdfBlob, `Estimate-${estimateId.slice(-8)}.pdf`);

      const uploadEstimateRes = await fetch(`/api/estimates/${estimateId}/upload-pdf`, {
        method: 'POST',
        body: estimateFormData,
      });

      if (!uploadEstimateRes.ok) {
        console.error('Failed to upload Estimate PDF:', uploadEstimateRes.status);
        setSaving(false);
        alert('Signature saved, but failed to upload Estimate PDF');
        return;
      }

      const agreementFormData = new FormData();
      agreementFormData.append('file', agreementPdfBlob, `ServiceAgreement-${estimateId.slice(-8)}.pdf`);

      const uploadAgreementRes = await fetch(`/api/estimates/${estimateId}/upload-pdf`, {
        method: 'POST',
        body: agreementFormData,
      });

      if (!uploadAgreementRes.ok) {
        console.error('Failed to upload Agreement PDF:', uploadAgreementRes.status);
        // Continue anyway, estimate was uploaded
      }

      // Send email with PDF links
      const sendRes = await fetch(`/api/estimates/${estimateId}/send-pdf`, {
        method: 'POST',
      });

      if (!sendRes.ok) {
        console.error('Failed to send email:', sendRes.status);
        setSaving(false);
        alert('PDFs uploaded, but failed to send email');
        return;
      }

      setSaving(false);
      alert('Estimate and Agreement signed and sent to customer!');
      onClose();
    } catch (error) {
      console.error('Error processing signature:', error);
      setSaving(false);
      alert('Error processing signature');
    }
  };

  const handleClose = () => {
    setSignatureDataUrl(null);
    onClose();
  };

  // Step 1: Date Selection / Send Without Signature
  if (step === 'date') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-2">
        <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white px-8 py-4 flex justify-between items-center">
            <h2 className="text-2xl font-bold">{sendWithoutSignature ? 'Send Estimate' : 'Confirm Installation Date'}</h2>
            <button
              onClick={handleClose}
              className="text-gray-300 hover:text-white text-3xl"
            >
              ×
            </button>
          </div>

          <div className="p-8">
            {!sendWithoutSignature ? (
              <>
                <p className="text-gray-600 mb-6">When will the installation take place?</p>
                <input
                  type="date"
                  value={installationDate}
                  onChange={(e) => setInstallationDate(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg mb-6 text-gray-900 font-semibold"
                />
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sendWithoutSignature}
                      onChange={(e) => setSendWithoutSignature(e.target.checked)}
                      className="w-5 h-5 accent-blue-600"
                    />
                    <span className="text-sm text-gray-900 font-medium">Send estimate without signature</span>
                  </label>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleClose}
                    className="flex-1 bg-gray-300 text-gray-900 px-4 py-2 rounded font-semibold hover:bg-gray-400 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDateSubmit}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded font-semibold hover:bg-blue-700 transition"
                  >
                    Continue
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-gray-600 mb-6">This will send the estimate to {customer.email} without requesting a signature.</p>
                <div className="bg-blue-50 border-2 border-blue-200 p-4 rounded-lg mb-6">
                  <p className="text-sm text-blue-900 font-medium">Ready to send estimate to:</p>
                  <p className="text-sm text-blue-700 font-semibold mt-1">{customer.email}</p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setSendWithoutSignature(false)}
                    className="flex-1 bg-gray-300 text-gray-900 px-4 py-2 rounded font-semibold hover:bg-gray-400 transition"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleSendWithoutSignature}
                    disabled={saving}
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded font-semibold hover:bg-green-700 transition disabled:bg-gray-400"
                  >
                    {saving ? 'Sending...' : 'Send Estimate'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Signature
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-2">
      <div className="bg-white rounded-lg shadow-lg w-screen h-screen flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white px-8 py-4 flex justify-between items-center shrink-0">
          <h2 className="text-2xl font-bold">Review & Sign Documents</h2>
          <button
            onClick={handleClose}
            className="text-gray-300 hover:text-white text-3xl"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col min-h-0 overflow-hidden">
          {/* Tab Buttons */}
          <div className="flex gap-4 px-8 py-4 border-b-2 border-gray-300 bg-gray-50 shrink-0">
            <button
              onClick={() => setActiveTab('estimate')}
              className={`px-6 py-2 rounded font-semibold transition ${
                activeTab === 'estimate'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
              }`}
            >
              Estimate
            </button>
            <button
              onClick={() => setActiveTab('agreement')}
              className={`px-6 py-2 rounded font-semibold transition ${
                activeTab === 'agreement'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
              }`}
            >
              Service Agreement
            </button>
          </div>

          {/* PDF Preview */}
          <div className="flex-1 bg-gray-50 border-2 border-gray-300 m-2 rounded-lg overflow-hidden min-h-0">
            <style>{`
              .pdf-viewer-fill {
                width: 100% !important;
                height: 100% !important;
                overflow: hidden !important;
              }
              .pdf-viewer-fill iframe {
                width: 100% !important;
                height: 100% !important;
              }
              .pdf-viewer-fill ::-webkit-scrollbar {
                display: none;
              }
            `}</style>
            <div className="pdf-viewer-fill w-full h-full">
              <PDFViewer>
                {activeTab === 'estimate' ? (
                  <EstimatePDF
                    customer={customer}
                    items={items}
                    totalPrice={totalPrice}
                    signatureDataUrl={signatureDataUrl || undefined}
                    estimateId={estimateId}
                    date={today}
                  />
                ) : (
                  <ServiceAgreementPDF
                    customer={customer}
                    totalPrice={totalPrice}
                    installationDate={installationDate}
                    signatureDataUrl={signatureDataUrl || undefined}
                    date={today}
                  />
                )}
              </PDFViewer>
            </div>
          </div>

          {/* Signature Section */}
          <div className="p-8 bg-white border-t-2 border-gray-300 shrink-0">
            <div className="flex gap-6 max-w-4xl">
              {/* Signature Pad */}
              <div className="flex-1 flex flex-col">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Customer Signature</h3>
                <div className="border-2 border-gray-300 rounded-lg bg-white" style={{ height: '200px' }}>
                  <SignatureCanvas
                    ref={signaturePadRef}
                    canvasProps={{
                      style: {
                        width: '100%',
                        height: '100%',
                        cursor: 'crosshair',
                      },
                    }}
                    penColor="#2f2f30"
                    backgroundColor="#ffffff"
                  />
                </div>
              </div>

              {/* Info & Buttons */}
              <div className="w-80 flex flex-col justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900 mb-2">{customer.name}</p>
                  <p className="text-sm text-gray-600 mb-2">Installation: {installationDate}</p>
                  <p className="text-sm text-gray-600 mb-4">Signed: {today}</p>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">Total Amount</p>
                    <p className="text-3xl font-bold text-gray-900">${totalPrice.toFixed(2)}</p>
                  </div>
                </div>

                <div className="flex flex-col gap-3 mt-6">
                  <button
                    onClick={handleClearSignature}
                    className="w-full bg-gray-300 text-gray-900 px-4 py-2 rounded font-semibold hover:bg-gray-400 transition"
                  >
                    Clear
                  </button>
                  <button
                    onClick={handleConfirmSignature}
                    disabled={saving}
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded font-semibold hover:bg-blue-700 transition disabled:bg-gray-400"
                  >
                    {saving ? 'Saving...' : 'Sign & Send Both Documents'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

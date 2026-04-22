'use client';

import React, { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import dynamic from 'next/dynamic';
import EstimatePDF from './EstimatePDF';
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

  if (!isOpen) return null;

  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

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

      // Save signature to database
      const res = await fetch(`/api/estimates/${estimateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signatureDataUrl: sig,
          status: 'signed',
        }),
      });

      if (!res.ok) {
        console.error('Failed to save signature:', res.status);
        setSaving(false);
        alert('Failed to save signature');
        return;
      }

      // Generate PDF with signature
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

      const pdfBlob = await estimatePdf.toBlob();

      // Upload to Supabase Storage
      const formData = new FormData();
      formData.append('file', pdfBlob, `Estimate-${estimateId.slice(-8)}.pdf`);

      const uploadRes = await fetch(`/api/estimates/${estimateId}/upload-pdf`, {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) {
        console.error('Failed to upload PDF:', uploadRes.status);
        setSaving(false);
        alert('Signature saved, but failed to upload PDF');
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
      alert('Estimate signed and sent to customer!');
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-2">
      <div className="bg-white rounded-lg shadow-lg w-screen h-screen flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white px-8 py-4 flex justify-between items-center shrink-0">
          <h2 className="text-2xl font-bold">Review Estimate</h2>
          <button
            onClick={handleClose}
            className="text-gray-300 hover:text-white text-3xl"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col p-2 gap-0 min-h-0 overflow-y-auto">
          {/* PDF Preview - Priority Focus */}
          <div className="h-screen bg-gray-50 border-2 border-gray-300 rounded-lg overflow-hidden shrink-0">
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
                <EstimatePDF
                  customer={customer}
                  items={items}
                  totalPrice={totalPrice}
                  signatureDataUrl={signatureDataUrl || undefined}
                  estimateId={estimateId}
                  date={today}
                />
              </PDFViewer>
            </div>
          </div>

          {/* Signature Section */}
          <div className="p-8 bg-white border-t-2 border-gray-300">
            <div className="flex gap-6 max-w-4xl">
            {/* Signature Pad */}
            <div className="flex-1 flex flex-col">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Customer Signature</h3>
              <div className="border-2 border-gray-300 rounded-lg bg-white" style={{ height: '250px' }}>
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
                <p className="text-sm text-gray-600 mb-4">{today}</p>
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
                  {saving ? 'Saving...' : 'Confirm & Save'}
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

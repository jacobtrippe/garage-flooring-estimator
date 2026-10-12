"use client";

import { useRef, useState } from "react";

interface EstimateItem {
  id: string;
  name: string;
  price: number;
  product?: { section?: { title?: string } };
}

interface Photo {
  id: string;
  url: string;
}

interface ProjectEstimate {
  id: string;
  quoteType?: string;
  totalPrice?: number;
  items?: EstimateItem[];
  photos?: Photo[];
  colorChosen?: string | null;
  downPaymentReceived?: boolean;
  downPaymentReceivedAt?: string | null;
  materialsPurchased?: boolean;
  projectCompleted?: boolean;
  projectCompletedAt?: string | null;
  finalPaymentCollected?: boolean;
}

interface ProjectProgressPanelProps {
  estimate: ProjectEstimate;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onUpdate: (updated: any) => void;
  onPhotosChange?: (photos: Photo[]) => void;
}

function formatQuoteType(qt?: string): string {
  if (qt === 'exterior') return 'Exterior';
  if (qt === 'both') return 'Interior + Exterior';
  return 'Interior';
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}


export default function ProjectProgressPanel({ estimate, onUpdate, onPhotosChange }: ProjectProgressPanelProps) {
  const step1Done = !!(estimate.downPaymentReceived && estimate.colorChosen);
  const step2Done = !!estimate.materialsPurchased;
  const step3Done = !!(estimate.projectCompleted && estimate.finalPaymentCollected);

  const [openStep, setOpenStep] = useState<1 | 2 | 3 | null>(
    !step1Done ? 1 : !step3Done ? 3 : null
  );
  const [saving, setSaving] = useState(false);

  const [depositChecked, setDepositChecked] = useState(!!estimate.downPaymentReceived);
  const [colorChosen, setColorChosen] = useState(estimate.colorChosen ?? '');
  const [materialsPurchased, setMaterialsPurchased] = useState(!!estimate.materialsPurchased);
  const [projectCompleted, setProjectCompleted] = useState(!!estimate.projectCompleted);
  const [finalPaymentCollected, setFinalPaymentCollected] = useState(!!estimate.finalPaymentCollected);

  // Photo state
  const [photos, setPhotos] = useState<Photo[]>(estimate.photos ?? []);
  const [photosOpen, setPhotosOpen] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const compressImage = (file: File): Promise<Blob> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
          const MAX = 1600;
          const scale = Math.min(1, MAX / Math.max(img.width, img.height));
          const canvas = document.createElement('canvas');
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;
          canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
          canvas.toBlob(
            (blob) => (blob ? resolve(blob) : reject(new Error('Compression failed'))),
            'image/jpeg', 0.82
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
        const res = await fetch(`/api/estimates/${estimate.id}/upload-photo`, { method: 'POST', body: formData });
        if (!res.ok) { alert('Failed to upload photo.'); continue; }
        const { photo } = await res.json();
        setPhotos(prev => {
          const next = [...prev, photo];
          onPhotosChange?.(next);
          return next;
        });
      } catch {
        alert('Error uploading photo');
      }
    }
    setUploadingPhoto(false);
  };

  const handleDeletePhoto = async (photoId: string) => {
    await fetch(`/api/estimates/${estimate.id}/photos/${photoId}`, { method: 'DELETE' });
    setPhotos(prev => {
      const next = prev.filter(p => p.id !== photoId);
      onPhotosChange?.(next);
      return next;
    });
  };

  const save = async (fields: Record<string, unknown>) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/estimates/${estimate.id}/project`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      });
      const updated = await res.json();
      onUpdate(updated);
    } finally {
      setSaving(false);
    }
  };

  const toggleStep = (step: 1 | 2 | 3) => {
    setOpenStep(openStep === step ? null : step);
  };

  const StepCircle = ({ n, done, active }: { n: number; done: boolean; active: boolean }) => (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
      style={{
        backgroundColor: done ? '#059669' : active ? '#1B3A5C' : '#E5E7EB',
        color: done || active ? '#ffffff' : '#9CA3AF',
      }}
    >
      {done ? '✓' : n}
    </div>
  );

  return (
    <div className="mt-3 border border-gray-200 rounded-lg overflow-hidden bg-white">
      {/* Lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80"
          onClick={() => setLightboxUrl(null)}
        >
          <img src={lightboxUrl} alt="Project photo" className="max-w-full max-h-full object-contain rounded" style={{ maxHeight: '90vh', maxWidth: '90vw' }} onClick={(e) => e.stopPropagation()} />
          <button onClick={() => setLightboxUrl(null)} className="absolute top-4 right-5 text-white text-3xl font-bold leading-none">×</button>
        </div>
      )}

      <div className="px-4 pt-3 pb-2 border-b border-gray-100 flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wide" style={{ color: '#1B3A5C' }}>Project Checklist</p>
        <button
          onClick={() => setPhotosOpen(o => !o)}
          className="text-xs font-medium px-2 py-1 rounded hover:opacity-80 transition"
          style={{ backgroundColor: '#EFF6FF', color: '#1D4ED8' }}
        >
          {photosOpen ? '▲' : '▾'} Photos{photos.length > 0 ? ` (${photos.length})` : ''}
        </button>
      </div>

      {/* Photo gallery */}
      {photosOpen && (
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            className="hidden"
            onChange={handleFilesSelected}
          />
          {photos.length > 0 ? (
            <div className="flex flex-wrap gap-2 mb-3">
              {photos.map(photo => (
                <div key={photo.id} className="relative group">
                  <img
                    src={photo.url}
                    alt="Project photo"
                    className="w-20 h-20 object-cover rounded border border-gray-200 cursor-pointer"
                    onClick={() => setLightboxUrl(photo.url)}
                  />
                  <button
                    onClick={() => handleDeletePhoto(photo.id)}
                    className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition leading-none"
                    title="Remove photo"
                  >×</button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400 mb-3">No photos yet.</p>
          )}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingPhoto}
            className="text-xs font-medium px-3 py-1.5 rounded border border-dashed border-gray-300 hover:border-gray-400 text-gray-600 transition disabled:opacity-50"
          >
            {uploadingPhoto ? 'Uploading...' : '+ Add Photo'}
          </button>
        </div>
      )}


      {/* Progress bar */}
      <div className="flex items-center px-4 py-3">
        <StepCircle n={1} done={step1Done} active={openStep === 1} />
        <div className="flex-1 h-0.5 mx-1" style={{ backgroundColor: step1Done ? '#059669' : '#E5E7EB' }} />
        <StepCircle n={2} done={step2Done} active={openStep === 2} />
        <div className="flex-1 h-0.5 mx-1" style={{ backgroundColor: step3Done ? '#059669' : '#E5E7EB' }} />
        <StepCircle n={3} done={step3Done} active={openStep === 3} />
      </div>

      {/* Step 1: Down Payment + Color */}
      <div className="border-t border-gray-100">
        <button
          onClick={() => toggleStep(1)}
          className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-gray-50 transition"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold" style={{ color: step1Done ? '#059669' : '#1B3A5C' }}>
              Down Payment
            </span>
            {step1Done && estimate.downPaymentReceivedAt && (
              <span className="text-xs text-gray-400">{formatDate(estimate.downPaymentReceivedAt)}</span>
            )}
            {step1Done && estimate.colorChosen && (
              <span className="text-xs font-medium px-1.5 py-0.5 rounded" style={{ backgroundColor: '#EFF6FF', color: '#1D4ED8' }}>
                {estimate.colorChosen}
              </span>
            )}
          </div>
          <span className="text-gray-400 text-xs">{openStep === 1 ? '▲' : '▾'}</span>
        </button>
        {openStep === 1 && (
          <div className="px-4 pb-3 space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={depositChecked}
                onChange={(e) => setDepositChecked(e.target.checked)}
                className="w-4 h-4 rounded"
                style={{ accentColor: '#059669' }}
              />
              <span className="text-sm text-gray-700">Down payment received</span>
            </label>
            {depositChecked && (
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">
                  Color name <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="text"
                  value={colorChosen}
                  onChange={(e) => setColorChosen(e.target.value)}
                  placeholder="e.g. Mocha, Graphite, Slate"
                  autoFocus
                  className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1"
                  style={{ '--tw-ring-color': '#1B3A5C' } as React.CSSProperties}
                />
              </div>
            )}
            <button
              onClick={() => save({ downPaymentReceived: depositChecked, colorChosen: depositChecked ? colorChosen : null })}
              disabled={saving || (depositChecked && !colorChosen.trim())}
              className="text-white px-4 py-1.5 rounded text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
              style={{ backgroundColor: '#1B3A5C' }}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        )}
      </div>

      {/* Step 2: Material List (from proposal) */}
      <div className="border-t border-gray-100">
        <button
          onClick={() => toggleStep(2)}
          className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-gray-50 transition"
        >
          <span className="text-sm font-semibold" style={{ color: step2Done ? '#059669' : '#1B3A5C' }}>
            Material List
          </span>
          <span className="text-gray-400 text-xs">{openStep === 2 ? '▲' : '▾'}</span>
        </button>
        {openStep === 2 && (
          <div className="px-4 pb-3">
            {(() => {
              const items = estimate.items ?? [];
              const sectionTitle = (item: EstimateItem) => item.product?.section?.title?.toLowerCase() ?? '';
              const flakeItem = items.find(i => sectionTitle(i).includes('flake'));
              const topCoatItem = items.find(i => sectionTitle(i).includes('polyaspartic') || sectionTitle(i).includes('top coat'));
              const sealerItem = items.find(i => sectionTitle(i).includes('sealer'));

              const isExterior = estimate.quoteType === 'exterior' || estimate.quoteType === 'both';
              const rows: { label: string; value: string }[] = [
                {
                  label: 'Flake',
                  value: flakeItem
                    ? `${flakeItem.name}${estimate.colorChosen ? ` — ${estimate.colorChosen}` : ''}`
                    : estimate.colorChosen ? `— ${estimate.colorChosen}` : '—',
                },
                { label: 'Top Coat', value: topCoatItem?.name ?? '—' },
                ...(isExterior ? [{ label: 'Sealer', value: sealerItem?.name ?? '—' }] : []),
              ];

              return (
                <div className="space-y-2">
                  <p className="text-xs text-gray-400 mb-1">Coverage: {formatQuoteType(estimate.quoteType)}</p>
                  {rows.map(({ label, value }) => (
                    <div key={label} className="flex items-baseline gap-2">
                      <span className="text-xs font-semibold w-16 flex-shrink-0" style={{ color: '#6B7280' }}>{label}</span>
                      <span className="text-sm text-gray-800">{value}</span>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-gray-100 space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={materialsPurchased}
                        onChange={(e) => setMaterialsPurchased(e.target.checked)}
                        className="w-4 h-4 rounded"
                        style={{ accentColor: '#059669' }}
                      />
                      <span className="text-sm text-gray-700">Materials purchased</span>
                    </label>
                    <button
                      onClick={() => save({ materialsPurchased })}
                      disabled={saving}
                      className="text-white px-4 py-1.5 rounded text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
                      style={{ backgroundColor: '#1B3A5C' }}
                    >
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Step 3: Project Complete */}
      <div className="border-t border-gray-100">
        <button
          onClick={() => toggleStep(3)}
          className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-gray-50 transition"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold" style={{ color: step3Done ? '#059669' : '#1B3A5C' }}>
              Project Complete
            </span>
            {step3Done && estimate.projectCompletedAt && (
              <span className="text-xs text-gray-400">{formatDate(estimate.projectCompletedAt)}</span>
            )}
          </div>
          <span className="text-gray-400 text-xs">{openStep === 3 ? '▲' : '▾'}</span>
        </button>
        {openStep === 3 && (
          <div className="px-4 pb-3 space-y-2.5">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={projectCompleted}
                onChange={(e) => setProjectCompleted(e.target.checked)}
                className="w-4 h-4 rounded"
                style={{ accentColor: '#059669' }}
              />
              <span className="text-sm text-gray-700">Project completed</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={finalPaymentCollected}
                onChange={(e) => setFinalPaymentCollected(e.target.checked)}
                className="w-4 h-4 rounded"
                style={{ accentColor: '#059669' }}
              />
              <span className="text-sm text-gray-700">Final payment collected</span>
            </label>
            <button
              onClick={() => save({ projectCompleted, finalPaymentCollected })}
              disabled={saving}
              className="text-white px-4 py-1.5 rounded text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
              style={{ backgroundColor: '#1B3A5C' }}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

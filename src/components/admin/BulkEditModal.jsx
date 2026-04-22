import { useState } from 'react';
import { FiX, FiSave, FiTrash2 } from 'react-icons/fi';
import { updateProduct } from '../../firebase/products';
import { uploadImageToCloudinary, getOptimizedUrl } from '../../cloudinary/upload';
import { ImageWithSkeleton } from '../ImageWithSkeleton';
import { calculateDiscountPrice } from '../../utils/discountCalc';
import { toTitleCase } from '../../utils/textUtils';
import { useToast } from '../../contexts/ToastContext';
import imageCompression from 'browser-image-compression';

const MAX_IMAGES = 5;

/**
 * BulkEditModal — edit multiple products at once
 * Props:
 *   products  {array}  – array of product objects to edit
 *   onClose   {fn}     – called when modal closes
 *   onSuccess {fn}     – called after all saves complete
 */
export function BulkEditModal({ products: initialProducts, onClose, onSuccess }) {
  const { showSuccess, showError } = useToast();

  // Local editable copies of each product
  const [forms, setForms] = useState(
    initialProducts.map(p => ({
      id: p.id,
      title: p.title || '',
      category: p.category || '',
      price: p.price || '',
      offerPercent: p.offerPercent || '',
      stockStatus: p.stockStatus || 'inStock',
      images: p.images || [],
      _pendingUploads: {}, // blobUrl -> true
    }))
  );

  const [isSaving, setIsSaving] = useState(false);

  const updateForm = (id, field, value) => {
    setForms(prev => prev.map(f => f.id === id ? { ...f, [field]: value } : f));
  };

  const handleImageSelect = async (productId, e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const form = forms.find(f => f.id === productId);
    if (!form) return;

    const remaining = MAX_IMAGES - form.images.length;
    if (remaining <= 0) {
      showError('You can upload up to 5 images only.');
      e.target.value = '';
      return;
    }

    const filesToUpload = files.slice(0, remaining);
    if (files.length > remaining) {
      showError(`You can upload up to 5 images only. Adding first ${remaining}.`);
    }

    // Optimistic previews
    const blobUrls = filesToUpload.map(f => URL.createObjectURL(f));
    setForms(prev => prev.map(f => {
      if (f.id !== productId) return f;
      const newPending = { ...f._pendingUploads };
      blobUrls.forEach(url => { newPending[url] = true; });
      return { ...f, images: [...f.images, ...blobUrls], _pendingUploads: newPending };
    }));

    // Background uploads
    for (let i = 0; i < filesToUpload.length; i++) {
      const file = filesToUpload[i];
      const blobUrl = blobUrls[i];
      try {
        const compressed = await imageCompression(file, { maxSizeMB: 0.19, maxWidthOrHeight: 1200, useWebWorker: true });
        const realUrl = await uploadImageToCloudinary(compressed);
        setForms(prev => prev.map(f => {
          if (f.id !== productId) return f;
          const newPending = { ...f._pendingUploads };
          delete newPending[blobUrl];
          return {
            ...f,
            images: f.images.map(img => img === blobUrl ? realUrl : img),
            _pendingUploads: newPending,
          };
        }));
      } catch {
        showError('An image failed to upload.');
        setForms(prev => prev.map(f => {
          if (f.id !== productId) return f;
          const newPending = { ...f._pendingUploads };
          delete newPending[blobUrl];
          return { ...f, images: f.images.filter(img => img !== blobUrl), _pendingUploads: newPending };
        }));
      }
    }
    e.target.value = '';
  };

  const removeImage = (productId, idx) => {
    setForms(prev => prev.map(f => {
      if (f.id !== productId) return f;
      return { ...f, images: f.images.filter((_, i) => i !== idx) };
    }));
  };

  const handleSaveAll = async () => {
    // Check no pending uploads
    const hasPending = forms.some(f => Object.keys(f._pendingUploads).length > 0);
    if (hasPending) { showError('Please wait for images to finish uploading.'); return; }

    setIsSaving(true);
    let savedCount = 0;
    try {
      for (const form of forms) {
        const priceVal = parseFloat(form.price) || 0;
        const offerVal = parseFloat(form.offerPercent) || 0;
        const payload = {
          title: toTitleCase(form.title),
          category: toTitleCase(form.category),
          price: priceVal,
          offerPercent: offerVal,
          discountPrice: calculateDiscountPrice(priceVal, offerVal),
          stockStatus: form.stockStatus,
          images: form.images,
          updatedAt: new Date(),
        };
        await updateProduct(form.id, payload);
        savedCount++;
      }
      showSuccess(`${savedCount} products updated!`);
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error(err);
      showError('Some products failed to save. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-pk-bg-primary/90 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-pk-surface w-full max-w-4xl rounded-3xl border border-pk-bg-secondary shadow-2xl animate-[slideUp_0.3s_ease-out] my-4">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-pk-surface rounded-t-3xl flex justify-between items-center p-6 border-b border-pk-bg-secondary">
          <h2 className="text-xl font-bold text-pk-text-main">
            Bulk Edit — <span className="text-pk-accent">{forms.length}</span> Products
          </h2>
          <button onClick={onClose} className="p-2 bg-pk-bg-secondary rounded-full hover:bg-pk-bg-primary text-pk-text-muted hover:text-pk-text-main transition-colors">
            <FiX size={20} />
          </button>
        </div>

        {/* Product Forms */}
        <div className="p-6 flex flex-col gap-6">
          {forms.map((form, formIdx) => (
            <div key={form.id} className="bg-pk-bg-primary rounded-2xl border border-pk-bg-secondary p-5">
              <h3 className="font-bold text-pk-text-main text-sm mb-4 truncate">
                <span className="text-pk-text-muted mr-2">#{formIdx + 1}</span>{form.title}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                {/* Price */}
                <div>
                  <label className="block text-xs font-medium text-pk-text-muted mb-1.5 uppercase tracking-wide">Price (₹)</label>
                  <input
                    type="number" min="0"
                    value={form.price}
                    onChange={e => updateForm(form.id, 'price', e.target.value)}
                    className="w-full bg-pk-surface text-pk-text-main border border-pk-bg-secondary rounded-xl px-3 py-2.5 text-sm focus:border-pk-accent outline-none"
                  />
                </div>
                {/* Offer % */}
                <div>
                  <label className="block text-xs font-medium text-pk-text-muted mb-1.5 uppercase tracking-wide">Offer %</label>
                  <input
                    type="number" min="0" max="100"
                    value={form.offerPercent}
                    onChange={e => updateForm(form.id, 'offerPercent', e.target.value)}
                    className="w-full bg-pk-surface text-pk-text-main border border-pk-bg-secondary rounded-xl px-3 py-2.5 text-sm focus:border-pk-accent outline-none"
                  />
                </div>
                {/* Category */}
                <div>
                  <label className="block text-xs font-medium text-pk-text-muted mb-1.5 uppercase tracking-wide">Category</label>
                  <input
                    type="text"
                    value={form.category}
                    onChange={e => updateForm(form.id, 'category', e.target.value)}
                    className="w-full bg-pk-surface text-pk-text-main border border-pk-bg-secondary rounded-xl px-3 py-2.5 text-sm focus:border-pk-accent outline-none"
                  />
                </div>
                {/* Stock Status */}
                <div>
                  <label className="block text-xs font-medium text-pk-text-muted mb-1.5 uppercase tracking-wide">Stock</label>
                  <select
                    value={form.stockStatus}
                    onChange={e => updateForm(form.id, 'stockStatus', e.target.value)}
                    className="w-full bg-pk-surface text-pk-text-main border border-pk-bg-secondary rounded-xl px-3 py-2.5 text-sm focus:border-pk-accent outline-none cursor-pointer"
                  >
                    <option value="inStock">In Stock</option>
                    <option value="limitedStock">Limited Stock</option>
                    <option value="outOfStock">Out of Stock</option>
                  </select>
                </div>
              </div>

              {/* Images */}
              <div>
                <label className="block text-xs font-medium text-pk-text-muted mb-2 uppercase tracking-wide">
                  Images ({form.images.length}/{MAX_IMAGES})
                </label>
                <div className="flex flex-wrap gap-3">
                  {form.images.map((img, idx) => {
                    const isPending = form._pendingUploads[img];
                    return (
                      <div key={idx} className="w-16 h-16 rounded-xl overflow-hidden relative border border-pk-bg-secondary bg-pk-surface group">
                        <ImageWithSkeleton
                          src={isPending ? img : getOptimizedUrl(img, 120)}
                          alt=""
                          containerClassName="w-full h-full"
                          className={`w-full h-full object-contain ${isPending ? 'opacity-40' : ''}`}
                        />
                        {isPending && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-4 h-4 border-2 border-pk-accent border-t-transparent rounded-full animate-spin" />
                          </div>
                        )}
                        {!isPending && (
                          <button
                            type="button"
                            onClick={() => removeImage(form.id, idx)}
                            className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity text-white"
                          >
                            <FiTrash2 size={14} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                  {form.images.length < MAX_IMAGES && (
                    <label className="w-16 h-16 rounded-xl border-2 border-dashed border-pk-bg-secondary hover:border-pk-accent flex items-center justify-center cursor-pointer transition-colors text-pk-text-muted hover:text-pk-accent text-xs font-bold">
                      +Add
                      <input
                        type="file" accept="image/*" multiple className="hidden"
                        onChange={(e) => handleImageSelect(form.id, e)}
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-pk-surface rounded-b-3xl border-t border-pk-bg-secondary p-6 flex justify-end gap-4">
          <button onClick={onClose} className="px-6 py-3 font-medium text-pk-text-muted hover:text-pk-text-main transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSaveAll}
            disabled={isSaving}
            className="flex items-center gap-2 px-8 py-3 bg-pk-success text-pk-bg-primary font-bold rounded-xl hover:shadow-[0_0_15px_rgba(0,200,150,0.4)] transition-all disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <span className="w-4 h-4 border-2 border-pk-bg-primary border-t-transparent rounded-full animate-spin" />
                Saving…
              </>
            ) : (
              <><FiSave size={16} /> Save All Products</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

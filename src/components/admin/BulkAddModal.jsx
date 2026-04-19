import { useState } from 'react';
import { FiPlus, FiTrash2, FiImage, FiX, FiChevronDown, FiChevronUp, FiPackage } from 'react-icons/fi';
import Cropper from 'react-easy-crop';
import 'react-easy-crop/react-easy-crop.css';
import { addProduct } from '../../firebase/products';
import { uploadImageToCloudinary } from '../../cloudinary/upload';
import getCroppedImg from '../../utils/cropImage';
import { calculateDiscountPrice } from '../../utils/discountCalc';
import { useToast } from '../../contexts/ToastContext';
import { getOptimizedUrl } from '../../cloudinary/upload';
import { ImageWithSkeleton } from '../ImageWithSkeleton';

const createEmptyProduct = () => ({
  title: '',
  description: '',
  price: '',
  offerPercent: '',
  category: '',
  sizes: [],
  stockStatus: 'inStock',
  images: [],
  _newSizeName: '',
  _newSizePrice: '',
  _collapsed: false,
});

export default function BulkAddModal({ existingCategories, onClose, onSuccess }) {
  const { showSuccess, showError } = useToast();
  const [products, setProducts] = useState([createEmptyProduct()]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Crop state: { productIndex, imageSrc, crop, zoom, rotation, croppedAreaPixels }
  const [cropState, setCropState] = useState(null);
  const [uploadingIndex, setUploadingIndex] = useState(null);

  /* ─── helpers ─── */
  const updateProduct = (index, patch) =>
    setProducts(prev => prev.map((p, i) => i === index ? { ...p, ...patch } : p));

  const removeProduct = (index) =>
    setProducts(prev => prev.filter((_, i) => i !== index));

  const toggleCollapse = (index) =>
    updateProduct(index, { _collapsed: !products[index]._collapsed });

  const addNewProductSlot = () =>
    setProducts(prev => [...prev, createEmptyProduct()]);

  /* ─── sizes ─── */
  const handleAddSize = (index) => {
    const p = products[index];
    const name = p._newSizeName.trim();
    if (!name) return;
    if (p.sizes.find(s => s.name === name)) return;
    updateProduct(index, {
      sizes: [...p.sizes, { name, price: parseFloat(p._newSizePrice) || parseFloat(p.price) || 0 }],
      _newSizeName: '',
      _newSizePrice: '',
    });
  };

  const handleRemoveSize = (productIndex, sizeName) => {
    setProducts(prev => prev.map((p, i) =>
      i === productIndex ? { ...p, sizes: p.sizes.filter(s => s.name !== sizeName) } : p
    ));
  };

  /* ─── image ─── */
  const readFile = (file) => new Promise(resolve => {
    const reader = new FileReader();
    reader.addEventListener('load', () => resolve(reader.result));
    reader.readAsDataURL(file);
  });

  const handleImageSelect = async (e, productIndex) => {
    if (!e.target.files || !e.target.files[0]) return;
    const imageDataUrl = await readFile(e.target.files[0]);
    setCropState({
      productIndex,
      imageSrc: imageDataUrl,
      crop: { x: 0, y: 0 },
      zoom: 1,
      rotation: 0,
      croppedAreaPixels: null,
    });
    e.target.value = '';
  };

  const handleSaveCrop = async () => {
    if (!cropState) return;
    const { productIndex } = cropState;
    try {
      const blob = await getCroppedImg(cropState.imageSrc, cropState.croppedAreaPixels, cropState.rotation);
      const file = new File([blob], 'cropped.jpg', { type: 'image/jpeg' });
      setCropState(null);
      setUploadingIndex(productIndex);
      const url = await uploadImageToCloudinary(file);
      updateProduct(productIndex, { images: [...products[productIndex].images, url] });
      showSuccess('Image uploaded!');
    } catch (err) {
      console.error(err);
      showError('Image upload failed');
    } finally {
      setUploadingIndex(null);
    }
  };

  const removeImage = (productIndex, imgUrl) => {
    setProducts(prev => prev.map((p, i) =>
      i === productIndex ? { ...p, images: p.images.filter(u => u !== imgUrl) } : p
    ));
  };

  /* ─── submit ─── */
  const handleSubmitAll = async (e) => {
    e.preventDefault();
    for (let i = 0; i < products.length; i++) {
      if (!products[i].title.trim()) {
        showError(`Product ${i + 1} is missing a title`);
        return;
      }
      if (!products[i].category.trim()) {
        showError(`Product ${i + 1} is missing a category`);
        return;
      }
    }
    setIsSubmitting(true);
    try {
      await Promise.all(products.map(p => {
        const priceVal = parseFloat(p.price) || 0;
        const offerVal = parseFloat(p.offerPercent) || 0;
        return addProduct({
          title: p.title,
          description: p.description,
          price: priceVal,
          offerPercent: offerVal,
          discountPrice: calculateDiscountPrice(priceVal, offerVal),
          category: p.category,
          sizes: p.sizes,
          stockStatus: p.stockStatus,
          images: p.images,
        });
      }));
      showSuccess(`${products.length} product${products.length > 1 ? 's' : ''} added successfully!`);
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      showError('Failed to save some products');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Main Bulk Modal */}
      <div className="fixed inset-0 bg-pk-bg-primary/90 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
        <div className="bg-pk-surface w-full max-w-3xl max-h-[95vh] flex flex-col rounded-3xl border border-pk-bg-secondary shadow-2xl animate-[slideUp_0.3s_ease-out]">
          
          {/* Sticky Header */}
          <div className="flex justify-between items-center p-5 md:p-6 border-b border-pk-bg-secondary flex-shrink-0">
            <div>
              <h2 className="text-xl font-bold text-pk-text-main flex items-center gap-2">
                <FiPackage className="text-pk-accent" /> Bulk Add Products
              </h2>
              <p className="text-xs text-pk-text-muted mt-0.5">{products.length} product{products.length !== 1 ? 's' : ''} queued</p>
            </div>
            <button onClick={onClose} className="p-2 bg-pk-bg-secondary rounded-full hover:bg-pk-bg-primary text-pk-text-muted hover:text-pk-text-main flex-shrink-0">
              <FiX size={20} />
            </button>
          </div>

          {/* Scrollable Product List */}
          <form onSubmit={handleSubmitAll} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4">
              {products.map((product, index) => (
                <div key={index} className="bg-pk-bg-primary border border-pk-bg-secondary rounded-2xl overflow-hidden">
                  
                  {/* Product Card Header */}
                  <div className="flex items-center justify-between px-4 py-3 bg-pk-bg-secondary/50">
                    <button
                      type="button"
                      onClick={() => toggleCollapse(index)}
                      className="flex items-center gap-2 flex-1 text-left"
                    >
                      <span className="w-6 h-6 rounded-full bg-pk-accent text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                        {index + 1}
                      </span>
                      <span className="font-semibold text-pk-text-main text-sm truncate">
                        {product.title || `Product ${index + 1}`}
                      </span>
                      {product._collapsed
                        ? <FiChevronDown size={16} className="ml-auto text-pk-text-muted flex-shrink-0" />
                        : <FiChevronUp size={16} className="ml-auto text-pk-text-muted flex-shrink-0" />
                      }
                    </button>
                    {products.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeProduct(index)}
                        className="ml-3 p-1.5 text-pk-text-muted hover:text-pk-error transition-colors flex-shrink-0"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    )}
                  </div>

                  {/* Collapsible Form Body */}
                  {!product._collapsed && (
                    <div className="p-4 space-y-4">
                      {/* Title + Category */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-pk-text-muted mb-1.5 uppercase tracking-wide">Title *</label>
                          <input
                            required
                            type="text"
                            value={product.title}
                            onChange={e => updateProduct(index, { title: e.target.value })}
                            className="w-full bg-pk-surface text-pk-text-main border border-pk-bg-secondary rounded-xl px-3 py-2.5 text-sm focus:border-pk-accent outline-none"
                            placeholder="Product name"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-pk-text-muted mb-1.5 uppercase tracking-wide">Category *</label>
                          <div className="flex flex-col gap-2">
                            <select
                              value={existingCategories.includes(product.category) ? product.category : 'custom'}
                              onChange={e => {
                                if (e.target.value !== 'custom') updateProduct(index, { category: e.target.value });
                                else updateProduct(index, { category: '' });
                              }}
                              className="w-full bg-pk-surface text-pk-text-main border border-pk-bg-secondary rounded-xl px-3 py-2.5 text-sm focus:border-pk-accent outline-none cursor-pointer"
                            >
                              <option value="custom">+ Add New Category</option>
                              {existingCategories.length > 0 && (
                                <optgroup label="Existing Categories">
                                  {existingCategories.map((cat, i) => (
                                    <option key={i} value={cat}>{cat}</option>
                                  ))}
                                </optgroup>
                              )}
                            </select>
                            {!existingCategories.includes(product.category) && (
                              <input
                                required
                                type="text"
                                value={product.category}
                                onChange={e => updateProduct(index, { category: e.target.value })}
                                className="w-full bg-pk-surface text-pk-text-main border border-pk-bg-secondary rounded-xl px-3 py-2.5 text-sm focus:border-pk-accent outline-none"
                                placeholder="Type new category name..."
                              />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Price + Offer */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-pk-text-muted mb-1.5 uppercase tracking-wide">Base Price (₹)</label>
                          <input
                            type="number"
                            min="0"
                            value={product.price}
                            onChange={e => updateProduct(index, { price: e.target.value })}
                            className="w-full bg-pk-surface text-pk-text-main border border-pk-bg-secondary rounded-xl px-3 py-2.5 text-sm focus:border-pk-accent outline-none"
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-pk-text-muted mb-1.5 uppercase tracking-wide">Offer %</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={product.offerPercent}
                            onChange={e => updateProduct(index, { offerPercent: e.target.value })}
                            className="w-full bg-pk-surface text-pk-text-main border border-pk-bg-secondary rounded-xl px-3 py-2.5 text-sm focus:border-pk-accent outline-none"
                            placeholder="0"
                          />
                        </div>
                      </div>

                      {/* Description */}
                      <div>
                        <label className="block text-xs font-medium text-pk-text-muted mb-1.5 uppercase tracking-wide">Description</label>
                        <textarea
                          rows="3"
                          value={product.description}
                          onChange={e => updateProduct(index, { description: e.target.value })}
                          className="w-full bg-pk-surface text-pk-text-main border border-pk-bg-secondary rounded-xl px-3 py-2.5 text-sm focus:border-pk-accent outline-none resize-none"
                          placeholder="Product description..."
                        />
                      </div>

                      {/* Stock Status + Sizes */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-pk-text-muted mb-1.5 uppercase tracking-wide">Stock Status</label>
                          <select
                            value={product.stockStatus}
                            onChange={e => updateProduct(index, { stockStatus: e.target.value })}
                            className="w-full bg-pk-surface text-pk-text-main border border-pk-bg-secondary rounded-xl px-3 py-2.5 text-sm focus:border-pk-accent outline-none cursor-pointer"
                          >
                            <option value="inStock">In Stock</option>
                            <option value="limitedStock">Limited Stock</option>
                            <option value="outOfStock">Out of Stock</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-pk-text-muted mb-1.5 uppercase tracking-wide">Sizes & Pricing (Optional)</label>
                          <div className="flex gap-2 mb-2">
                            <input
                              type="text"
                              value={product._newSizeName}
                              onChange={e => updateProduct(index, { _newSizeName: e.target.value })}
                              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddSize(index))}
                              className="flex-1 min-w-0 bg-pk-surface text-pk-text-main border border-pk-bg-secondary rounded-xl px-3 py-2 text-xs focus:border-pk-accent outline-none"
                              placeholder="Size (e.g. Small)"
                            />
                            <input
                              type="number"
                              min="0"
                              value={product._newSizePrice}
                              onChange={e => updateProduct(index, { _newSizePrice: e.target.value })}
                              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddSize(index))}
                              className="w-16 bg-pk-surface text-pk-text-main border border-pk-bg-secondary rounded-xl px-2 py-2 text-xs focus:border-pk-accent outline-none"
                              placeholder="₹"
                            />
                            <button
                              type="button"
                              onClick={() => handleAddSize(index)}
                              className="px-3 py-2 bg-pk-bg-secondary hover:bg-pk-accent rounded-xl transition-colors text-white text-xs font-bold flex-shrink-0"
                            >Add</button>
                          </div>
                          <div className="flex flex-col gap-1.5 max-h-24 overflow-y-auto">
                            {product.sizes.map(size => (
                              <div key={size.name} className="flex justify-between items-center bg-pk-bg-secondary px-2.5 py-1 rounded-lg text-xs font-bold text-pk-text-main">
                                <span className="uppercase">{size.name}</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-pk-accent">₹{size.price}</span>
                                  <button type="button" onClick={() => handleRemoveSize(index, size.name)} className="text-pk-text-muted hover:text-pk-error">
                                    <FiX size={12} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Images */}
                      <div className="border-t border-pk-bg-secondary pt-4">
                        <label className="block text-xs font-medium text-pk-text-muted mb-2 uppercase tracking-wide">Images</label>
                        <div className="flex flex-wrap gap-3">
                          {product.images.map((img, imgIdx) => (
                            <div key={imgIdx} className="w-20 h-20 rounded-xl overflow-hidden relative group border border-pk-bg-secondary flex-shrink-0">
                              <ImageWithSkeleton 
                                src={getOptimizedUrl(img, 200)} 
                                alt="" 
                                containerClassName="w-full h-full"
                                className="w-full h-full object-cover" 
                              />
                              <button
                                type="button"
                                onClick={() => removeImage(index, img)}
                                className="absolute top-1 right-1 bg-pk-bg-primary/80 backdrop-blur text-pk-error p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity z-10"
                              >
                                <FiTrash2 size={12} />
                              </button>
                            </div>
                          ))}
                          <label className="w-20 h-20 rounded-xl border-2 border-dashed border-pk-bg-secondary hover:border-pk-accent bg-pk-surface flex flex-col items-center justify-center cursor-pointer transition-colors text-pk-text-muted hover:text-pk-accent group flex-shrink-0">
                            {uploadingIndex === index ? (
                              <span className="animate-pulse text-[9px] uppercase font-bold text-center px-1">Uploading...</span>
                            ) : (
                              <>
                                <FiImage size={20} className="group-hover:-translate-y-0.5 transition-transform" />
                                <span className="text-[9px] uppercase font-bold mt-1">Add Image</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={e => handleImageSelect(e, index)}
                                  disabled={uploadingIndex !== null}
                                />
                              </>
                            )}
                          </label>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Add Another Product */}
              <button
                type="button"
                onClick={addNewProductSlot}
                className="w-full py-3 border-2 border-dashed border-pk-bg-secondary hover:border-pk-accent rounded-2xl text-pk-text-muted hover:text-pk-accent transition-colors flex items-center justify-center gap-2 font-semibold text-sm"
              >
                <FiPlus /> Add Another Product
              </button>
            </div>

            {/* Sticky Footer */}
            <div className="border-t border-pk-bg-secondary p-4 sm:p-5 flex items-center justify-between gap-3 flex-shrink-0 bg-pk-surface rounded-b-3xl">
              <span className="text-xs text-pk-text-muted hidden sm:block">
                {products.length} product{products.length !== 1 ? 's' : ''} will be saved
              </span>
              <div className="flex gap-3 ml-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 font-medium text-pk-text-muted hover:text-pk-text-main transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || uploadingIndex !== null}
                  className="px-6 py-2.5 bg-pk-success text-pk-bg-primary font-bold rounded-xl hover:shadow-[0_0_15px_rgba(0,200,150,0.4)] transition-all disabled:opacity-50 flex items-center gap-2 text-sm"
                >
                  {isSubmitting
                    ? `Saving ${products.length} products...`
                    : `Save ${products.length} Product${products.length !== 1 ? 's' : ''}`
                  }
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Crop Modal (renders on top) */}
      {cropState && (
        <div className="fixed inset-0 bg-pk-bg-primary/95 z-[60] flex flex-col items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl h-[50vh] sm:h-[55vh] bg-black rounded-xl overflow-hidden mb-4 shadow-[0_0_20px_rgba(0,0,0,0.5)]">
            <Cropper
              image={cropState.imageSrc}
              crop={cropState.crop}
              rotation={cropState.rotation}
              zoom={cropState.zoom}
              aspect={1}
              onCropChange={crop => setCropState(p => ({ ...p, crop }))}
              onRotationChange={rotation => setCropState(p => ({ ...p, rotation }))}
              onCropComplete={(_, pixels) => setCropState(p => ({ ...p, croppedAreaPixels: pixels }))}
              onZoomChange={zoom => setCropState(p => ({ ...p, zoom }))}
            />
          </div>
          <div className="flex flex-col gap-4 w-full max-w-2xl bg-pk-surface p-5 rounded-2xl border border-pk-bg-secondary shadow-xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-pk-text-muted uppercase tracking-wider">Zoom</label>
                <input type="range" value={cropState.zoom} min={1} max={3} step={0.1}
                  onChange={e => setCropState(p => ({ ...p, zoom: e.target.value }))}
                  className="w-full accent-pk-accent" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-pk-text-muted uppercase tracking-wider">Rotation</label>
                <input type="range" value={cropState.rotation} min={0} max={360} step={1}
                  onChange={e => setCropState(p => ({ ...p, rotation: e.target.value }))}
                  className="w-full accent-pk-accent" />
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-pk-bg-secondary pt-4">
              <button type="button" onClick={() => setCropState(null)} className="px-5 py-2.5 font-medium text-pk-text-muted hover:text-pk-text-main transition-colors text-sm">
                Cancel
              </button>
              <button type="button" onClick={handleSaveCrop} className="px-6 py-2.5 bg-pk-accent text-white font-bold rounded-xl hover:bg-blue-600 transition-colors text-sm">
                Crop & Upload
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

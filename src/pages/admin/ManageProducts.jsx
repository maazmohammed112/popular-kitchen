import { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiImage, FiX, FiLayers, FiUpload, FiCamera } from 'react-icons/fi';
import { getProducts, addProduct, updateProduct, deleteProduct } from '../../firebase/products';
import { uploadImageToCloudinary } from '../../cloudinary/upload';
import Cropper from 'react-easy-crop';
import 'react-easy-crop/react-easy-crop.css';
import getCroppedImg from '../../utils/cropImage';
import { calculateDiscountPrice } from '../../utils/discountCalc';
import { useToast } from '../../contexts/ToastContext';
import BulkAddModal from '../../components/admin/BulkAddModal';
import CSVUploadModal from '../../components/admin/CSVUploadModal';
import { ImageWithSkeleton } from '../../components/ImageWithSkeleton';
import { getOptimizedUrl } from '../../cloudinary/upload';
import imageCompression from 'browser-image-compression';
import { FiCrop } from 'react-icons/fi';
import { toTitleCase } from '../../utils/textUtils';

export default function ManageProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { showSuccess, showError } = useToast();

  const initialForm = {
    id: '', title: '', description: '', price: '', 
    offerPercent: '', category: '', sizes: [], 
    stockStatus: 'inStock', images: []
  };
  const [formData, setFormData] = useState(initialForm);
  const [newSizeName, setNewSizeName] = useState('');
  const [newSizePrice, setNewSizePrice] = useState('');
  const [uploadingImages, setUploadingImages] = useState(false);
  const [cropState, setCropState] = useState({
    imageSrc: null,
    crop: { x: 0, y: 0 },
    zoom: 1,
    rotation: 0,
    croppedAreaPixels: null,
    editingIndex: null
  });
  
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState({ old: '', new: '' });
  const [isCategorySubmitting, setIsCategorySubmitting] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [pendingUploads, setPendingUploads] = useState({}); // Stores status for blob URLs

  const existingCategories = [...new Set(products.map(p => p.category))].filter(Boolean);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await getProducts();
      setProducts(data);
    } catch (err) {
      console.error(err);
      showError("Failed to fetch products");
    } finally {
      setLoading(false);
    }
  };

  const handleEditCategory = async () => {
    if (!editingCategory.old || !editingCategory.new.trim() || editingCategory.old === editingCategory.new.trim()) {
      setEditingCategory({ old: '', new: '' });
      return;
    }
    setIsCategorySubmitting(true);
    try {
      const targetProducts = products.filter(p => p.category === editingCategory.old);
      for(let p of targetProducts) {
        await updateProduct(p.id, { category: editingCategory.new.trim() });
      }
      showSuccess(`Updated category for ${targetProducts.length} products`);
      setEditingCategory({ old: '', new: '' });
      await fetchProducts();
    } catch (e) {
      console.error(e);
      showError("Failed to update category");
    } finally {
      setIsCategorySubmitting(false);
    }
  };

  const handleDeleteCategory = async (cat) => {
    if(window.confirm(`Are you sure you want to delete the "${cat}" category?\nAll products in this category will become "Uncategorized".`)) {
       setIsCategorySubmitting(true);
       try {
         const targetProducts = products.filter(p => p.category === cat);
         for(let p of targetProducts) {
           await updateProduct(p.id, { category: 'Uncategorized' });
         }
         showSuccess(`Removed category from ${targetProducts.length} products`);
         await fetchProducts();
       } catch (e) {
         console.error(e);
         showError("Failed to delete category");
       } finally {
         setIsCategorySubmitting(false);
       }
    }
  };

  const handleSanitizeAll = async () => {
    if (!window.confirm("This will automatically format ALL existing product names and categories to professional Title Case (e.g. 'STAINLESS STEEL' -> 'Stainless Steel'). Proceed?")) return;
    
    setLoading(true);
    let updatedCount = 0;
    try {
      for (const p of products) {
        const newTitle = toTitleCase(p.title);
        const newCategory = toTitleCase(p.category);
        
        if (newTitle !== p.title || newCategory !== p.category) {
          await updateProduct(p.id, { 
            title: newTitle, 
            category: newCategory 
          });
          updatedCount++;
        }
      }
      showSuccess(`Cleaned up ${updatedCount} products!`);
      await fetchProducts();
    } catch (err) {
      console.error(err);
      showError("Failed to sanitize some products");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (product = null) => {
    if (product) {
      const normalizedSizes = (product.sizes || []).map(s => 
        typeof s === 'string' ? { name: s, price: product.discountPrice || product.price } : s
      );
      setFormData({ ...product, sizes: normalizedSizes, images: product.images || [] });
    } else {
      setFormData(initialForm);
    }
    setIsModalOpen(true);
  };

  const handleAddSize = () => {
    if (newSizeName.trim()) {
      const name = newSizeName.trim();
      if (!formData.sizes.find(s => s.name === name)) {
        setFormData(prev => ({ 
          ...prev, 
          sizes: [...prev.sizes, { name, price: parseFloat(newSizePrice) || parseFloat(formData.discountPrice || formData.price) || 0 }] 
        }));
        setNewSizeName('');
        setNewSizePrice('');
      }
    }
  };

  const handleRemoveSize = (sizeNameToRemove) => {
    setFormData(prev => ({ ...prev, sizes: prev.sizes.filter(s => s.name !== sizeNameToRemove) }));
  };

  const readFile = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.addEventListener('load', () => resolve(reader.result), false);
      reader.readAsDataURL(file);
    });
  };

  const handleImageSelect = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const blobUrl = URL.createObjectURL(file);
      
      // 1. Optimistic Update: Add to list immediately
      setFormData(prev => ({ ...prev, images: [...prev.images, blobUrl] }));
      setPendingUploads(prev => ({ ...prev, [blobUrl]: true }));
      
      // 2. Background Upload
      try {
        const options = {
          maxSizeMB: 0.19, // Strictly under 200KB
          maxWidthOrHeight: 1200,
          useWebWorker: true,
          initialQuality: 0.85 // Better quality
        };
        
        const compressedFile = await imageCompression(file, options);
        const realUrl = await uploadImageToCloudinary(compressedFile);
        
        // Replace blobUrl with realUrl
        setFormData(prev => ({
          ...prev,
          images: prev.images.map(img => img === blobUrl ? realUrl : img)
        }));
        setPendingUploads(prev => {
          const newState = { ...prev };
          delete newState[blobUrl];
          return newState;
        });
        showSuccess("Image joined the gallery");
      } catch (err) {
        console.error(err);
        showError("Upload failed, removing preview...");
        setFormData(prev => ({
          ...prev,
          images: prev.images.filter(img => img !== blobUrl)
        }));
      } finally {
        e.target.value = '';
        // Note: We don't revoke immediately because it's being used in the preview
      }
    }
  };

  const handleOpenCrop = (imgUrl, index) => {
    setCropState({
      imageSrc: imgUrl,
      crop: { x: 0, y: 0 },
      zoom: 1,
      rotation: 0,
      croppedAreaPixels: null,
      editingIndex: index
    });
  };

  const onCropComplete = (croppedArea, croppedAreaPixels) => {
    setCropState(prev => ({ ...prev, croppedAreaPixels }));
  };

  const handleSaveCrop = async () => {
    try {
      const croppedImageBlob = await getCroppedImg(
        cropState.imageSrc,
        cropState.croppedAreaPixels,
        cropState.rotation
      );
      const file = new File([croppedImageBlob], `cropped_${Date.now()}.jpg`, { type: "image/jpeg" });
      
      setCropState(prev => ({ ...prev, imageSrc: null }));
      setUploadingImages(true);
      
      const url = await uploadImageToCloudinary(file);
      
      if (cropState.editingIndex !== null) {
        setFormData(prev => {
          const newImages = [...prev.images];
          newImages[cropState.editingIndex] = url;
          return { ...prev, images: newImages };
        });
      } else {
        setFormData(prev => ({ ...prev, images: [...prev.images, url] }));
      }
      
      showSuccess("Image updated successfully");
    } catch (err) {
      console.error(err);
      showError("Image crop or upload failed");
    } finally {
      setUploadingImages(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check if any uploads are still pending
    if (Object.keys(pendingUploads).length > 0) {
      showError("Please wait for images to finish uploading");
      return;
    }

    const backupProducts = [...products];
    setIsSubmitting(true);
    
    try {
      const priceVal = parseFloat(formData.price) || 0;
      const offerVal = parseFloat(formData.offerPercent) || 0;
      
      const payload = {
        title: toTitleCase(formData.title),
        description: formData.description,
        price: priceVal,
        offerPercent: offerVal,
        discountPrice: calculateDiscountPrice(priceVal, offerVal),
        category: toTitleCase(formData.category),
        sizes: formData.sizes,
        stockStatus: formData.stockStatus,
        images: formData.images,
        updatedAt: new Date()
      };

      // --- Optimistic UI Update ---
      if (formData.id) {
        setProducts(prev => prev.map(p => p.id === formData.id ? { ...p, ...payload } : p));
      } else {
        const tempId = `temp-${Date.now()}`;
        setProducts(prev => [{ ...payload, id: tempId }, ...prev]);
      }
      
      setIsModalOpen(false); // Close instantly
      showSuccess(formData.id ? "Updating product..." : "Adding product...");

      // --- Background Backend Call ---
      if (formData.id) {
        await updateProduct(formData.id, payload);
        showSuccess("Changes synchronized");
      } else {
        await addProduct(payload);
        showSuccess("Product verified & added");
      }
      
      fetchProducts(); // Refresh in background to get real IDs/ServerTimestamps
    } catch (err) {
      console.error(err);
      showError("Sync failed. Rolling back changes.");
      setProducts(backupProducts); // Rollback
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      const backupProducts = [...products];
      
      // Optimistic Update
      setProducts(prev => prev.filter(p => p.id !== id));
      showSuccess("Deleting product...");

      try {
        await deleteProduct(id);
        showSuccess("Product removed from database");
      } catch (err) {
        showError("Delete failed. Reverting...");
        setProducts(backupProducts); // Rollback
      }
    }
  };

  return (
    <div className="animate-[slideUp_0.4s_ease-out]">
      <div className="flex flex-wrap justify-between items-center mb-8 gap-3">
        <h1 className="text-2xl md:text-3xl font-bold text-pk-text-main">Manage Products</h1>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <button 
            onClick={() => setIsCategoryModalOpen(true)}
            className="flex items-center gap-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-pk-bg-secondary text-pk-text-main rounded-xl font-medium hover:bg-pk-bg-primary transition-colors border border-pk-bg-secondary text-sm"
          >
            Manage Categories
          </button>
          <button 
            onClick={handleSanitizeAll}
            disabled={loading || products.length === 0}
            className="flex items-center gap-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-white border border-pk-bg-secondary text-pk-text-muted hover:text-pk-accent hover:border-pk-accent rounded-xl text-sm font-semibold transition-all disabled:opacity-50 shadow-sm"
            title="Fix all messy product names and categories"
          >
            <FiLayers className="text-pk-accent" /> Sanitize Names
          </button>
          <button 
            onClick={() => setIsCsvModalOpen(true)}
            className="flex items-center gap-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-[#D87333] hover:bg-[#bf652d] text-white rounded-xl font-bold transition-all shadow-lg text-sm shadow-orange-900/10"
          >
            <FiUpload size={16} /> CSV Import
          </button>
          <button 
            onClick={() => setIsBulkModalOpen(true)}
            className="flex items-center gap-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-pk-secondary text-white rounded-xl font-medium hover:opacity-90 transition-colors shadow-lg text-sm"
          >
            <FiLayers size={16} /> Bulk Add
          </button>
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-pk-accent text-white rounded-xl font-medium hover:bg-blue-600 transition-colors shadow-lg shadow-pk-accent/20 text-sm"
          >
            <FiPlus size={16} /> Add Product
          </button>
        </div>
      </div>

      <div className="bg-pk-surface rounded-3xl border border-pk-bg-secondary overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-pk-text-muted animate-pulse">Loading products...</div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center text-pk-text-muted">No products found. Add one above.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-pk-bg-secondary bg-[#12233f]">
                  <th className="p-4 font-medium text-pk-text-muted text-sm">Product</th>
                  <th className="p-4 font-medium text-pk-text-muted text-sm">Category</th>
                  <th className="p-4 font-medium text-pk-text-muted text-sm">Price</th>
                  <th className="p-4 font-medium text-pk-text-muted text-sm">Status</th>
                  <th className="p-4 font-medium text-pk-text-muted text-sm text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map(product => (
                  <tr key={product.id} className="border-b border-pk-bg-secondary/50 hover:bg-pk-bg-primary/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-pk-bg-primary overflow-hidden flex-shrink-0">
                          {product.images?.[0] ? (
                            <ImageWithSkeleton 
                              src={getOptimizedUrl(product.images[0], 100)} 
                              alt="" 
                              containerClassName="w-full h-full bg-[#1e2a44]"
                              className="w-full h-full object-contain" 
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[8px] text-pk-text-muted">No Img</div>
                          )}
                        </div>
                        <span className="font-semibold text-pk-text-main max-w-[200px] truncate">{product.title}</span>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-pk-text-muted uppercase">{product.category}</td>
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-pk-text-main">₹{product.discountPrice || product.price}</span>
                        {product.offerPercent > 0 && <span className="text-[10px] text-pk-error uppercase">{product.offerPercent}% off</span>}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${
                        product.stockStatus === 'inStock' ? 'bg-pk-success/20 text-pk-success' :
                        product.stockStatus === 'outOfStock' ? 'bg-pk-error/20 text-pk-error' :
                        'bg-pk-warning/20 text-pk-warning'
                      }`}>
                        {product.stockStatus === 'inStock' ? 'In Stock' :
                         product.stockStatus === 'outOfStock' ? 'Out of Stock' : 'Limited'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button onClick={() => handleOpenModal(product)} className="p-2 text-pk-text-muted hover:text-pk-text-main transition-colors"><FiEdit2 /></button>
                      <button onClick={() => handleDelete(product.id)} className="p-2 text-pk-text-muted hover:text-pk-error transition-colors ml-2"><FiTrash2 /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-pk-bg-primary/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-pk-surface w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl border border-pk-bg-secondary p-6 md:p-8 shadow-2xl animate-[slideUp_0.3s_ease-out]">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-pk-text-main">{formData.id ? 'Edit Product' : 'Add New Product'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 bg-pk-bg-secondary rounded-full hover:bg-pk-bg-primary text-pk-text-muted hover:text-pk-text-main"><FiX size={20}/></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-medium text-pk-text-muted mb-2 uppercase tracking-wide">Title</label>
                  <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-pk-bg-primary text-pk-text-main border border-pk-bg-secondary rounded-xl px-4 py-3 focus:border-pk-accent outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-pk-text-muted mb-2 uppercase tracking-wide">Category</label>
                  <div className="flex flex-col gap-3">
                    <select 
                      value={existingCategories.includes(formData.category) ? formData.category : 'custom'} 
                      onChange={e => {
                        if(e.target.value !== 'custom') setFormData({...formData, category: e.target.value});
                        else setFormData({...formData, category: ''});
                      }}
                      className="w-full bg-pk-bg-primary text-pk-text-main border border-pk-bg-secondary rounded-xl px-4 py-3 focus:border-pk-accent outline-none cursor-pointer"
                    >
                      <option value="custom" className="font-bold text-pk-accent">+ Add New Category</option>
                      {existingCategories.length > 0 && (
                        <optgroup label="Existing Categories">
                          {existingCategories.map((cat, idx) => (
                            <option key={idx} value={cat}>{cat}</option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                    {!existingCategories.includes(formData.category) && (
                      <input 
                        required 
                        type="text" 
                        value={formData.category} 
                        onChange={e => setFormData({...formData, category: e.target.value})} 
                        className="w-full bg-pk-bg-primary text-pk-text-main border border-pk-bg-secondary rounded-xl px-4 py-3 focus:border-pk-accent outline-none animate-[slideUp_0.2s_ease-out]" 
                        placeholder="Type new category name..." 
                      />
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-pk-text-muted mb-2 uppercase tracking-wide">Base Price (₹) - Optional if sizes have prices</label>
                  <input type="number" min="0" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full bg-pk-bg-primary text-pk-text-main border border-pk-bg-secondary rounded-xl px-4 py-3 focus:border-pk-accent outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-pk-text-muted mb-2 uppercase tracking-wide">Offer Percent (%)</label>
                  <input type="number" min="0" max="100" value={formData.offerPercent} onChange={e => setFormData({...formData, offerPercent: e.target.value})} className="w-full bg-pk-bg-primary text-pk-text-main border border-pk-bg-secondary rounded-xl px-4 py-3 focus:border-pk-accent outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-pk-text-muted mb-2 uppercase tracking-wide">Description</label>
                <textarea required rows="4" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-pk-bg-primary text-pk-text-main border border-pk-bg-secondary rounded-xl px-4 py-3 focus:border-pk-accent outline-none resize-none"></textarea>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-pk-bg-secondary pt-6">
                <div>
                  <label className="block text-xs font-medium text-pk-text-muted mb-2 uppercase tracking-wide">Stock Status</label>
                  <select value={formData.stockStatus} onChange={e => setFormData({...formData, stockStatus: e.target.value})} className="w-full bg-pk-bg-primary text-pk-text-main border border-pk-bg-secondary rounded-xl px-4 py-3 focus:border-pk-accent outline-none cursor-pointer">
                    <option value="inStock">In Stock</option>
                    <option value="limitedStock">Limited Stock</option>
                    <option value="outOfStock">Out of Stock</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-pk-text-muted mb-2 uppercase tracking-wide">Sizes & Pricing (Optional)</label>
                  <div className="flex gap-2 mb-3">
                    <input type="text" value={newSizeName} onChange={e => setNewSizeName(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddSize())} className="flex-1 bg-pk-bg-primary text-pk-text-main border border-pk-bg-secondary rounded-xl px-4 py-2 text-sm focus:border-pk-accent outline-none" placeholder="Size (e.g. Small)" />
                    <input type="number" min="0" value={newSizePrice} onChange={e => setNewSizePrice(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddSize())} className="w-24 bg-pk-bg-primary text-pk-text-main border border-pk-bg-secondary rounded-xl px-4 py-2 text-sm focus:border-pk-accent outline-none" placeholder="Price ₹" />
                    <button type="button" onClick={handleAddSize} className="px-4 py-2 bg-pk-bg-secondary hover:bg-pk-accent rounded-xl transition-colors text-white text-sm font-medium">Add</button>
                  </div>
                  <div className="flex flex-col gap-2 max-h-32 overflow-y-auto">
                    {formData.sizes.map(size => (
                      <div key={size.name} className="flex justify-between items-center bg-pk-bg-secondary px-3 py-1.5 rounded-lg text-xs font-bold text-pk-text-main">
                        <span className="uppercase">{size.name}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-pk-accent">₹{size.price}</span>
                          <button type="button" onClick={() => handleRemoveSize(size.name)} className="text-pk-text-muted hover:text-pk-error"><FiX size={14}/></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="border-t border-pk-bg-secondary pt-6">
                <label className="block text-xs font-medium text-pk-text-muted mb-2 uppercase tracking-wide">Images</label>
                <div className="flex flex-wrap gap-4 mb-4">
                  {formData.images.map((img, idx) => {
                    const isPending = pendingUploads[img];
                    return (
                      <div key={idx} className="w-24 h-24 rounded-xl overflow-hidden relative group border border-pk-bg-secondary bg-pk-bg-primary">
                        <ImageWithSkeleton 
                          src={isPending ? img : getOptimizedUrl(img, 200)} 
                          alt="" 
                          containerClassName="w-full h-full"
                          className={`w-full h-full object-contain ${isPending ? 'opacity-50 blur-[1px]' : ''}`} 
                        />
                        {isPending && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20 z-20">
                            <div className="w-6 h-6 border-2 border-pk-accent border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        )}
                        <div className="absolute top-1 right-1 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                          {!isPending && (
                            <button type="button" onClick={() => handleOpenCrop(img, idx)} className="bg-pk-bg-primary/80 backdrop-blur text-pk-accent p-1.5 rounded-lg hover:text-white hover:bg-pk-accent transition-all">
                              <FiCrop size={14}/>
                            </button>
                          )}
                          <button type="button" onClick={() => setFormData(prev => ({...prev, images: prev.images.filter((_, i) => i !== idx)}))} className="bg-pk-bg-primary/80 backdrop-blur text-pk-error p-1.5 rounded-lg hover:text-white hover:bg-pk-error transition-all">
                            <FiTrash2 size={14}/>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  
                  <label className="w-24 h-24 rounded-xl border-2 border-dashed border-pk-bg-secondary hover:border-pk-accent bg-pk-bg-primary flex flex-col items-center justify-center cursor-pointer transition-colors text-pk-text-muted hover:text-pk-accent group">
                    {uploadingImages ? (
                      <span className="animate-pulse text-[10px] uppercase font-bold mt-2">Uploading</span>
                    ) : (
                      <>
                        <FiCamera size={24} className="group-hover:-translate-y-1 transition-transform" />
                        <span className="text-[10px] uppercase font-bold mt-2">Camera</span>
                        <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageSelect} disabled={uploadingImages} />
                      </>
                    )}
                  </label>

                  <label className="w-24 h-24 rounded-xl border-2 border-dashed border-pk-bg-secondary hover:border-pk-accent bg-pk-bg-primary flex flex-col items-center justify-center cursor-pointer transition-colors text-pk-text-muted hover:text-pk-accent group">
                    {uploadingImages ? (
                      <span className="animate-pulse text-[10px] uppercase font-bold mt-2">Uploading</span>
                    ) : (
                      <>
                        <FiImage size={24} className="group-hover:-translate-y-1 transition-transform" />
                        <span className="text-[10px] uppercase font-bold mt-2">Add file</span>
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageSelect} disabled={uploadingImages} />
                      </>
                    )}
                  </label>
                </div>
              </div>

              <div className="border-t border-pk-bg-secondary pt-6 flex justify-end gap-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 font-medium text-pk-text-muted hover:text-pk-text-main transition-colors">Cancel</button>
                <button type="submit" disabled={isSubmitting || uploadingImages} className="px-8 py-3 bg-pk-success text-pk-bg-primary font-bold rounded-xl hover:shadow-[0_0_15px_rgba(0,200,150,0.4)] transition-all disabled:opacity-50 flex items-center gap-2">
                  {isSubmitting ? 'Saving...' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Crop Modal */}
      {cropState.imageSrc && (
        <div className="fixed inset-0 bg-pk-bg-primary/95 z-[60] flex flex-col items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl h-[55vh] bg-black rounded-xl overflow-hidden mb-6 shadow-[0_0_20px_rgba(0,0,0,0.5)]">
            <Cropper
              image={cropState.imageSrc}
              crop={cropState.crop}
              rotation={cropState.rotation}
              zoom={cropState.zoom}
              aspect={1}
              onCropChange={(crop) => setCropState(p => ({...p, crop}))}
              onRotationChange={(rotation) => setCropState(p => ({...p, rotation}))}
              onCropComplete={onCropComplete}
              onZoomChange={(zoom) => setCropState(p => ({...p, zoom}))}
            />
          </div>
          <div className="flex flex-col gap-4 w-full max-w-2xl bg-pk-surface p-6 rounded-2xl border border-pk-bg-secondary shadow-xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-pk-text-muted uppercase tracking-wider">Zoom</label>
                <input 
                  type="range" 
                  value={cropState.zoom} 
                  min={1} 
                  max={3} 
                  step={0.1}
                  aria-labelledby="Zoom"
                  onChange={(e) => setCropState(p => ({...p, zoom: e.target.value}))} 
                  className="w-full accent-pk-accent"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-pk-text-muted uppercase tracking-wider">Rotation</label>
                <input 
                  type="range" 
                  value={cropState.rotation} 
                  min={0} 
                  max={360} 
                  step={1}
                  aria-labelledby="Rotation"
                  onChange={(e) => setCropState(p => ({...p, rotation: e.target.value}))} 
                  className="w-full accent-pk-accent"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-4 border-t border-pk-bg-secondary pt-4">
               <button type="button" onClick={() => setCropState({...cropState, imageSrc: null})} className="px-5 py-2.5 font-medium text-pk-text-muted hover:text-pk-text-main transition-colors">Cancel</button>
               <button type="button" onClick={handleSaveCrop} className="px-6 py-2.5 bg-pk-accent text-white font-bold rounded-xl hover:bg-blue-600 transition-colors shadow-lg shadow-pk-accent/20">
                 Crop & Upload
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Categories Manage Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-pk-bg-primary/95 z-[70] flex items-center justify-center p-4">
           <div className="bg-pk-surface w-full max-w-md rounded-3xl border border-pk-bg-secondary p-6 shadow-2xl animate-[slideUp_0.3s_ease-out]">
             <div className="flex justify-between items-center mb-6">
               <h2 className="text-xl font-bold text-pk-text-main">Manage Categories</h2>
               <button onClick={() => { setIsCategoryModalOpen(false); setEditingCategory({old:'',new:''}) }} className="p-2 bg-pk-bg-secondary rounded-full text-pk-text-muted hover:text-pk-text-main"><FiX /></button>
             </div>
             <div className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto pr-2">
               {existingCategories.length === 0 && <p className="text-pk-text-muted text-sm text-center py-4 border border-dashed border-pk-bg-secondary rounded-xl uppercase tracking-wider">No Categories Found.</p>}
               {existingCategories.map(cat => (
                 <div key={cat} className="flex flex-col gap-2 p-4 bg-pk-bg-primary border border-pk-bg-secondary rounded-xl hover:border-pk-accent transition-colors group">
                   {editingCategory.old === cat ? (
                     <div className="flex gap-2 items-center">
                       <input autoFocus type="text" value={editingCategory.new} onChange={e => setEditingCategory({...editingCategory, new: e.target.value})} onKeyDown={e => e.key === 'Enter' && handleEditCategory()} className="flex-1 bg-pk-surface border border-pk-bg-secondary px-3 py-2 rounded-lg text-sm font-semibold text-pk-text-main outline-none focus:border-pk-accent" />
                       <button disabled={isCategorySubmitting} onClick={handleEditCategory} className="px-4 py-2 bg-pk-accent text-white text-xs font-bold rounded-lg disabled:opacity-50">Save</button>
                       <button disabled={isCategorySubmitting} onClick={() => setEditingCategory({old:'', new:''})} className="px-4 py-2 bg-pk-bg-secondary text-pk-text-muted text-xs font-bold rounded-lg hover:text-pk-text-main">Cancel</button>
                     </div>
                   ) : (
                     <div className="flex justify-between items-center">
                       <span className="font-semibold text-pk-text-main">{cat}</span>
                       <div className="flex gap-2">
                         <button onClick={() => setEditingCategory({old: cat, new: cat})} className="p-2 text-pk-text-muted hover:text-pk-accent transition-colors bg-pk-surface rounded-lg opacity-0 group-hover:opacity-100 focus:opacity-100"><FiEdit2 size={16}/></button>
                         <button onClick={() => handleDeleteCategory(cat)} className="p-2 text-pk-text-muted hover:text-pk-error transition-colors bg-pk-surface rounded-lg opacity-0 group-hover:opacity-100 focus:opacity-100"><FiTrash2 size={16}/></button>
                       </div>
                     </div>
                   )}
                 </div>
               ))}
             </div>
           </div>
        </div>
      )}

      {/* Bulk Add Modal */}
      {isBulkModalOpen && (
        <BulkAddModal
          existingCategories={existingCategories}
          onClose={() => setIsBulkModalOpen(false)}
          onSuccess={fetchProducts}
        />
      )}

      {/* CSV Import Modal */}
      {isCsvModalOpen && (
        <CSVUploadModal
          existingCategories={existingCategories}
          onClose={() => setIsCsvModalOpen(false)}
          onSuccess={fetchProducts}
        />
      )}
    </div>
  );
}

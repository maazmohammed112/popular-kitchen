import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FiPlus, FiEdit2, FiTrash2, FiImage, FiX, FiLayers, FiUpload, FiCamera, FiMoreVertical, FiArrowLeft, FiCheckSquare, FiSquare } from 'react-icons/fi';
import { getProducts, addProduct, updateProduct, deleteProduct } from '../../firebase/products';
import { uploadImageToCloudinary } from '../../cloudinary/upload';
import Cropper from 'react-easy-crop';
import 'react-easy-crop/react-easy-crop.css';
import getCroppedImg from '../../utils/cropImage';
import { calculateDiscountPrice } from '../../utils/discountCalc';
import { useToast } from '../../contexts/ToastContext';
import BulkAddModal from '../../components/admin/BulkAddModal';
import CSVUploadModal from '../../components/admin/CSVUploadModal';
import { BulkEditModal } from '../../components/admin/BulkEditModal';
import { ConfirmDeleteModal } from '../../components/ConfirmDeleteModal';
import { ImageWithSkeleton } from '../../components/ImageWithSkeleton';
import { getOptimizedUrl } from '../../cloudinary/upload';
import imageCompression from 'browser-image-compression';
import { FiCrop } from 'react-icons/fi';
import { toTitleCase } from '../../utils/textUtils';

const MAX_IMAGES = 5;

export default function ManageProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Bulk mode: null | 'edit' | 'delete'
  const [bulkMode, setBulkMode] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Three-dot row menu
  const [openMenuId, setOpenMenuId] = useState(null);
  const menuRef = useRef(null);

  // Single product delete confirmation
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Back-navigation: detect if we came from the store view
  const location = useLocation();
  const navigate = useNavigate();
  const incomingEditId = location.state?.editProductId || null;
  // Track the row ref for stay-on-save
  const editingRowRef = useRef(null);

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
  const [pendingUploads, setPendingUploads] = useState({});

  const existingCategories = [...new Set(products.map(p => p.category))].filter(Boolean);

  useEffect(() => { fetchProducts(); }, []);

  // If navigated from store view with a product to edit, open modal once products loaded
  useEffect(() => {
    if (incomingEditId && products.length > 0) {
      const product = products.find(p => p.id === incomingEditId);
      if (product) {
        handleOpenModal(product);
        // Clear state so refresh doesn't re-open
        navigate(location.pathname, { replace: true, state: {} });
      }
    }
  }, [incomingEditId, products]);

  // Close three-dot menu on outside click
  useEffect(() => {
    if (!openMenuId) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpenMenuId(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [openMenuId]);

  // Bulk helpers
  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const selectAll = () => setSelectedIds(new Set(products.map(p => p.id)));
  const clearSelection = () => { setSelectedIds(new Set()); setBulkMode(null); };

  const handleBulkDeleteConfirm = async () => {
    setIsBulkDeleting(true);
    const backup = [...products];
    const ids = [...selectedIds];
    setProducts(prev => prev.filter(p => !selectedIds.has(p.id)));
    try {
      await Promise.all(ids.map(id => deleteProduct(id)));
      showSuccess(`${ids.length} products deleted`);
    } catch {
      showError('Some deletes failed. Reverting...');
      setProducts(backup);
    } finally {
      setIsBulkDeleting(false);
      setBulkDeleteConfirm(false);
      clearSelection();
    }
  };

  const handleDeleteConfirmed = async () => {
    if (!deleteConfirmId) return;
    setIsDeleting(true);
    const backup = [...products];
    setProducts(prev => prev.filter(p => p.id !== deleteConfirmId));
    showSuccess('Deleting product...');
    try {
      await deleteProduct(deleteConfirmId);
      showSuccess('Product removed');
    } catch {
      showError('Delete failed. Reverting...');
      setProducts(backup);
    } finally {
      setIsDeleting(false);
      setDeleteConfirmId(null);
    }
  };

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
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    // Enforce max 5 images
    const currentCount = formData.images.length;
    if (currentCount >= MAX_IMAGES) {
      showError('You can upload up to 5 images only.');
      e.target.value = '';
      return;
    }
    const remaining = MAX_IMAGES - currentCount;
    const filesToUpload = files.slice(0, remaining);
    if (files.length > remaining) {
      showError(`You can upload up to 5 images only. Adding first ${remaining}.`);
    }

    // Optimistic previews for all selected files
    const blobUrls = filesToUpload.map(f => URL.createObjectURL(f));
    setFormData(prev => ({ ...prev, images: [...prev.images, ...blobUrls] }));
    const newPending = {};
    blobUrls.forEach(url => { newPending[url] = true; });
    setPendingUploads(prev => ({ ...prev, ...newPending }));

    // Upload each file in background
    for (let i = 0; i < filesToUpload.length; i++) {
      const file = filesToUpload[i];
      const blobUrl = blobUrls[i];
      try {
        const options = { maxSizeMB: 0.19, maxWidthOrHeight: 1200, useWebWorker: true, initialQuality: 0.85 };
        const compressedFile = await imageCompression(file, options);
        const realUrl = await uploadImageToCloudinary(compressedFile);
        setFormData(prev => ({ ...prev, images: prev.images.map(img => img === blobUrl ? realUrl : img) }));
        setPendingUploads(prev => { const s = { ...prev }; delete s[blobUrl]; return s; });
        showSuccess('Image uploaded');
      } catch (err) {
        console.error(err);
        showError('Upload failed, removing preview...');
        setFormData(prev => ({ ...prev, images: prev.images.filter(img => img !== blobUrl) }));
        setPendingUploads(prev => { const s = { ...prev }; delete s[blobUrl]; return s; });
      }
    }
    e.target.value = '';
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

      // Save the ID before closing modal so we can scroll back to the row
      const editedId = formData.id;

      setIsModalOpen(false); // Close instantly
      showSuccess(editedId ? "Updating product..." : "Adding product...");

      // Scroll back to the edited row (stay-on-save behaviour)
      if (editedId) {
        setTimeout(() => {
          const row = document.getElementById(`product-row-${editedId}`);
          if (row) {
            row.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Brief highlight flash to confirm save
            row.style.transition = 'background 0.4s';
            row.style.background = 'rgba(0,200,150,0.08)';
            setTimeout(() => { row.style.background = ''; }, 1500);
          }
        }, 150);
      }

      // --- Background Backend Call ---
      if (editedId) {
        await updateProduct(editedId, payload);
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

  // handleDelete now uses modal — triggers confirmation
  const handleDelete = (id) => {
    setDeleteConfirmId(id);
  };


  return (
    <div className="animate-[slideUp_0.4s_ease-out]">
      <div className="flex flex-wrap justify-between items-center mb-8 gap-3">
        {/* Back button if came from store view */}
        {incomingEditId && (
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2 bg-pk-bg-secondary text-pk-text-muted hover:text-pk-text-main rounded-xl text-sm font-medium transition-colors border border-pk-bg-secondary"
          >
            <FiArrowLeft size={15} /> Back to Store
          </button>
        )}
        <h1 className="text-2xl md:text-3xl font-bold text-pk-text-main">Manage Products</h1>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          {/* Bulk action buttons */}
          {bulkMode === null ? (
            <>
              <button
                onClick={() => { setBulkMode('delete'); setSelectedIds(new Set()); }}
                disabled={products.length === 0}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-pk-error/10 text-pk-error border border-pk-error/30 rounded-xl font-medium hover:bg-pk-error/20 transition-colors text-sm disabled:opacity-40"
              >
                <FiTrash2 size={15} /> Bulk Delete
              </button>
              <button
                onClick={() => { setBulkMode('edit'); setSelectedIds(new Set()); }}
                disabled={products.length === 0}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-pk-accent/10 text-pk-accent border border-pk-accent/30 rounded-xl font-medium hover:bg-pk-accent/20 transition-colors text-sm disabled:opacity-40"
              >
                <FiEdit2 size={15} /> Bulk Edit
              </button>
            </>
          ) : (
            <>
              <button onClick={clearSelection} className="flex items-center gap-2 px-3 py-2 bg-pk-bg-secondary text-pk-text-muted rounded-xl text-sm font-medium border border-pk-bg-secondary hover:text-pk-text-main transition-colors">
                <FiX size={15} /> Cancel
              </button>
              <button onClick={selectAll} className="flex items-center gap-2 px-3 py-2 bg-pk-bg-secondary text-pk-text-muted rounded-xl text-sm font-medium border border-pk-bg-secondary hover:text-pk-text-main transition-colors">
                Select All
              </button>
              {bulkMode === 'delete' && selectedIds.size > 0 && (
                <button
                  onClick={() => setBulkDeleteConfirm(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-pk-error text-white rounded-xl text-sm font-bold shadow-lg shadow-red-500/20 hover:bg-red-700 transition-colors"
                >
                  <FiTrash2 size={15} /> Delete {selectedIds.size} Selected
                </button>
              )}
              {bulkMode === 'edit' && selectedIds.size > 0 && (
                <button
                  onClick={() => setIsBulkEditModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-pk-accent text-white rounded-xl text-sm font-bold shadow-lg shadow-pk-accent/20 hover:bg-blue-600 transition-colors"
                >
                  <FiEdit2 size={15} /> Edit {selectedIds.size} Selected
                </button>
              )}
            </>
          )}
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
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-pk-bg-secondary bg-[#12233f]">
                  <th className="p-4 font-medium text-pk-text-muted text-sm w-10">
                    {bulkMode ? (
                      <button onClick={() => selectedIds.size === products.length ? setSelectedIds(new Set()) : selectAll()} className="text-pk-accent">
                        {selectedIds.size === products.length ? <FiCheckSquare size={16} /> : <FiSquare size={16} />}
                      </button>
                    ) : null}
                  </th>
                  <th className="p-4 font-medium text-pk-text-muted text-sm">Product</th>
                  <th className="p-4 font-medium text-pk-text-muted text-sm">Category</th>
                  <th className="p-4 font-medium text-pk-text-muted text-sm">Price</th>
                  <th className="p-4 font-medium text-pk-text-muted text-sm">Status</th>
                  <th className="p-4 font-medium text-pk-text-muted text-sm text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map(product => (
                  <tr
                    key={product.id}
                    id={`product-row-${product.id}`}
                    className={`border-b border-pk-bg-secondary/50 hover:bg-pk-bg-primary/50 transition-colors ${
                      selectedIds.has(product.id) ? 'bg-pk-accent/5' : ''
                    }`}
                  >
                    {/* Checkbox / Three-dot column */}
                    <td className="p-4 w-10">
                      {bulkMode ? (
                        <button
                          onClick={() => toggleSelect(product.id)}
                          className={`transition-colors ${selectedIds.has(product.id) ? 'text-pk-accent' : 'text-pk-text-muted hover:text-pk-accent'}`}
                        >
                          {selectedIds.has(product.id) ? <FiCheckSquare size={16} /> : <FiSquare size={16} />}
                        </button>
                      ) : (
                        <div className="relative" ref={openMenuId === product.id ? menuRef : null}>
                          <button
                            onClick={() => setOpenMenuId(openMenuId === product.id ? null : product.id)}
                            className="p-1.5 rounded-lg text-pk-text-muted hover:text-pk-text-main hover:bg-pk-bg-secondary transition-colors"
                            title="Quick actions"
                          >
                            <FiMoreVertical size={16} />
                          </button>
                          {openMenuId === product.id && (
                            <div className="absolute left-0 top-8 bg-pk-surface border border-pk-bg-secondary rounded-xl shadow-2xl min-w-[120px] py-1 z-30 animate-[slideDown_0.15s_ease-out]">
                              <button
                                onClick={() => { setOpenMenuId(null); handleOpenModal(product); }}
                                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-pk-text-main hover:bg-pk-bg-secondary transition-colors"
                              >
                                <FiEdit2 size={13} className="text-pk-accent" /> Edit
                              </button>
                              <button
                                onClick={() => { setOpenMenuId(null); handleDelete(product.id); }}
                                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-pk-error hover:bg-pk-error/10 transition-colors"
                              >
                                <FiTrash2 size={13} /> Delete
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </td>
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
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-medium text-pk-text-muted uppercase tracking-wide">Images</label>
                  <span className={`text-xs font-bold ${formData.images.length >= MAX_IMAGES ? 'text-pk-error' : 'text-pk-text-muted'}`}>
                    {formData.images.length}/{MAX_IMAGES}
                  </span>
                </div>
                {formData.images.length >= MAX_IMAGES && (
                  <p className="text-xs text-pk-error mb-2 font-medium">Maximum 5 images reached. Remove one to add more.</p>
                )}
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
                  
                  {formData.images.length < MAX_IMAGES && (
                    <label className="w-24 h-24 rounded-xl border-2 border-dashed border-pk-bg-secondary hover:border-pk-accent bg-pk-bg-primary flex flex-col items-center justify-center cursor-pointer transition-colors text-pk-text-muted hover:text-pk-accent group">
                      {uploadingImages ? (
                        <span className="animate-pulse text-[10px] uppercase font-bold mt-2">Uploading</span>
                      ) : (
                        <>
                          <FiCamera size={24} className="group-hover:-translate-y-1 transition-transform" />
                          <span className="text-[10px] uppercase font-bold mt-2">Camera</span>
                          <input type="file" accept="image/*" capture="environment" multiple className="hidden" onChange={handleImageSelect} disabled={uploadingImages} />
                        </>
                      )}
                    </label>
                  )}

                  {formData.images.length < MAX_IMAGES && (
                    <label className="w-24 h-24 rounded-xl border-2 border-dashed border-pk-bg-secondary hover:border-pk-accent bg-pk-bg-primary flex flex-col items-center justify-center cursor-pointer transition-colors text-pk-text-muted hover:text-pk-accent group">
                      {uploadingImages ? (
                        <span className="animate-pulse text-[10px] uppercase font-bold mt-2">Uploading</span>
                      ) : (
                        <>
                          <FiImage size={24} className="group-hover:-translate-y-1 transition-transform" />
                          <span className="text-[10px] uppercase font-bold mt-2">Add files</span>
                          <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageSelect} disabled={uploadingImages} />
                        </>
                      )}
                    </label>
                  )}
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

      {/* Bulk Edit Modal */}
      {isBulkEditModalOpen && (
        <BulkEditModal
          products={products.filter(p => selectedIds.has(p.id))}
          onClose={() => setIsBulkEditModalOpen(false)}
          onSuccess={() => { fetchProducts(); clearSelection(); }}
        />
      )}

      {/* Bulk Delete Confirmation */}
      {bulkDeleteConfirm && (
        <ConfirmDeleteModal
          message={`These ${selectedIds.size} products will be permanently deleted. Are you sure?`}
          onConfirm={handleBulkDeleteConfirm}
          onCancel={() => setBulkDeleteConfirm(false)}
          isDeleting={isBulkDeleting}
        />
      )}

      {/* Single Product Delete Confirmation */}
      {deleteConfirmId && (
        <ConfirmDeleteModal
          message="This product will be permanently deleted. Are you sure?"
          onConfirm={handleDeleteConfirmed}
          onCancel={() => setDeleteConfirmId(null)}
          isDeleting={isDeleting}
        />
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiImage, FiX } from 'react-icons/fi';
import { getProducts, addProduct, updateProduct, deleteProduct } from '../../firebase/products';
import { uploadImageToCloudinary } from '../../cloudinary/upload';
import { calculateDiscountPrice } from '../../utils/discountCalc';
import { useToast } from '../../contexts/ToastContext';

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
  const [newSize, setNewSize] = useState('');
  const [uploadingImages, setUploadingImages] = useState(false);

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

  const handleOpenModal = (product = null) => {
    if (product) {
      setFormData({ ...product, sizes: product.sizes || [], images: product.images || [] });
    } else {
      setFormData(initialForm);
    }
    setIsModalOpen(true);
  };

  const handleAddSize = () => {
    if (newSize && !formData.sizes.includes(newSize.trim())) {
      setFormData(prev => ({ ...prev, sizes: [...prev.sizes, newSize.trim()] }));
      setNewSize('');
    }
  };

  const handleRemoveSize = (sizeToRemove) => {
    setFormData(prev => ({ ...prev, sizes: prev.sizes.filter(s => s !== sizeToRemove) }));
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    
    setUploadingImages(true);
    try {
      const urls = await Promise.all(files.map(file => uploadImageToCloudinary(file)));
      setFormData(prev => ({ ...prev, images: [...prev.images, ...urls] }));
      showSuccess("Images uploaded");
    } catch (err) {
      console.error(err);
      showError("Image upload failed");
    } finally {
      setUploadingImages(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const priceVal = parseFloat(formData.price) || 0;
      const offerVal = parseFloat(formData.offerPercent) || 0;
      
      const payload = {
        title: formData.title,
        description: formData.description,
        price: priceVal,
        offerPercent: offerVal,
        discountPrice: calculateDiscountPrice(priceVal, offerVal),
        category: formData.category,
        sizes: formData.sizes,
        stockStatus: formData.stockStatus,
        images: formData.images
      };

      if (formData.id) {
        await updateProduct(formData.id, payload);
        showSuccess("Product updated successfully");
      } else {
        await addProduct(payload);
        showSuccess("Product created successfully");
      }
      
      setIsModalOpen(false);
      fetchProducts();
    } catch (err) {
      console.error(err);
      showError("Error saving product");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await deleteProduct(id);
        showSuccess("Product deleted");
        fetchProducts();
      } catch (err) {
        showError("Failed to delete product");
      }
    }
  };

  return (
    <div className="animate-[slideUp_0.4s_ease-out]">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-white">Manage Products</h1>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-5 py-2.5 bg-pk-accent text-white rounded-xl font-medium hover:bg-blue-600 transition-colors shadow-lg shadow-pk-accent/20"
        >
          <FiPlus /> Add Product
        </button>
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
                            <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[8px] text-pk-text-muted">No Img</div>
                          )}
                        </div>
                        <span className="font-semibold text-white max-w-[200px] truncate">{product.title}</span>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-pk-text-muted uppercase">{product.category}</td>
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-white">₹{product.discountPrice || product.price}</span>
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
                      <button onClick={() => handleOpenModal(product)} className="p-2 text-pk-text-muted hover:text-white transition-colors"><FiEdit2 /></button>
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
        <div className="fixed inset-0 bg-pk-bg-primary/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-pk-surface w-full max-w-3xl rounded-3xl border border-pk-bg-secondary p-6 md:p-8 my-8 shadow-2xl animate-[slideUp_0.3s_ease-out]">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">{formData.id ? 'Edit Product' : 'Add New Product'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 bg-pk-bg-secondary rounded-full hover:bg-pk-bg-primary text-pk-text-muted hover:text-white"><FiX size={20}/></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-medium text-pk-text-muted mb-2 uppercase tracking-wide">Title</label>
                  <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-pk-bg-primary text-white border border-pk-bg-secondary rounded-xl px-4 py-3 focus:border-pk-accent outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-pk-text-muted mb-2 uppercase tracking-wide">Category</label>
                  <input required type="text" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full bg-pk-bg-primary text-white border border-pk-bg-secondary rounded-xl px-4 py-3 focus:border-pk-accent outline-none" placeholder="Cookware, Storage, etc" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-pk-text-muted mb-2 uppercase tracking-wide">Price (₹)</label>
                  <input required type="number" min="0" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full bg-pk-bg-primary text-white border border-pk-bg-secondary rounded-xl px-4 py-3 focus:border-pk-accent outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-pk-text-muted mb-2 uppercase tracking-wide">Offer Percent (%)</label>
                  <input type="number" min="0" max="100" value={formData.offerPercent} onChange={e => setFormData({...formData, offerPercent: e.target.value})} className="w-full bg-pk-bg-primary text-white border border-pk-bg-secondary rounded-xl px-4 py-3 focus:border-pk-accent outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-pk-text-muted mb-2 uppercase tracking-wide">Description</label>
                <textarea required rows="4" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-pk-bg-primary text-white border border-pk-bg-secondary rounded-xl px-4 py-3 focus:border-pk-accent outline-none resize-none"></textarea>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-pk-bg-secondary pt-6">
                <div>
                  <label className="block text-xs font-medium text-pk-text-muted mb-2 uppercase tracking-wide">Stock Status</label>
                  <select value={formData.stockStatus} onChange={e => setFormData({...formData, stockStatus: e.target.value})} className="w-full bg-pk-bg-primary text-white border border-pk-bg-secondary rounded-xl px-4 py-3 focus:border-pk-accent outline-none cursor-pointer">
                    <option value="inStock">In Stock</option>
                    <option value="limitedStock">Limited Stock</option>
                    <option value="outOfStock">Out of Stock</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-pk-text-muted mb-2 uppercase tracking-wide">Sizes (Optional)</label>
                  <div className="flex gap-2 mb-3">
                    <input type="text" value={newSize} onChange={e => setNewSize(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddSize())} className="flex-1 bg-pk-bg-primary text-white border border-pk-bg-secondary rounded-xl px-4 py-2 text-sm focus:border-pk-accent outline-none" placeholder="e.g. Small, 2L, Medium" />
                    <button type="button" onClick={handleAddSize} className="px-4 py-2 bg-pk-bg-secondary hover:bg-pk-accent rounded-xl transition-colors text-white text-sm font-medium">Add</button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.sizes.map(size => (
                      <span key={size} className="flex items-center gap-1 bg-pk-bg-secondary px-3 py-1 rounded-full text-xs font-bold text-white uppercase">
                        {size} <button type="button" onClick={() => handleRemoveSize(size)} className="text-pk-text-muted hover:text-pk-error ml-1"><FiX size={12}/></button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="border-t border-pk-bg-secondary pt-6">
                <label className="block text-xs font-medium text-pk-text-muted mb-2 uppercase tracking-wide">Images</label>
                <div className="flex flex-wrap gap-4 mb-4">
                  {formData.images.map((img, idx) => (
                    <div key={idx} className="w-24 h-24 rounded-xl overflow-hidden relative group border border-pk-bg-secondary">
                      <img src={img} alt="" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => setFormData(prev => ({...prev, images: prev.images.filter(i => i !== img)}))} className="absolute top-1 right-1 bg-pk-bg-primary/80 backdrop-blur text-pk-error p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                        <FiTrash2 size={14}/>
                      </button>
                    </div>
                  ))}
                  
                  <label className="w-24 h-24 rounded-xl border-2 border-dashed border-pk-bg-secondary hover:border-pk-accent bg-pk-bg-primary flex flex-col items-center justify-center cursor-pointer transition-colors text-pk-text-muted hover:text-pk-accent group">
                    {uploadingImages ? (
                      <span className="animate-pulse text-[10px] uppercase font-bold mt-2">Uploading</span>
                    ) : (
                      <>
                        <FiImage size={24} className="group-hover:-translate-y-1 transition-transform" />
                        <span className="text-[10px] uppercase font-bold mt-2">Add Files</span>
                        <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploadingImages} />
                      </>
                    )}
                  </label>
                </div>
              </div>

              <div className="border-t border-pk-bg-secondary pt-6 flex justify-end gap-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 font-medium text-pk-text-muted hover:text-white transition-colors">Cancel</button>
                <button type="submit" disabled={isSubmitting || uploadingImages} className="px-8 py-3 bg-pk-success text-pk-bg-primary font-bold rounded-xl hover:shadow-[0_0_15px_rgba(0,200,150,0.4)] transition-all disabled:opacity-50 flex items-center gap-2">
                  {isSubmitting ? 'Saving...' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

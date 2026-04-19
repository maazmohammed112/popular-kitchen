import { useState, useRef } from 'react';
import { FiUpload, FiX, FiDownload, FiCheckCircle, FiAlertCircle, FiFileText, FiTrash2, FiEdit2, FiSave, FiPlus } from 'react-icons/fi';
import { addProduct } from '../../firebase/products';
import { calculateDiscountPrice } from '../../utils/discountCalc';
import { useToast } from '../../contexts/ToastContext';
import { getOptimizedUrl } from '../../cloudinary/upload';
import { ImageWithSkeleton } from '../ImageWithSkeleton';

const SAMPLE_CSV = `title,description,price,offerPercent,category,stockStatus,sizes,image1,image2,image3
Stainless Steel Pan,Heavy duty 5-litre cooking pan,999,10,Cookware,inStock,Small:250 Medium:450 Large:750,,
Commercial Wok,Carbon steel flat-bottom wok,1499,0,Cookware,inStock,,,
Shawarma Machine,Vertical gas-powered shawarma grill,8999,5,Grills,limitedStock,Single:8500 Double:15000,,
`;

function parseSizes(raw = '') {
  if (!raw || !raw.trim()) return [];
  return raw.trim().split(/[\s,]+/).filter(Boolean).map(entry => {
    const [name, price] = entry.split(':');
    return { name: (name || '').trim(), price: parseFloat(price) || 0 };
  }).filter(s => s.name);
}

function sizeToString(sizes = []) {
  return sizes.map(s => `${s.name}:${s.price}`).join(' ');
}

function parseRow(row, headers) {
  const obj = {};
  headers.forEach((h, i) => { obj[h.trim().toLowerCase().replace(/[^a-z0-9]/g, '')] = (row[i] || '').trim(); });
  const price = parseFloat(obj.price) || 0;
  const offerPercent = parseFloat(obj.offerpercent || obj.offerpct || obj.offerpercent) || 0;
  const images = [obj.image1, obj.image2, obj.image3].filter(Boolean);
  const stockOptions = ['inStock', 'limitedStock', 'outOfStock'];
  const stockStatus = stockOptions.includes(obj.stockstatus) ? obj.stockstatus : 'inStock';
  return {
    title: obj.title || '',
    description: obj.description || '',
    price,
    offerPercent,
    discountPrice: calculateDiscountPrice(price, offerPercent),
    category: obj.category || '',
    stockStatus,
    sizes: parseSizes(obj.sizes),
    images,
    _errors: [],
    _editing: false,
  };
}

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return { products: [], error: 'CSV must have a header row and at least one data row.' };
  const headers = lines[0].split(',');
  const rows = lines.slice(1).map(line => {
    const cols = [];
    let cur = '', inQ = false;
    for (let c of line) {
      if (c === '"') { inQ = !inQ; }
      else if (c === ',' && !inQ) { cols.push(cur); cur = ''; }
      else cur += c;
    }
    cols.push(cur);
    return cols;
  });
  const products = rows.map(row => {
    const p = parseRow(row, headers);
    if (!p.title) p._errors.push('Missing title');
    if (!p.category) p._errors.push('Missing category');
    return p;
  });
  return { products, error: null };
}

/* ── Inline-editable row ─────────────────────────────────────────── */
function EditableRow({ product, index, onUpdate, onRemove, existingCategories }) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState({ ...product, _sizesRaw: sizeToString(product.sizes) });

  const saveEdit = () => {
    const price = parseFloat(draft.price) || 0;
    const offerPercent = parseFloat(draft.offerPercent) || 0;
    const errors = [];
    if (!draft.title.trim()) errors.push('Missing title');
    if (!draft.category.trim()) errors.push('Missing category');
    onUpdate(index, {
      ...draft,
      price,
      offerPercent,
      discountPrice: calculateDiscountPrice(price, offerPercent),
      sizes: parseSizes(draft._sizesRaw),
      _errors: errors,
      _editing: false,
    });
    setIsEditing(false);
  };

  const cancelEdit = () => {
    setDraft({ ...product, _sizesRaw: sizeToString(product.sizes) });
    setIsEditing(false);
  };

  const hasError = product._errors.length > 0;

  if (isEditing) {
    return (
      <div className={`rounded-2xl border-2 ${hasError ? 'border-pk-error/60' : 'border-pk-accent/60'} bg-pk-bg-primary overflow-hidden`}>
        <div className="flex items-center justify-between px-4 py-2.5 bg-pk-accent/10 border-b border-pk-accent/20">
          <span className="text-xs font-bold text-pk-accent uppercase tracking-wider">Editing Product {index + 1}</span>
          <div className="flex gap-2">
            <button type="button" onClick={saveEdit} className="flex items-center gap-1 px-3 py-1.5 bg-pk-success text-pk-bg-primary text-xs font-bold rounded-lg">
              <FiSave size={12} /> Save
            </button>
            <button type="button" onClick={cancelEdit} className="flex items-center gap-1 px-3 py-1.5 bg-pk-bg-secondary text-pk-text-muted text-xs font-bold rounded-lg hover:text-pk-text-main">
              Cancel
            </button>
          </div>
        </div>
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-pk-text-muted mb-1 uppercase tracking-wider">Title *</label>
            <input value={draft.title} onChange={e => setDraft(d => ({ ...d, title: e.target.value }))} className="w-full bg-pk-surface border border-pk-bg-secondary rounded-lg px-3 py-2 text-sm text-pk-text-main outline-none focus:border-pk-accent" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-pk-text-muted mb-1 uppercase tracking-wider">Category *</label>
            <div className="flex flex-col gap-2">
              <select
                value={existingCategories.includes(draft.category) ? draft.category : '_new_'}
                onChange={e => { if (e.target.value !== '_new_') setDraft(d => ({ ...d, category: e.target.value })); else setDraft(d => ({ ...d, category: '' })); }}
                className="w-full bg-pk-surface border border-pk-bg-secondary rounded-lg px-3 py-2 text-sm text-pk-text-main outline-none cursor-pointer"
              >
                <option value="_new_">+ New Category</option>
                {existingCategories.map((c, i) => <option key={i} value={c}>{c}</option>)}
              </select>
              {!existingCategories.includes(draft.category) && (
                <input value={draft.category} onChange={e => setDraft(d => ({ ...d, category: e.target.value }))} className="w-full bg-pk-surface border border-pk-bg-secondary rounded-lg px-3 py-2 text-sm text-pk-text-main outline-none focus:border-pk-accent" placeholder="Type category..." />
              )}
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-pk-text-muted mb-1 uppercase tracking-wider">Price (₹)</label>
            <input type="number" min="0" value={draft.price} onChange={e => setDraft(d => ({ ...d, price: e.target.value }))} className="w-full bg-pk-surface border border-pk-bg-secondary rounded-lg px-3 py-2 text-sm text-pk-text-main outline-none focus:border-pk-accent" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-pk-text-muted mb-1 uppercase tracking-wider">Offer %</label>
            <input type="number" min="0" max="100" value={draft.offerPercent} onChange={e => setDraft(d => ({ ...d, offerPercent: e.target.value }))} className="w-full bg-pk-surface border border-pk-bg-secondary rounded-lg px-3 py-2 text-sm text-pk-text-main outline-none focus:border-pk-accent" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-pk-text-muted mb-1 uppercase tracking-wider">Stock Status</label>
            <select value={draft.stockStatus} onChange={e => setDraft(d => ({ ...d, stockStatus: e.target.value }))} className="w-full bg-pk-surface border border-pk-bg-secondary rounded-lg px-3 py-2 text-sm text-pk-text-main outline-none cursor-pointer">
              <option value="inStock">In Stock</option>
              <option value="limitedStock">Limited Stock</option>
              <option value="outOfStock">Out of Stock</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-pk-text-muted mb-1 uppercase tracking-wider">Sizes (Name:Price …)</label>
            <input value={draft._sizesRaw} onChange={e => setDraft(d => ({ ...d, _sizesRaw: e.target.value }))} className="w-full bg-pk-surface border border-pk-bg-secondary rounded-lg px-3 py-2 text-sm text-pk-text-main outline-none focus:border-pk-accent font-mono" placeholder="Small:250 Large:450" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-[10px] font-bold text-pk-text-muted mb-1 uppercase tracking-wider">Description</label>
            <textarea rows="2" value={draft.description} onChange={e => setDraft(d => ({ ...d, description: e.target.value }))} className="w-full bg-pk-surface border border-pk-bg-secondary rounded-lg px-3 py-2 text-sm text-pk-text-main outline-none focus:border-pk-accent resize-none" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-[10px] font-bold text-pk-text-muted mb-1 uppercase tracking-wider">Image URLs (one per line)</label>
            <textarea
              rows="3"
              value={draft.images.join('\n')}
              onChange={e => setDraft(d => ({ ...d, images: e.target.value.split('\n').map(s => s.trim()).filter(Boolean) }))}
              className="w-full bg-pk-surface border border-pk-bg-secondary rounded-lg px-3 py-2 text-sm text-pk-text-main outline-none focus:border-pk-accent resize-none font-mono"
              placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg"
            />
          </div>
        </div>
      </div>
    );
  }

  /* Read-only view */
  return (
    <div className={`rounded-2xl border overflow-hidden transition-colors ${hasError ? 'border-pk-error/40 bg-pk-error/5' : 'border-pk-bg-secondary bg-pk-bg-primary'}`}>
      {/* Row header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <span className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${hasError ? 'bg-pk-error/20 text-pk-error' : 'bg-pk-success/20 text-pk-success'}`}>
          {hasError ? <FiAlertCircle size={11} /> : <FiCheckCircle size={11} />}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-pk-text-main text-sm truncate">{product.title || <em className="text-pk-error">No title</em>}</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pk-bg-secondary text-pk-text-muted uppercase">{product.category || 'No category'}</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${product.stockStatus === 'inStock' ? 'bg-pk-success/15 text-pk-success' : product.stockStatus === 'limitedStock' ? 'bg-pk-warning/15 text-pk-warning' : 'bg-pk-error/15 text-pk-error'}`}>
              {product.stockStatus === 'inStock' ? 'In Stock' : product.stockStatus === 'limitedStock' ? 'Limited' : 'Out of Stock'}
            </span>
          </div>
          {hasError && <p className="text-[10px] text-pk-error mt-0.5">{product._errors.join(' · ')}</p>}
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="text-right hidden sm:block">
            <div className="text-sm font-bold text-pk-text-main">₹{product.discountPrice || product.price || 0}</div>
            {product.offerPercent > 0 && <div className="text-[10px] text-pk-error">{product.offerPercent}% off</div>}
          </div>
          <button type="button" onClick={() => setIsEditing(true)} className="p-1.5 text-pk-text-muted hover:text-pk-accent transition-colors bg-pk-surface rounded-lg">
            <FiEdit2 size={14} />
          </button>
          <button type="button" onClick={() => onRemove(index)} className="p-1.5 text-pk-text-muted hover:text-pk-error transition-colors bg-pk-surface rounded-lg">
            <FiTrash2 size={14} />
          </button>
        </div>
      </div>

      {/* Details strip */}
      <div className="flex flex-wrap gap-x-6 gap-y-1 px-4 pb-3 text-xs text-pk-text-muted border-t border-pk-bg-secondary/50 pt-2">
        {product.description && <span className="truncate max-w-[260px]">📝 {product.description}</span>}
        {product.price > 0 && <span>💰 ₹{product.price}{product.offerPercent > 0 ? ` → ₹${product.discountPrice}` : ''}</span>}
        {product.sizes.length > 0 && <span>📐 {product.sizes.map(s => `${s.name}: ₹${s.price}`).join(' · ')}</span>}
        {product.images.length > 0 && (
          <span className="flex items-center gap-1.5">
            🖼 {product.images.length} image{product.images.length > 1 ? 's' : ''}
            <span className="flex gap-1">
              {product.images.slice(0, 3).map((url, i) => (
                <ImageWithSkeleton 
                  key={i} 
                  src={getOptimizedUrl(url, 100)} 
                  alt="" 
                  containerClassName="w-6 h-6 rounded overflow-hidden border border-pk-bg-secondary"
                  className="w-full h-full object-cover"
                />
              ))}
            </span>
          </span>
        )}
      </div>
    </div>
  );
}

/* ── Main Modal ──────────────────────────────────────────────────── */
export default function CSVUploadModal({ existingCategories = [], onClose, onSuccess }) {
  const { showSuccess, showError } = useToast();
  const fileRef = useRef();

  const [step, setStep] = useState('guide');
  const [parsedProducts, setParsedProducts] = useState([]);
  const [parseError, setParseError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveProgress, setSaveProgress] = useState({ done: 0, total: 0 });

  const downloadSample = () => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'popular_kitchen_sample.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const { products, error } = parseCSV(ev.target.result);
      if (error) { setParseError(error); return; }
      setParseError('');
      setParsedProducts(products);
      setStep('preview');
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleUpdate = (index, updated) => {
    setParsedProducts(prev => prev.map((p, i) => i === index ? updated : p));
  };
  const handleRemove = (index) => setParsedProducts(prev => prev.filter((_, i) => i !== index));

  const addBlankRow = () => {
    setParsedProducts(prev => [...prev, {
      title: '', description: '', price: 0, offerPercent: 0,
      discountPrice: 0, category: '', stockStatus: 'inStock',
      sizes: [], images: [], _errors: ['Missing title', 'Missing category'], _editing: false,
    }]);
  };

  const handleSaveAll = async () => {
    const valid = parsedProducts.filter(p => p._errors.length === 0);
    if (!valid.length) { showError('No valid products to save'); return; }
    setSaving(true);
    setSaveProgress({ done: 0, total: valid.length });
    let done = 0;
    for (const p of valid) {
      try {
        await addProduct({
          title: p.title, description: p.description, price: p.price,
          offerPercent: p.offerPercent, discountPrice: p.discountPrice,
          category: p.category, stockStatus: p.stockStatus,
          sizes: p.sizes, images: p.images,
        });
        done++;
        setSaveProgress({ done, total: valid.length });
      } catch (err) { console.error(err); }
    }
    showSuccess(`${done} product${done !== 1 ? 's' : ''} imported!`);
    onSuccess();
    onClose();
  };

  const validCount = parsedProducts.filter(p => p._errors.length === 0).length;
  const errorCount = parsedProducts.length - validCount;

  return (
    <div className="fixed inset-0 bg-pk-bg-primary/90 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-pk-surface w-full max-w-4xl max-h-[95vh] flex flex-col rounded-3xl border border-pk-bg-secondary shadow-2xl animate-[slideUp_0.3s_ease-out]">

        {/* Header */}
        <div className="flex justify-between items-center p-5 md:p-6 border-b border-pk-bg-secondary flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-pk-text-main flex items-center gap-2">
              <FiFileText className="text-pk-accent" />
              {step === 'guide' ? 'CSV Import — Column Guide' : `Preview & Edit (${parsedProducts.length} rows)`}
            </h2>
            <p className="text-xs text-pk-text-muted mt-0.5">
              {step === 'guide' && 'Download the template, fill it in, then upload'}
              {step === 'preview' && !saving && `${validCount} valid · ${errorCount} errors — click ✏️ to edit any row before saving`}
              {saving && `Saving… ${saveProgress.done} / ${saveProgress.total}`}
            </p>
          </div>
          {!saving && (
            <button onClick={onClose} className="p-2 bg-pk-bg-secondary rounded-full hover:bg-pk-bg-primary text-pk-text-muted hover:text-pk-text-main flex-shrink-0">
              <FiX size={20} />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {/* Guide step */}
          {step === 'guide' && (
            <div className="p-5 md:p-6 space-y-5">
              <div className="overflow-x-auto rounded-xl border border-pk-bg-secondary">
                <table className="w-full text-left text-xs min-w-[560px]">
                  <thead className="bg-pk-bg-secondary/60">
                    <tr>
                      {['Column', 'Required', 'Example', 'Notes'].map(h => (
                        <th key={h} className="px-4 py-2.5 font-bold text-pk-text-muted uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-pk-bg-secondary">
                    {[
                      { col: 'title', req: true, ex: 'Steel Pan', note: 'Product name' },
                      { col: 'description', req: false, ex: 'Heavy duty pan', note: 'Short description' },
                      { col: 'price', req: false, ex: '999', note: 'Base price in ₹' },
                      { col: 'offerPercent', req: false, ex: '10', note: 'Discount % (0–100)' },
                      { col: 'category', req: true, ex: 'Cookware', note: 'Product category' },
                      { col: 'stockStatus', req: false, ex: 'inStock', note: 'inStock | limitedStock | outOfStock' },
                      { col: 'sizes', req: false, ex: 'Small:250 Large:450', note: 'Name:Price pairs, space-separated' },
                      { col: 'image1', req: false, ex: 'https://…', note: 'Public image URL' },
                      { col: 'image2', req: false, ex: 'https://…', note: 'Second image (optional)' },
                      { col: 'image3', req: false, ex: 'https://…', note: 'Third image (optional)' },
                    ].map(r => (
                      <tr key={r.col} className="hover:bg-pk-bg-primary/40 transition-colors">
                        <td className="px-4 py-2.5 font-mono font-bold text-pk-accent">{r.col}</td>
                        <td className="px-4 py-2.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${r.req ? 'bg-pk-error/15 text-pk-error' : 'bg-pk-bg-secondary text-pk-text-muted'}`}>
                            {r.req ? 'Required' : 'Optional'}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 font-mono text-pk-text-muted">{r.ex}</td>
                        <td className="px-4 py-2.5 text-pk-text-muted">{r.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="bg-pk-bg-secondary/40 border border-pk-bg-secondary rounded-2xl p-4 space-y-2">
                <p className="text-sm font-bold text-pk-text-main">📸 How to add images via CSV</p>
                <p className="text-xs text-pk-text-muted">Use public image URLs in <code className="bg-pk-bg-secondary px-1 rounded text-pk-accent">image1</code>/<code className="bg-pk-bg-secondary px-1 rounded text-pk-accent">image2</code>/<code className="bg-pk-bg-secondary px-1 rounded text-pk-accent">image3</code>. Sources:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {[['Imgur', 'Upload at imgur.com → right-click → Copy image address'], ['Cloudinary', 'Copy secure_url from your Media Library'], ['Google Drive', 'https://drive.google.com/uc?id=FILE_ID (set sharing to Anyone)'], ['Leave blank', 'Add images later via Edit button on each product']].map(([k, v]) => (
                    <div key={k} className="flex gap-2"><span className="font-bold text-pk-text-main w-24 flex-shrink-0">{k}</span><span className="text-pk-text-muted">{v}</span></div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button onClick={downloadSample} className="flex items-center justify-center gap-2 px-5 py-3 bg-pk-bg-secondary hover:bg-pk-bg-primary border border-pk-bg-secondary rounded-xl text-pk-text-main font-semibold text-sm transition-colors">
                  <FiDownload /> Download Sample CSV
                </button>
                <label className="flex items-center justify-center gap-2 px-5 py-3 bg-pk-accent hover:bg-blue-600 text-white rounded-xl font-semibold text-sm transition-colors cursor-pointer flex-1">
                  <FiUpload /> Upload Your CSV
                  <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleFile} />
                </label>
              </div>

              {parseError && (
                <div className="flex items-center gap-2 p-3 bg-pk-error/10 border border-pk-error/30 rounded-xl text-pk-error text-sm">
                  <FiAlertCircle className="flex-shrink-0" /> {parseError}
                </div>
              )}
            </div>
          )}

          {/* Preview step */}
          {step === 'preview' && !saving && (
            <div className="p-4 sm:p-5 space-y-3">
              {errorCount > 0 && (
                <div className="flex items-start gap-2 p-3 bg-pk-warning/10 border border-pk-warning/30 rounded-xl text-pk-warning text-xs font-medium">
                  <FiAlertCircle className="flex-shrink-0 mt-0.5" />
                  <span>{errorCount} row{errorCount > 1 ? 's' : ''} have errors. Click the ✏️ edit button on those rows to fix them before saving.</span>
                </div>
              )}

              {parsedProducts.map((p, idx) => (
                <EditableRow
                  key={idx}
                  product={p}
                  index={idx}
                  onUpdate={handleUpdate}
                  onRemove={handleRemove}
                  existingCategories={existingCategories}
                />
              ))}

              <button
                type="button"
                onClick={addBlankRow}
                className="w-full py-3 border-2 border-dashed border-pk-bg-secondary hover:border-pk-accent rounded-2xl text-pk-text-muted hover:text-pk-accent transition-colors flex items-center justify-center gap-2 font-semibold text-sm"
              >
                <FiPlus /> Add another row manually
              </button>
            </div>
          )}

          {/* Saving progress */}
          {saving && (
            <div className="flex flex-col items-center justify-center py-16 px-6 gap-6">
              <div className="w-16 h-16 rounded-full border-4 border-pk-accent border-t-transparent animate-spin" />
              <div className="text-center">
                <p className="text-lg font-bold text-pk-text-main">Saving products…</p>
                <p className="text-pk-text-muted text-sm mt-1">{saveProgress.done} of {saveProgress.total} saved</p>
              </div>
              <div className="w-full max-w-xs bg-pk-bg-secondary rounded-full h-2.5 overflow-hidden">
                <div className="h-full bg-pk-accent rounded-full transition-all duration-300" style={{ width: `${saveProgress.total ? (saveProgress.done / saveProgress.total) * 100 : 0}%` }} />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {!saving && (
          <div className="border-t border-pk-bg-secondary p-4 sm:p-5 flex items-center gap-3 flex-shrink-0 bg-pk-surface rounded-b-3xl">
            {step === 'preview' ? (
              <>
                <button onClick={() => { setStep('guide'); setParsedProducts([]); }}
                  className="flex items-center gap-1.5 text-sm text-pk-text-muted hover:text-pk-text-main transition-colors font-medium">
                  ← Back
                </button>
                <label className="flex items-center gap-1.5 cursor-pointer px-4 py-2.5 bg-pk-bg-secondary hover:bg-pk-bg-primary border border-pk-bg-secondary rounded-xl text-pk-text-main font-semibold text-sm transition-colors ml-2">
                  <FiUpload size={14} /> Re-upload CSV
                  <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleFile} />
                </label>
                <div className="flex items-center gap-3 ml-auto">
                  <span className="text-xs text-pk-text-muted hidden sm:block">
                    {validCount} of {parsedProducts.length} products valid
                  </span>
                  <button onClick={onClose} className="px-4 py-2.5 font-medium text-pk-text-muted hover:text-pk-text-main transition-colors text-sm">
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveAll}
                    disabled={validCount === 0}
                    className="px-6 py-2.5 bg-pk-success text-pk-bg-primary font-bold rounded-xl hover:shadow-[0_0_15px_rgba(0,200,150,0.4)] transition-all disabled:opacity-40 text-sm flex items-center gap-2"
                  >
                    <FiCheckCircle size={16} />
                    Save {validCount} Product{validCount !== 1 ? 's' : ''}
                  </button>
                </div>
              </>
            ) : (
              <button onClick={onClose} className="ml-auto px-5 py-2.5 font-medium text-pk-text-muted hover:text-pk-text-main transition-colors text-sm">
                Cancel
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

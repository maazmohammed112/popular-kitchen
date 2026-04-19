import { useState, useRef } from 'react';
import { FiUpload, FiX, FiDownload, FiCheckCircle, FiAlertCircle, FiFileText, FiTrash2, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { addProduct } from '../../firebase/products';
import { calculateDiscountPrice } from '../../utils/discountCalc';
import { useToast } from '../../contexts/ToastContext';

/* ── CSV Column Reference ──────────────────────────────────────────── */
export const CSV_COLUMNS = [
  { col: 'title', required: true,  ex: 'Stainless Steel Pan',          desc: 'Product name' },
  { col: 'description', required: false, ex: 'Heavy duty 5-litre pan', desc: 'Product description' },
  { col: 'price', required: false, ex: '999',                           desc: 'Base price in ₹ (integer)' },
  { col: 'offerPercent', required: false, ex: '10',                     desc: 'Discount % (0–100)' },
  { col: 'category', required: true,  ex: 'Cookware',                   desc: 'Category name (must match or be new)' },
  { col: 'stockStatus', required: false, ex: 'inStock',                 desc: 'inStock | limitedStock | outOfStock' },
  { col: 'sizes', required: false, ex: 'Small:250,Large:450',           desc: 'Name:Price pairs separated by commas' },
  { col: 'image1', required: false, ex: 'https://i.imgur.com/abc.jpg',  desc: 'Direct public image URL' },
  { col: 'image2', required: false, ex: 'https://…',                    desc: 'Second image URL (optional)' },
  { col: 'image3', required: false, ex: 'https://…',                    desc: 'Third image URL (optional)' },
];

/* ── Sample CSV content ────────────────────────────────────────────── */
const SAMPLE_CSV = `title,description,price,offerPercent,category,stockStatus,sizes,image1,image2,image3
Stainless Steel Pan,Heavy duty 5-litre cooking pan,999,10,Cookware,inStock,Small:250 Medium:450 Large:750,,
Commercial Wok,Carbon steel flat-bottom wok,1499,0,Cookware,inStock,,,
Shawarma Machine,Vertical gas-powered shawarma grill,8999,5,Grills,limitedStock,Single:8500 Double:15000,,
`;

/* ── Parse sizes string: "Small:250 Medium:450" ────────────────────── */
function parseSizes(raw = '') {
  if (!raw || !raw.trim()) return [];
  // support comma or space as separator between size entries
  return raw.trim().split(/[\s,]+/).filter(Boolean).map(entry => {
    const [name, price] = entry.split(':');
    return { name: (name || '').trim(), price: parseFloat(price) || 0 };
  }).filter(s => s.name);
}

/* ── Parse one CSV row into a product object ───────────────────────── */
function parseRow(row, headers) {
  const obj = {};
  headers.forEach((h, i) => { obj[h.trim().toLowerCase()] = (row[i] || '').trim(); });

  const price = parseFloat(obj.price) || 0;
  const offerPercent = parseFloat(obj.offerpercent || obj.offerpct || obj.offer_percent) || 0;
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
  };
}

/* ── Parse full CSV text → array of product row objects ─────────────── */
function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return { headers: [], rows: [], error: 'CSV must have a header row and at least one data row.' };

  const headers = lines[0].split(',');
  const rows = lines.slice(1).map(line => {
    // handle quoted fields with commas inside
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

  return { headers, products, error: null };
}

/* ──────────────────────────────────────────────────────────────────── */
export default function CSVUploadModal({ onClose, onSuccess }) {
  const { showSuccess, showError } = useToast();
  const fileRef = useRef();

  const [step, setStep] = useState('guide'); // 'guide' | 'preview' | 'saving'
  const [parsedProducts, setParsedProducts] = useState([]);
  const [parseError, setParseError] = useState('');
  const [saveProgress, setSaveProgress] = useState({ done: 0, total: 0 });
  const [expandedRow, setExpandedRow] = useState(null);

  /* ── Download sample CSV ─── */
  const downloadSample = () => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'popular_kitchen_products_sample.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ── Handle file select ─── */
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

  const removeRow = (idx) => setParsedProducts(prev => prev.filter((_, i) => i !== idx));

  /* ── Save all ─── */
  const handleSaveAll = async () => {
    const valid = parsedProducts.filter(p => p._errors.length === 0);
    if (!valid.length) { showError('No valid products to save'); return; }
    setStep('saving');
    setSaveProgress({ done: 0, total: valid.length });

    let done = 0;
    for (const p of valid) {
      try {
        await addProduct({
          title: p.title,
          description: p.description,
          price: p.price,
          offerPercent: p.offerPercent,
          discountPrice: p.discountPrice,
          category: p.category,
          stockStatus: p.stockStatus,
          sizes: p.sizes,
          images: p.images,
        });
        done++;
        setSaveProgress({ done, total: valid.length });
      } catch (err) {
        console.error('Failed to save:', p.title, err);
      }
    }
    showSuccess(`${done} product${done !== 1 ? 's' : ''} imported successfully!`);
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
              <FiFileText className="text-pk-accent" /> CSV Import
            </h2>
            <p className="text-xs text-pk-text-muted mt-0.5">
              {step === 'guide' && 'Download the template, fill it in, then upload'}
              {step === 'preview' && `${parsedProducts.length} rows detected — ${validCount} valid, ${errorCount} with errors`}
              {step === 'saving' && `Saving… ${saveProgress.done} / ${saveProgress.total}`}
            </p>
          </div>
          {step !== 'saving' && (
            <button onClick={onClose} className="p-2 bg-pk-bg-secondary rounded-full hover:bg-pk-bg-primary text-pk-text-muted hover:text-pk-text-main flex-shrink-0">
              <FiX size={20} />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">

          {/* ── STEP: Guide ── */}
          {step === 'guide' && (
            <div className="p-5 md:p-6 space-y-6">
              {/* column reference table */}
              <div>
                <h3 className="text-sm font-bold text-pk-text-main mb-3 uppercase tracking-wider">Required CSV Columns</h3>
                <div className="overflow-x-auto rounded-xl border border-pk-bg-secondary">
                  <table className="w-full text-left text-xs min-w-[580px]">
                    <thead className="bg-pk-bg-secondary/60">
                      <tr>
                        <th className="px-4 py-2.5 font-bold text-pk-text-muted uppercase tracking-wide">Column Name</th>
                        <th className="px-4 py-2.5 font-bold text-pk-text-muted uppercase tracking-wide">Required</th>
                        <th className="px-4 py-2.5 font-bold text-pk-text-muted uppercase tracking-wide">Example Value</th>
                        <th className="px-4 py-2.5 font-bold text-pk-text-muted uppercase tracking-wide">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-pk-bg-secondary">
                      {CSV_COLUMNS.map(c => (
                        <tr key={c.col} className="hover:bg-pk-bg-primary/40 transition-colors">
                          <td className="px-4 py-2.5 font-mono font-bold text-pk-accent">{c.col}</td>
                          <td className="px-4 py-2.5">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${c.required ? 'bg-pk-error/15 text-pk-error' : 'bg-pk-bg-secondary text-pk-text-muted'}`}>
                              {c.required ? 'Required' : 'Optional'}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 font-mono text-pk-text-muted">{c.ex}</td>
                          <td className="px-4 py-2.5 text-pk-text-muted">{c.desc}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* image instructions */}
              <div className="bg-pk-bg-secondary/40 border border-pk-bg-secondary rounded-2xl p-4 space-y-2">
                <h3 className="text-sm font-bold text-pk-text-main flex items-center gap-2">📸 How to add images via CSV</h3>
                <p className="text-xs text-pk-text-muted leading-relaxed">
                  Images in CSV must be <strong className="text-pk-text-main">publicly accessible URLs</strong>. Paste them into the <code className="bg-pk-bg-secondary px-1 rounded text-pk-accent">image1</code>, <code className="bg-pk-bg-secondary px-1 rounded text-pk-accent">image2</code>, <code className="bg-pk-bg-secondary px-1 rounded text-pk-accent">image3</code> columns.
                </p>
                <div className="space-y-1.5 mt-2">
                  {[
                    { label: 'Google Drive', tip: 'Change sharing to "Anyone with link", then use https://drive.google.com/uc?id=FILE_ID' },
                    { label: 'Imgur', tip: 'Upload at imgur.com → right-click image → "Copy image address"' },
                    { label: 'Cloudinary', tip: 'Already using it — paste any secure_url from your Cloudinary Media Library' },
                    { label: 'WhatsApp', tip: 'Send photo to yourself → open on web.whatsapp.com → right-click → copy image link' },
                  ].map(({ label, tip }) => (
                    <div key={label} className="flex gap-2 text-xs">
                      <span className="font-bold text-pk-text-main flex-shrink-0 w-24">{label}</span>
                      <span className="text-pk-text-muted">{tip}</span>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-pk-text-muted mt-2 border-t border-pk-bg-secondary pt-2">
                  💡 Leave image columns blank — you can always add images later by clicking ✏️ Edit on each product.
                </p>
              </div>

              {/* sizes format */}
              <div className="bg-pk-bg-secondary/40 border border-pk-bg-secondary rounded-2xl p-4">
                <h3 className="text-sm font-bold text-pk-text-main mb-2">📐 Sizes column format</h3>
                <p className="text-xs text-pk-text-muted mb-2">Use <code className="bg-pk-bg-secondary px-1 rounded text-pk-accent">Name:Price</code> pairs separated by spaces or commas:</p>
                <code className="block bg-pk-bg-primary rounded-lg px-3 py-2 text-xs text-pk-accent font-mono">Small:250 Medium:450 Large:750</code>
                <p className="text-xs text-pk-text-muted mt-1">or: <code className="bg-pk-bg-secondary px-1 rounded text-pk-accent">Small:250,Medium:450,Large:750</code></p>
              </div>

              {/* actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={downloadSample}
                  className="flex items-center justify-center gap-2 px-5 py-3 bg-pk-bg-secondary hover:bg-pk-bg-primary border border-pk-bg-secondary rounded-xl text-pk-text-main font-semibold text-sm transition-colors"
                >
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

          {/* ── STEP: Preview ── */}
          {step === 'preview' && (
            <div className="p-4 sm:p-5 space-y-3">
              {errorCount > 0 && (
                <div className="flex items-center gap-2 p-3 bg-pk-warning/10 border border-pk-warning/30 rounded-xl text-pk-warning text-xs font-medium">
                  <FiAlertCircle className="flex-shrink-0" /> {errorCount} row{errorCount > 1 ? 's' : ''} have errors and will be skipped unless you fix the CSV and re-upload. Valid rows will still be saved.
                </div>
              )}

              {parsedProducts.map((p, idx) => (
                <div key={idx} className={`rounded-2xl border overflow-hidden ${p._errors.length ? 'border-pk-error/40 bg-pk-error/5' : 'border-pk-bg-secondary bg-pk-bg-primary'}`}>
                  {/* Row header */}
                  <div className="flex items-center gap-2 px-4 py-3">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${p._errors.length ? 'bg-pk-error/20 text-pk-error' : 'bg-pk-success/20 text-pk-success'}`}>
                      {p._errors.length ? <FiAlertCircle size={12} /> : <FiCheckCircle size={12} />}
                    </span>
                    <button type="button" onClick={() => setExpandedRow(expandedRow === idx ? null : idx)} className="flex-1 text-left flex items-center gap-2">
                      <span className="font-semibold text-pk-text-main text-sm truncate">{p.title || <em className="text-pk-error">No title</em>}</span>
                      <span className="text-xs text-pk-text-muted hidden sm:inline">{p.category}</span>
                      <span className="text-xs font-bold text-pk-accent ml-auto">₹{p.discountPrice || p.price || '—'}</span>
                      {expandedRow === idx ? <FiChevronUp size={14} className="text-pk-text-muted flex-shrink-0" /> : <FiChevronDown size={14} className="text-pk-text-muted flex-shrink-0" />}
                    </button>
                    <button onClick={() => removeRow(idx)} className="p-1 text-pk-text-muted hover:text-pk-error ml-1 flex-shrink-0">
                      <FiTrash2 size={14} />
                    </button>
                  </div>

                  {/* Expanded detail */}
                  {expandedRow === idx && (
                    <div className="px-4 pb-4 text-xs space-y-2 border-t border-pk-bg-secondary/50 pt-3">
                      {p._errors.length > 0 && (
                        <div className="text-pk-error font-medium">⚠ {p._errors.join(' · ')}</div>
                      )}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        <div><span className="text-pk-text-muted">Price</span><br /><span className="font-semibold text-pk-text-main">₹{p.price}</span></div>
                        <div><span className="text-pk-text-muted">Offer</span><br /><span className="font-semibold text-pk-text-main">{p.offerPercent}%</span></div>
                        <div><span className="text-pk-text-muted">Stock</span><br /><span className="font-semibold text-pk-text-main capitalize">{p.stockStatus}</span></div>
                        <div className="col-span-2 sm:col-span-3"><span className="text-pk-text-muted">Description</span><br /><span className="font-semibold text-pk-text-main">{p.description || '—'}</span></div>
                        {p.sizes.length > 0 && (
                          <div className="col-span-2 sm:col-span-3">
                            <span className="text-pk-text-muted">Sizes</span><br />
                            <span className="font-semibold text-pk-text-main">{p.sizes.map(s => `${s.name}: ₹${s.price}`).join(' · ')}</span>
                          </div>
                        )}
                        {p.images.length > 0 && (
                          <div className="col-span-2 sm:col-span-3">
                            <span className="text-pk-text-muted">Images ({p.images.length})</span>
                            <div className="flex gap-2 mt-1 flex-wrap">
                              {p.images.map((url, i) => (
                                <img key={i} src={url} alt="" className="w-14 h-14 rounded-lg object-cover border border-pk-bg-secondary" onError={e => e.target.style.display='none'} />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {parsedProducts.length === 0 && (
                <div className="text-center py-10 text-pk-text-muted text-sm">All rows removed. Go back and re-upload.</div>
              )}
            </div>
          )}

          {/* ── STEP: Saving ── */}
          {step === 'saving' && (
            <div className="flex flex-col items-center justify-center py-16 px-6 gap-6">
              <div className="w-16 h-16 rounded-full border-4 border-pk-accent border-t-transparent animate-spin" />
              <div className="text-center">
                <p className="text-lg font-bold text-pk-text-main">Saving products…</p>
                <p className="text-pk-text-muted text-sm mt-1">{saveProgress.done} of {saveProgress.total} done</p>
              </div>
              <div className="w-full max-w-xs bg-pk-bg-secondary rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-pk-accent rounded-full transition-all duration-300"
                  style={{ width: `${saveProgress.total ? (saveProgress.done / saveProgress.total) * 100 : 0}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {step !== 'saving' && (
          <div className="border-t border-pk-bg-secondary p-4 sm:p-5 flex items-center justify-between gap-3 flex-shrink-0 bg-pk-surface rounded-b-3xl">
            {step === 'preview' ? (
              <>
                <button
                  onClick={() => { setStep('guide'); setParsedProducts([]); }}
                  className="flex items-center gap-1.5 text-sm text-pk-text-muted hover:text-pk-text-main transition-colors font-medium"
                >
                  ← Back
                </button>
                <div className="flex gap-3">
                  <button onClick={onClose} className="px-5 py-2.5 font-medium text-pk-text-muted hover:text-pk-text-main transition-colors text-sm">
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveAll}
                    disabled={validCount === 0}
                    className="px-6 py-2.5 bg-pk-success text-pk-bg-primary font-bold rounded-xl hover:shadow-[0_0_15px_rgba(0,200,150,0.4)] transition-all disabled:opacity-40 text-sm"
                  >
                    Import {validCount} Product{validCount !== 1 ? 's' : ''}
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

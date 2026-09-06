import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from './api';
import { ProductForm } from './ProductForm';
import type { Product, ProductRequest } from './types';
import { ApiError } from './types';
import './App.css';

const money = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
});

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [category, setCategory] = useState('');
  const [includeInactive, setIncludeInactive] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setProducts(await api.list(category || undefined, includeInactive));
    } catch (e) {
      setError(describe(e));
    } finally {
      setLoading(false);
    }
  }, [category, includeInactive]);

  /*
   * Deliberate. The lint rule warns about setState inside an effect, but
   * fetching from a server is exactly the case effects exist for -
   * synchronising with an external system. `load` is memoised on the
   * filters, so this refetches when they change and not otherwise.
   */
  useEffect(() => {
    void load();
  }, [load]);

  /*
   * Categories come from whatever is currently loaded rather than a
   * dedicated endpoint - the API has none, and inventing one for a
   * dropdown would be premature.
   */
  const categories = useMemo(
    () => [...new Set(products.map((p) => p.category))].sort(),
    [products],
  );

  function describe(e: unknown): string {
    if (e instanceof ApiError) {
      setFieldErrors(e.fieldErrors);
      return `${e.problem.title ?? 'Error'} — ${e.message}`;
    }
    return e instanceof Error ? e.message : 'Something went wrong';
  }

  async function save(body: ProductRequest) {
    setSaving(true);
    setError(null);
    setNotice(null);
    setFieldErrors({});
    try {
      if (editing) {
        await api.update(editing.id, body);
        setNotice(`Updated ${body.sku}`);
        setEditing(null);
      } else {
        await api.create(body);
        setNotice(`Created ${body.sku}`);
      }
      await load();
    } catch (e) {
      setError(describe(e));
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(product: Product) {
    setError(null);
    setNotice(null);
    try {
      const updated = product.active
        ? await api.deactivate(product.id)
        : await api.activate(product.id);
      setNotice(`${updated.active ? 'Reactivated' : 'Deactivated'} ${updated.sku}`);
      await load();
    } catch (e) {
      setError(describe(e));
    }
  }

  return (
    <div className="app">
      <header className="masthead">
        <div>
          <p className="eyebrow">Catalog service</p>
          <h1>Product administration</h1>
        </div>
        <div className="counts">
          <span>
            <strong>{products.length}</strong> shown
          </span>
          <span>
            <strong>{products.filter((p) => p.active).length}</strong> active
          </span>
        </div>
      </header>

      {error && (
        <div className="banner error" role="alert">
          {error}
          <button className="link" onClick={() => setError(null)}>
            Dismiss
          </button>
        </div>
      )}
      {notice && (
        <div className="banner ok" role="status">
          {notice}
          <button className="link" onClick={() => setNotice(null)}>
            Dismiss
          </button>
        </div>
      )}

      <div className="layout">
        <section className="panel">
          <div className="panel-head">
            <h2>Products</h2>
            <div className="filters">
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="">All categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={includeInactive}
                  onChange={(e) => setIncludeInactive(e.target.checked)}
                />
                Include inactive
              </label>
              <button className="link" onClick={() => void load()}>
                Refresh
              </button>
            </div>
          </div>

          {loading ? (
            <p className="empty">Loading…</p>
          ) : products.length === 0 ? (
            <p className="empty">
              No products. Create one on the right, or run <code>scripts/seed.sh</code>.
            </p>
          ) : (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>SKU</th>
                    <th>Name</th>
                    <th>Category</th>
                    <th className="num">Price</th>
                    <th className="num">Stock</th>
                    <th>Status</th>
                    <th aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.id} className={p.active ? '' : 'inactive'}>
                      <td className="mono">{p.sku}</td>
                      <td>{p.name}</td>
                      <td>{p.category}</td>
                      <td className="num">{money.format(p.price)}</td>
                      <td className="num">{p.stockQuantity}</td>
                      <td>
                        <span className={`pill ${p.active ? 'pill-on' : 'pill-off'}`}>
                          {p.active ? 'active' : 'inactive'}
                        </span>
                      </td>
                      <td className="actions">
                        <button className="link" onClick={() => setEditing(p)}>
                          Edit
                        </button>
                        <button className="link" onClick={() => void toggleActive(p)}>
                          {p.active ? 'Deactivate' : 'Reactivate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <ProductForm
          // Changing the key remounts the form, which resets its fields
          // to the product being edited without an effect doing it.
          key={editing?.id ?? 'new'}
          editing={editing}
          fieldErrors={fieldErrors}
          saving={saving}
          onSubmit={(body) => void save(body)}
          onCancel={() => {
            setEditing(null);
            setFieldErrors({});
          }}
        />
      </div>

      <footer>
        Deactivating is a soft delete — the row stays in the database with
        <code> active = false</code> and disappears from customer-facing queries.
      </footer>
    </div>
  );
}

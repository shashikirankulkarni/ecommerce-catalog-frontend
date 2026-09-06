import { useEffect, useState } from 'react';
import type { Product, ProductRequest } from './types';

const EMPTY: ProductRequest = {
  sku: '',
  name: '',
  description: '',
  price: 0,
  category: '',
  stockQuantity: 0,
};

interface Props {
  editing: Product | null;
  fieldErrors: Record<string, string>;
  saving: boolean;
  onSubmit: (body: ProductRequest) => void;
  onCancel: () => void;
}

export function ProductForm({ editing, fieldErrors, saving, onSubmit, onCancel }: Props) {
  const [form, setForm] = useState<ProductRequest>(EMPTY);

  useEffect(() => {
    setForm(
      editing
        ? {
            sku: editing.sku,
            name: editing.name,
            description: editing.description ?? '',
            price: editing.price,
            category: editing.category,
            stockQuantity: editing.stockQuantity,
          }
        : EMPTY,
    );
  }, [editing]);

  function set<K extends keyof ProductRequest>(key: K, value: ProductRequest[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  return (
    <form
      className="panel form"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(form);
      }}
    >
      <div className="panel-head">
        <h2>{editing ? `Edit ${editing.sku}` : 'New product'}</h2>
        {editing && (
          <button type="button" className="link" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>

      <label>
        <span>SKU</span>
        <input
          value={form.sku}
          onChange={(e) => set('sku', e.target.value)}
          placeholder="LAPTOP-001"
          maxLength={64}
        />
        {fieldErrors.sku && <em className="field-error">{fieldErrors.sku}</em>}
      </label>

      <label>
        <span>Name</span>
        <input
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          placeholder="ThinkPad X1 Carbon"
          maxLength={255}
        />
        {fieldErrors.name && <em className="field-error">{fieldErrors.name}</em>}
      </label>

      <label>
        <span>Category</span>
        <input
          value={form.category}
          onChange={(e) => set('category', e.target.value)}
          placeholder="electronics"
          maxLength={100}
        />
        {fieldErrors.category && <em className="field-error">{fieldErrors.category}</em>}
      </label>

      <div className="row">
        <label>
          <span>Price</span>
          <input
            type="number"
            step="0.01"
            min="0"
            value={form.price}
            onChange={(e) => set('price', Number(e.target.value))}
          />
          {fieldErrors.price && <em className="field-error">{fieldErrors.price}</em>}
        </label>

        <label>
          <span>Stock</span>
          <input
            type="number"
            min="0"
            value={form.stockQuantity}
            onChange={(e) => set('stockQuantity', Number(e.target.value))}
          />
          {fieldErrors.stockQuantity && <em className="field-error">{fieldErrors.stockQuantity}</em>}
        </label>
      </div>

      <label>
        <span>Description</span>
        <textarea
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          rows={3}
          placeholder="Optional"
        />
      </label>

      <button type="submit" className="primary" disabled={saving}>
        {saving ? 'Saving…' : editing ? 'Save changes' : 'Create product'}
      </button>
    </form>
  );
}

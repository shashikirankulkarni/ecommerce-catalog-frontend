import type { Product, ProductRequest } from './types';
import { ApiError } from './types';

/*
 * Relative URLs on purpose. In development Vite proxies /api to the dev
 * server; in production the same origin serves both the page and the API,
 * so there is no base URL to configure and no CORS to deal with.
 */
const BASE = '/api/v1/products';

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: init?.body ? { 'Content-Type': 'application/json' } : undefined,
  });

  if (!response.ok) {
    let problem;
    try {
      problem = await response.json();
    } catch {
      problem = { status: response.status, title: response.statusText };
    }
    throw new ApiError(response.status, problem);
  }

  return response.status === 204 ? (undefined as T) : response.json();
}

export const api = {
  list(category?: string, includeInactive = false): Promise<Product[]> {
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (includeInactive) params.set('includeInactive', 'true');
    const query = params.toString();
    return request<Product[]>(query ? `${BASE}?${query}` : BASE);
  },

  getBySku(sku: string): Promise<Product> {
    return request<Product>(`${BASE}/sku/${encodeURIComponent(sku)}`);
  },

  create(body: ProductRequest): Promise<Product> {
    return request<Product>(BASE, { method: 'POST', body: JSON.stringify(body) });
  },

  update(id: number, body: ProductRequest): Promise<Product> {
    return request<Product>(`${BASE}/${id}`, { method: 'PUT', body: JSON.stringify(body) });
  },

  deactivate(id: number): Promise<Product> {
    return request<Product>(`${BASE}/${id}`, { method: 'DELETE' });
  },

  activate(id: number): Promise<Product> {
    return request<Product>(`${BASE}/${id}/activate`, { method: 'PUT' });
  },
};

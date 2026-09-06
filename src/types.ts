export interface Product {
  id: number;
  sku: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  stockQuantity: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductRequest {
  sku: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stockQuantity: number;
}

/* RFC 7807 problem detail, which is what the API returns on failure. */
export interface ProblemDetail {
  type?: string;
  title?: string;
  status: number;
  detail?: string;
  errors?: Record<string, string>;
}

export class ApiError extends Error {
  /*
   * Explicit fields rather than constructor parameter properties:
   * TypeScript 6 enables erasableSyntaxOnly, which forbids any syntax
   * that emits runtime code, and parameter properties do.
   */
  readonly status: number;
  readonly problem: ProblemDetail;

  constructor(status: number, problem: ProblemDetail) {
    super(problem.detail ?? problem.title ?? `Request failed (${status})`);
    this.status = status;
    this.problem = problem;
  }

  /* Field-level messages from bean validation, if the API sent them. */
  get fieldErrors(): Record<string, string> {
    return this.problem.errors ?? {};
  }
}

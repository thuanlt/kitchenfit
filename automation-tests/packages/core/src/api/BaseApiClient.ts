export interface ApiResponse<T = any> {
  status: number;
  body: T;
  ok: boolean;
}

export class BaseApiClient {
  protected baseUrl: string;
  protected apiKey: string;
  protected from: string;

  constructor(baseUrl: string, apiKey: string, from = '') {
    this.baseUrl  = baseUrl;
    this.apiKey   = apiKey;
    this.from     = from;
  }

  protected headers(): Record<string, string> {
    return {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
    };
  }

  protected url(path: string, model?: string): string {
    const base = `${this.baseUrl}${path}`;
    const params = new URLSearchParams();
    if (this.from)  params.set('from', this.from);
    if (model)      params.set('model', model);
    const qs = params.toString();
    return qs ? `${base}?${qs}` : base;
  }
}

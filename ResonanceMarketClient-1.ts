// ═══════════════════════════════════════════════════════════════════════════
// ResonanceMarketClient.ts — motor-side client for the non-motor Python market
//
// LivingOrganism.ts (JS/motor) used to `import { ResonanceMarket } from
// './ResonanceMarket'` — but the market logic now correctly lives in Python
// (non-motor), in resonance_market.py. A motor agent can't directly import a
// non-motor module; it has to reach it through the bus, same as any other
// motor <-> non-motor exchange in this system.
//
// This class keeps the exact same method names LivingOrganism.ts already
// calls (listEnergy, requestEnergy, findMatches, executeTransaction,
// addCredits, getBalance, getMarketStats, getListingsForCenter) so the only
// change needed upstream is: construct with a base URL, and await the calls.
// ═══════════════════════════════════════════════════════════════════════════

import { CenterName, Dimension, GateNumber } from './HDGraphEngine';

export interface EnergyListing {
  id: string;
  sellerId: string;
  sellerName: string;
  center: string;
  dimension: string;
  energyType: string;
  description: string;
  price: number;
  availability: 'immediate' | 'scheduled' | 'queued';
  resonanceDepth: number;
  kleinToolTuned: boolean;
  rating: number;
  transactionCount: number;
  createdAt: string;
}

export interface EnergyRequest {
  id: string;
  buyerId: string;
  buyerName: string;
  center: string;
  dimension: string;
  energyType: string;
  description: string;
  maxPrice: number;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  preferredSellers: string[];
  createdAt: string;
}

export interface Transaction {
  id: string;
  type: string;
  listingId: string;
  requestId: string;
  sellerId: string;
  buyerId: string;
  brokerId: string;
  amount: number;
  brokerFee: number;
  platformFee: number;
  sellerReceives: number;
  resonanceScore: number;
  status: 'pending' | 'active' | 'completed' | 'disputed';
  startedAt: string;
  completedAt: string | null;
}

// snake_case <-> camelCase at the boundary, since the Python side speaks
// snake_case and everything upstream in this TS codebase speaks camelCase.
function toCamel(obj: any): any {
  if (Array.isArray(obj)) return obj.map(toCamel);
  if (obj === null || typeof obj !== 'object') return obj;
  const out: any = {};
  for (const [k, v] of Object.entries(obj)) {
    const camelKey = k.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    out[camelKey] = toCamel(v);
  }
  return out;
}

export class ResonanceMarketClient {
  constructor(private baseUrl: string = 'http://localhost:10000') {}

  private async post(path: string, body: unknown): Promise<any> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Market request failed: ${res.status} ${await res.text()}`);
    return toCamel(await res.json());
  }

  private async get(path: string): Promise<any> {
    const res = await fetch(`${this.baseUrl}${path}`);
    if (!res.ok) throw new Error(`Market request failed: ${res.status} ${await res.text()}`);
    return toCamel(await res.json());
  }

  async listEnergy(graph: {
    centers: Record<CenterName, { defined: boolean; activeGates: GateNumber[] }>;
  }, params: {
    center: CenterName; dimension: Dimension; energyType: string;
    description: string; price: number;
  }): Promise<EnergyListing> {
    const centers: Record<string, string> = {};
    const activeGates: number[] = [];
    const gateToCenter: Record<number, string> = {};
    let definedChannelCount = 0;

    for (const [name, c] of Object.entries(graph.centers)) {
      centers[name] = c.defined ? 'Defined' : 'Undefined';
      if (c.defined) definedChannelCount++;
      for (const g of c.activeGates) {
        activeGates.push(g);
        gateToCenter[g] = name;
      }
    }

    return this.post('/market/list-energy', {
      seller_id: 'self', seller_name: 'self', centers,
      active_gates: activeGates, gate_to_center: gateToCenter,
      defined_channel_count: definedChannelCount,
      center: params.center, dimension: params.dimension,
      energy_type: params.energyType, description: params.description,
      price: params.price, availability: 'immediate',
    });
  }

  async requestEnergy(graph: {
    centers: Record<CenterName, { defined: boolean }>;
  }, params: {
    center: CenterName; dimension: Dimension; energyType: string;
    description: string; maxPrice: number;
    urgency: 'low' | 'medium' | 'high' | 'critical';
  }): Promise<EnergyRequest> {
    const centers: Record<string, string> = {};
    for (const [name, c] of Object.entries(graph.centers)) {
      centers[name] = c.defined ? 'Defined' : 'Undefined';
    }

    return this.post('/market/request-energy', {
      buyer_id: 'self', buyer_name: 'self', centers,
      center: params.center, dimension: params.dimension,
      energy_type: params.energyType, description: params.description,
      max_price: params.maxPrice, urgency: params.urgency,
    });
  }

  async findMatches(requestId: string): Promise<any[]> {
    return this.get(`/market/find-matches/${requestId}`);
  }

  async executeTransaction(listingId: string, requestId: string, brokerId: string): Promise<Transaction> {
    return this.post('/market/execute-transaction', {
      listing_id: listingId, request_id: requestId, broker_id: brokerId,
    });
  }

  async addCredits(userId: string, amount: number): Promise<number> {
    const res = await this.post('/market/add-credits', { user_id: userId, amount });
    return res.balance;
  }

  async getBalance(userId: string): Promise<number> {
    const res = await this.get(`/market/balance/${userId}`);
    return res.balance;
  }

  async getMarketStats(): Promise<any> {
    return this.get('/market/stats');
  }

  async getListingsForCenter(center: CenterName): Promise<EnergyListing[]> {
    return this.get(`/market/listings/${center}`);
  }
}

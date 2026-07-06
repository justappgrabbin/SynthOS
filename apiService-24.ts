import axios from 'axios';

// In dev, Vite proxies /api to the local FastAPI backend (see vite.config.ts).
// In production/Capacitor, set VITE_API_BASE_URL to your deployed backend URL.
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

export interface BirthData {
  date: string;           // "YYYY-MM-DD"
  time: string;            // "HH:MM"
  utc_offset_hours: number;
  latitude: number;
  longitude: number;
  location_label?: string;
}

export interface GatePlacement {
  body: string;
  stream: 'personality' | 'design';
  chart_system: 'tropical' | 'sidereal' | 'draconic';
  longitude: number;
  gate: number;
  line: number;
}

export interface NatalReport {
  charts: Record<string, GatePlacement[]>;
  bodygraph: {
    active_gates: number[];
    defined_channels: { gate_a: number; gate_b: number; name: string }[];
    centers: Record<string, 'Defined' | 'Undefined' | 'Open'>;
    definition: string;
    splits: number;
  };
}

export interface FieldState {
  field_type: string;
  amplitude: number;
  frequency: number;
  phase: number;
  coherence: number;
  entropy: number;
  pattern: string;
}

export interface ProfileResponse {
  user_id: string;
  natal_report: NatalReport;
  field_state: Record<string, FieldState>;
  network_coherence: number;
}

export interface MatchResult {
  user_id: string;
  display_name: string;
  resonance_index: number;
  per_field_synchrony: Record<string, number>;
  coupling_adjustment: number;
}

export interface Pod {
  id: string;
  name: string;
  description: string;
  resonance_theme: string;
  status: string;
  created_at: string;
}

export interface PodMember {
  user_id: string;
  display_name: string;
  joined_at: string;
}

export interface PodMessage {
  id: string;
  pod_id: string;
  user_id: string;
  message: string;
  created_at: string;
}

export interface EnergyListing {
  id: string;
  seller_id: string;
  seller_name: string;
  center: string;
  dimension: string;
  energy_type: string;
  description: string;
  price: number;
  availability: 'immediate' | 'scheduled' | 'queued';
  resonance_depth: number;
  klein_tool_tuned: boolean;
  rating: number;
  transaction_count: number;
  created_at: string;
}

export interface EnergyRequestItem {
  id: string;
  buyer_id: string;
  buyer_name: string;
  center: string;
  dimension: string;
  energy_type: string;
  description: string;
  max_price: number;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  preferred_sellers: string[];
  created_at: string;
}

export interface MarketMatch {
  listing: EnergyListing;
  match_score: number;
  estimated_resonance: number;
  price: number;
}

export interface MarketTransaction {
  id: string;
  type: string;
  listing_id: string;
  request_id: string;
  seller_id: string;
  buyer_id: string;
  broker_id: string;
  amount: number;
  broker_fee: number;
  platform_fee: number;
  seller_receives: number;
  resonance_score: number;
  status: string;
  started_at: string;
}

export interface MarketStats {
  total_listings: number;
  total_requests: number;
  total_transactions: number;
  total_volume: number;
  platform_revenue: number;
  avg_resonance: number;
  center_volumes: Record<string, number>;
  top_brokers: { broker_id: string; earnings: number }[];
}

export interface MissionBrief {
  date: string;
  go: boolean;
  coherence: number;
  strongest_field: string;
  weakest_field: string;
  optimal_vector: string;
  friction_signature: string;
  mission_text: string;
  recalibration: string | null;
}

export interface PodFit {
  pod_id: string;
  user_id: string;
  fit: number | null;
  member_count: number;
  note?: string;
}

class ApiService {
  async calculateChartPreview(birth: BirthData): Promise<NatalReport> {
    const res = await api.post('/chart/calculate', birth);
    return res.data;
  }

  async createProfile(payload: {
    email: string;
    display_name: string;
    birth: BirthData;
    current_state?: string;
    challenge?: string;
    dream?: string;
    skills?: string[];
    needs?: string[];
  }): Promise<ProfileResponse> {
    const res = await api.post('/profile/create', payload);
    return res.data;
  }

  async getProfile(userId: string) {
    const res = await api.get(`/profile/${userId}`);
    return res.data;
  }

  async createDailyLog(userId: string, moodScore: number, note: string, tags: string[]) {
    const res = await api.post('/daily-log/create', {
      user_id: userId, mood_score: moodScore, note, selected_tags: tags,
    });
    return res.data;
  }

  async getDailyLogs(userId: string) {
    const res = await api.get(`/daily-log/${userId}`);
    return res.data;
  }

  async calculateMatches(userId: string, candidateIds?: string[]): Promise<{ matches: MatchResult[] }> {
    const res = await api.post('/match/calculate', { user_id: userId, candidate_ids: candidateIds });
    return res.data;
  }

  async listPods(): Promise<Pod[]> {
    const res = await api.get('/pod/list');
    return res.data;
  }

  async getPod(podId: string): Promise<Pod> {
    const res = await api.get(`/pod/${podId}`);
    return res.data;
  }

  async createPod(name: string, description: string, theme: string): Promise<{ id: string }> {
    const res = await api.post('/pod/create', { name, description, resonance_theme: theme });
    return res.data;
  }

  async joinPod(podId: string, userId: string) {
    const res = await api.post('/pod/join', { pod_id: podId, user_id: userId });
    return res.data;
  }

  async getPodMembers(podId: string) {
    const res = await api.get(`/pod/${podId}/members`);
    return res.data;
  }

  async getPodMessages(podId: string) {
    const res = await api.get(`/pod/${podId}/messages`);
    return res.data;
  }

  async postPodMessage(podId: string, userId: string, message: string) {
    const res = await api.post('/pod/message', { pod_id: podId, user_id: userId, message });
    return res.data;
  }

  async getNetworkGraph() {
    const res = await api.get('/network/graph');
    return res.data;
  }

  // -- Resonance Market ----------------------------------------------------

  async listEnergy(payload: {
    seller_id: string; center: string; dimension?: string; energy_type: string;
    description: string; price: number; availability?: string; klein_tool_tuned?: boolean;
  }): Promise<EnergyListing> {
    const res = await api.post('/market/list', payload);
    return res.data;
  }

  async requestEnergy(payload: {
    buyer_id: string; center: string; dimension?: string; energy_type: string;
    description: string; max_price: number; urgency?: string; preferred_sellers?: string[];
  }): Promise<EnergyRequestItem> {
    const res = await api.post('/market/request', payload);
    return res.data;
  }

  async findMarketMatches(requestId: string): Promise<{ matches: MarketMatch[] }> {
    const res = await api.get(`/market/matches/${requestId}`);
    return res.data;
  }

  async executeMarketTransaction(listingId: string, requestId: string, brokerId = 'platform'): Promise<MarketTransaction> {
    const res = await api.post('/market/transact', { listing_id: listingId, request_id: requestId, broker_id: brokerId });
    return res.data;
  }

  async subscribeToTuning(userId: string, toolName: string, tier: 'basic' | 'deep' | 'mastery') {
    const res = await api.post('/market/subscribe', { user_id: userId, tool_name: toolName, tier });
    return res.data;
  }

  async addCredits(userId: string, amount: number): Promise<{ user_id: string; balance: number }> {
    const res = await api.post('/market/credits/add', { user_id: userId, amount });
    return res.data;
  }

  async getCredits(userId: string): Promise<{ user_id: string; balance: number }> {
    const res = await api.get(`/market/credits/${userId}`);
    return res.data;
  }

  async getMarketStats(): Promise<MarketStats> {
    const res = await api.get('/market/stats');
    return res.data;
  }

  async getListingsForCenter(center: string): Promise<{ listings: EnergyListing[] }> {
    const res = await api.get(`/market/center/${center}`);
    return res.data;
  }

  async getMarketHistory(userId: string): Promise<{ transactions: MarketTransaction[] }> {
    const res = await api.get(`/market/history/${userId}`);
    return res.data;
  }

  // -- Mission Advisor -----------------------------------------------------

  async getTodaysMission(userId: string): Promise<MissionBrief> {
    const res = await api.get(`/mission/today/${userId}`);
    return res.data;
  }

  // -- Pod resonance fit -----------------------------------------------------

  async getPodFit(podId: string, userId: string): Promise<PodFit> {
    const res = await api.get(`/pod/${podId}/fit/${userId}`);
    return res.data;
  }

  // -- AUTOLING text analysis -----------------------------------------------

  async analyzeText(text: string): Promise<{
    intent: string;
    word_count: number;
    suggested_tags: { tag: string; score: number; matched_words: string[] }[];
  }> {
    const res = await api.post('/autoling/analyze', { text });
    return res.data;
  }
}

export const apiService = new ApiService();

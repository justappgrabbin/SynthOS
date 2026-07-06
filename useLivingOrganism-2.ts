// ═══════════════════════════════════════════════════════════════════════════
// useLivingOrganism.ts — React Hook for YOU-N-I-VERSE OS
// Drop this into your React app to consume the Living Organism
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useCallback, useEffect, useRef } from 'react';
import { livingOrganism, LivingOrganism } from './LivingOrganism';
import {
  PersonalGraph, CenterName, GateNumber, Dimension, Planet,
} from './HDGraphEngine';
import { ToolName } from './KleinToolMesh';
import { MCPAgent } from './MCPHubMesh';
import { EnergyListing, EnergyRequest, Transaction } from './ResonanceMarket';

// ── Types for React consumption ──────────────────────────────────────────────
export interface UserSession {
  userId: string;
  graph: PersonalGraph | null;
  initialized: boolean;
  loading: boolean;
  error: string | null;
}

export interface OrganismState {
  tools: Array<{
    name: ToolName;
    active: boolean;
    expressionCount: number;
    lastExpression: string | null;
  }>;
  mcps: MCPAgent[];
  marketStats: {
    totalListings: number;
    totalRequests: number;
    totalTransactions: number;
    totalVolume: number;
    platformRevenue: number;
    avgResonance: number;
  };
}

export interface QueryResult {
  expression: string;
  tool: ToolName;
  confidence: number;
  signals: Array<{
    type: string;
    center: CenterName;
    description: string;
    urgency: number;
  }>;
  pathway: Array<{
    step: number;
    action: string;
    dimension: string;
    confidence: number;
  }>;
  narrative: string;
}

// ── The Hook ─────────────────────────────────────────────────────────────────
export function useLivingOrganism() {
  const organismRef = useRef<LivingOrganism>(livingOrganism);
  const [session, setSession] = useState<UserSession>({
    userId: '',
    graph: null,
    initialized: false,
    loading: false,
    error: null,
  });
  const [organismState, setOrganismState] = useState<OrganismState>({
    tools: [],
    mcps: [],
    marketStats: {
      totalListings: 0,
      totalRequests: 0,
      totalTransactions: 0,
      totalVolume: 0,
      platformRevenue: 0,
      avgResonance: 0,
    },
  });
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [queryLoading, setQueryLoading] = useState(false);

  // Initialize a user
  const initializeUser = useCallback(async (params: {
    userId: string;
    birthDate: string;
    birthTime: string;
    birthLocation: string;
    displayName?: string;
  }) => {
    setSession(prev => ({ ...prev, loading: true, error: null }));
    try {
      const result = await organismRef.current.initializeUser(params);
      setSession({
        userId: params.userId,
        graph: result.graph,
        initialized: true,
        loading: false,
        error: null,
      });
      return result;
    } catch (err: any) {
      setSession(prev => ({ ...prev, loading: false, error: err.message }));
      throw err;
    }
  }, []);

  // Process a query
  const ask = useCallback(async (query: string) => {
    if (!session.initialized) {
      throw new Error('User not initialized');
    }
    setQueryLoading(true);
    try {
      const result = await organismRef.current.processQuery(session.userId, query);
      setQueryResult({
        expression: result.expression.output,
        tool: result.expression.tool,
        confidence: result.expression.confidence,
        signals: result.perception.signals.map(s => ({
          type: s.type,
          center: s.center,
          description: s.description,
          urgency: s.urgency,
        })),
        pathway: result.pathway.pathway.map(p => ({
          step: p.step,
          action: p.action,
          dimension: p.dimension,
          confidence: p.confidence,
        })),
        narrative: result.unifiedNarrative,
      });
      setQueryLoading(false);
      return result;
    } catch (err: any) {
      setQueryLoading(false);
      throw err;
    }
  }, [session.userId, session.initialized]);

  // Calculate resonance with another user
  const checkResonance = useCallback((otherUserId: string) => {
    if (!session.initialized) return null;
    return organismRef.current.calculateResonance(session.userId, otherUserId);
  }, [session.userId, session.initialized]);

  // List energy
  const listEnergy = useCallback((params: {
    center: CenterName;
    dimension: Dimension;
    energyType: string;
    description: string;
    price: number;
  }) => {
    if (!session.initialized) throw new Error('User not initialized');
    return organismRef.current.listEnergy(session.userId, params);
  }, [session.userId, session.initialized]);

  // Request energy
  const requestEnergy = useCallback((params: {
    center: CenterName;
    dimension: Dimension;
    energyType: string;
    description: string;
    maxPrice: number;
    urgency: 'low' | 'medium' | 'high' | 'critical';
  }) => {
    if (!session.initialized) throw new Error('User not initialized');
    return organismRef.current.requestEnergy(session.userId, params);
  }, [session.userId, session.initialized]);

  // Find matches
  const findMatches = useCallback((requestId: string) => {
    return organismRef.current.findMatches(requestId);
  }, []);

  // Execute transaction
  const executeTransaction = useCallback((listingId: string, requestId: string) => {
    return organismRef.current.executeTransaction(listingId, requestId);
  }, []);

  // Add credits
  const addCredits = useCallback((amount: number) => {
    if (!session.initialized) return;
    organismRef.current.addCredits(session.userId, amount);
  }, [session.userId, session.initialized]);

  // Get balance
  const getBalance = useCallback(() => {
    if (!session.initialized) return 0;
    return organismRef.current.getBalance(session.userId);
  }, [session.userId, session.initialized]);

  // Get dashboard data
  const getDashboard = useCallback(() => {
    if (!session.initialized) return null;
    return organismRef.current.getDashboard(session.userId);
  }, [session.userId, session.initialized]);

  // Get transit summary
  const getTransitSummary = useCallback(async () => {
    if (!session.initialized) return null;
    return organismRef.current.getTransitSummary(session.userId);
  }, [session.userId, session.initialized]);

  // Get dimensional profile
  const getDimensionalProfile = useCallback(() => {
    if (!session.initialized) return null;
    return organismRef.current.getDimensionalProfile(session.userId);
  }, [session.userId, session.initialized]);

  // Refresh organism state
  const refreshState = useCallback(async () => {
    const state = await organismRef.current.exportState();
    setOrganismState({
      tools: state.tools,
      mcps: state.mcps,
      marketStats: state.marketStats,
    });
  }, []);

  // Auto-refresh on mount
  useEffect(() => {
    refreshState();
    const interval = setInterval(refreshState, 30000); // every 30s
    return () => clearInterval(interval);
  }, [refreshState]);

  return {
    // Session
    session,
    initializeUser,

    // Query
    ask,
    queryResult,
    queryLoading,

    // Social
    checkResonance,

    // Market
    listEnergy,
    requestEnergy,
    findMatches,
    executeTransaction,
    addCredits,
    getBalance,

    // Dashboard
    getDashboard,
    getTransitSummary,
    getDimensionalProfile,

    // State
    organismState,
    refreshState,
  };
}

// ── Example usage in a React component ───────────────────────────────────────
/*
import { useLivingOrganism } from './useLivingOrganism';

function App() {
  const {
    session,
    initializeUser,
    ask,
    queryResult,
    queryLoading,
    getDashboard,
  } = useLivingOrganism();

  // Initialize on mount
  useEffect(() => {
    initializeUser({
      userId: 'user-123',
      birthDate: '1990-01-01',
      birthTime: '12:00',
      birthLocation: 'New York, USA',
    });
  }, []);

  // Ask a question
  const handleAsk = async (query: string) => {
    await ask(query);
  };

  return (
    <div>
      {session.initialized ? (
        <>
          <div>User: {session.userId}</div>
          <div>Type: {session.graph?.type}</div>
          <button onClick={() => handleAsk('What should I focus on today?')}>
            Ask
          </button>
          {queryLoading && <div>Thinking...</div>}
          {queryResult && (
            <div>
              <div>{queryResult.expression}</div>
              <div>Tool: {queryResult.tool}</div>
              <div>Confidence: {Math.round(queryResult.confidence * 100)}%</div>
            </div>
          )}
        </>
      ) : (
        <div>Initializing...</div>
      )}
    </div>
  );
}
*/

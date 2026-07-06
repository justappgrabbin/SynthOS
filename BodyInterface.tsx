"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useHumanDesign } from '@/hooks/useHumanDesign';
import { useMesh } from '@/hooks/useMesh';

const IMAGES = {
  body: '/images/body-skeleton.png',   // 1000017379
  mind: '/images/body-nervous.png',     // 1000017378
  heart: '/images/body-circulatory.png', // 1000017377
};

type ViewMode = 'body' | 'mind' | 'heart';

interface CenterDef {
  name: string;
  x: number; // 0-1 normalized
  y: number; // 0-1 normalized
  color: string;
  size: number;
  domain: string;
}

const CENTERS: CenterDef[] = [
  { name: 'Head', x: 0.5, y: 0.08, color: '#9b59b6', size: 28, domain: 'head' },
  { name: 'Ajna', x: 0.5, y: 0.18, color: '#3498db', size: 26, domain: 'ajna' },
  { name: 'Throat', x: 0.5, y: 0.28, color: '#2ecc71', size: 30, domain: 'throat' },
  { name: 'G-Center', x: 0.5, y: 0.42, color: '#f1c40f', size: 32, domain: 'g-center' },
  { name: 'Heart', x: 0.36, y: 0.42, color: '#e74c3c', size: 28, domain: 'heart' },
  { name: 'Solar Plexus', x: 0.64, y: 0.42, color: '#e67e22', size: 30, domain: 'solar' },
  { name: 'Sacral', x: 0.5, y: 0.56, color: '#d35400', size: 32, domain: 'sacral' },
  { name: 'Spleen', x: 0.34, y: 0.56, color: '#1abc9c', size: 26, domain: 'spleen' },
  { name: 'Root', x: 0.5, y: 0.72, color: '#c0392b', size: 30, domain: 'root' },
];

const CONNECTIONS: [string, string][] = [
  ['Head', 'Ajna'], ['Ajna', 'Throat'], ['Throat', 'G-Center'],
  ['Throat', 'Heart'], ['Throat', 'Solar Plexus'], ['Heart', 'G-Center'],
  ['Solar Plexus', 'G-Center'], ['G-Center', 'Sacral'],
  ['Heart', 'Sacral'], ['Solar Plexus', 'Sacral'],
  ['Sacral', 'Spleen'], ['Sacral', 'Root'], ['Spleen', 'Root'],
];

export function BodyInterface() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [view, setView] = useState<ViewMode>('body');
  const [imgLoaded, setImgLoaded] = useState(false);
  const { profile } = useHumanDesign();
  const { nodes } = useMesh();

  // Load image when view changes
  useEffect(() => {
    const img = new Image();
    img.src = IMAGES[view];
    img.onload = () => {
      imgRef.current = img;
      setImgLoaded(true);
    };
    img.onerror = () => {
      imgRef.current = null;
      setImgLoaded(true); // Draw without image on error
    };
    setImgLoaded(false);
  }, [view]);

  // Canvas drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imgLoaded) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    // Dark background
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, width, height);

    // Draw body image (centered, contained)
    const img = imgRef.current;
    if (img) {
      const imgAspect = img.width / img.height;
      const canvasAspect = width / height;
      let drawW, drawH, drawX, drawY;

      if (imgAspect > canvasAspect) {
        drawW = width * 0.7;
        drawH = drawW / imgAspect;
        drawX = width * 0.15;
        drawY = (height - drawH) / 2;
      } else {
        drawH = height * 0.9;
        drawW = drawH * imgAspect;
        drawX = (width - drawW) / 2;
        drawY = height * 0.05;
      }

      ctx.globalAlpha = 0.35;
      ctx.drawImage(img, drawX, drawY, drawW, drawH);
      ctx.globalAlpha = 1;
    }

    // Image overlay tint based on view
    const tints = {
      body: 'rgba(212, 175, 55, 0.08)',
      mind: 'rgba(100, 180, 255, 0.08)',
      heart: 'rgba(220, 60, 60, 0.08)',
    };
    ctx.fillStyle = tints[view];
    ctx.fillRect(0, 0, width, height);

    // Build center positions
    const centerMap = new Map<string, { x: number; y: number; def: CenterDef }>();
    const centers = CENTERS.map((c) => {
      const x = width * c.x;
      const y = height * c.y;
      const defined = profile?.centers?.defined?.includes(c.name) ?? false;
      centerMap.set(c.name, { x, y, def: c });
      return { ...c, x, y, defined };
    });

    // Draw connections
    ctx.strokeStyle = 'rgba(100, 100, 150, 0.25)';
    ctx.lineWidth = 2;
    CONNECTIONS.forEach(([a, b]) => {
      const ca = centerMap.get(a);
      const cb = centerMap.get(b);
      if (ca && cb) {
        ctx.beginPath();
        ctx.moveTo(ca.x, ca.y);
        ctx.lineTo(cb.x, cb.y);
        ctx.stroke();
      }
    });

    // Draw centers
    centers.forEach((center) => {
      const radius = center.size;

      // Glow for defined centers
      if (center.defined) {
        const gradient = ctx.createRadialGradient(
          center.x, center.y, 0,
          center.x, center.y, radius * 2.5
        );
        gradient.addColorStop(0, center.color + '50');
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(center.x, center.y, radius * 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Center circle
      ctx.fillStyle = center.defined ? center.color : center.color + '40';
      ctx.beginPath();
      ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
      ctx.fill();

      // Border
      ctx.strokeStyle = center.defined ? '#fff' : center.color + '60';
      ctx.lineWidth = center.defined ? 3 : 1;
      ctx.stroke();

      // Label
      ctx.fillStyle = '#fff';
      ctx.font = '11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(center.name, center.x, center.y + radius + 16);

      // File count badge
      const centerFiles = nodes.filter((n) => {
        const domain = n.properties?.domain_tags?.[0];
        return domain && center.domain.includes(domain);
      });
      if (centerFiles.length > 0) {
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 13px monospace';
        ctx.fillText(centerFiles.length.toString(), center.x, center.y + 5);
      }
    });

    // Orbiting nodes
    nodes.forEach((node, i) => {
      const angle = (i / Math.max(nodes.length, 1)) * Math.PI * 2;
      const orbitRadius = 160 + (i % 3) * 55;
      const x = width * 0.5 + Math.cos(angle) * orbitRadius;
      const y = height * 0.5 + Math.sin(angle) * orbitRadius;
      ctx.fillStyle = '#e94560';
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    });
  }, [view, imgLoaded, profile, nodes]);

  const viewLabels: Record<ViewMode, string> = {
    body: 'The Vessel',
    mind: 'The Mind',
    heart: 'The Heart',
  };

  const viewColors: Record<ViewMode, string> = {
    body: 'from-amber-400 to-yellow-600',
    mind: 'from-cyan-400 to-blue-600',
    heart: 'from-rose-400 to-red-600',
  };

  return (
    <div className="h-screen w-screen bg-aion-void flex flex-col overflow-hidden">
      {/* Header */}
      <div className="h-14 bg-aion-matter border-b border-aion-resonance flex items-center px-6 justify-between shrink-0">
        <div className={`text-transparent bg-clip-text bg-gradient-to-r ${viewColors[view]} font-bold text-xl`}>
          {viewLabels[view]}
        </div>
        <div className="text-aion-light/50 text-sm">
          {profile?.type || 'Unknown'} • {profile?.profile || 'Unknown'} • {nodes.length} files in circulation
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 relative flex">
        {/* Left sidebar — Bodygraph Status */}
        <div className="w-72 bg-aion-matter/80 backdrop-blur border-r border-aion-resonance p-5 flex flex-col gap-6 shrink-0">
          <div>
            <h3 className="text-aion-light font-bold mb-3 text-sm uppercase tracking-wider">Bodygraph Status</h3>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between"><span className="text-aion-light/50">Type</span><span className="text-aion-light">{profile?.type || 'Not calculated'}</span></div>
              <div className="flex justify-between"><span className="text-aion-light/50">Strategy</span><span className="text-aion-light">{profile?.strategy || 'Unknown'}</span></div>
              <div className="flex justify-between"><span className="text-aion-light/50">Authority</span><span className="text-aion-light">{profile?.authority || 'Unknown'}</span></div>
              <div className="flex justify-between"><span className="text-aion-light/50">Defined Centers</span><span className="text-aion-pulse">{profile?.centers?.defined?.length || 0}/9</span></div>
              <div className="flex justify-between"><span className="text-aion-light/50">Active Gates</span><span className="text-aion-pulse">{profile?.gates?.length || 0}</span></div>
            </div>
          </div>

          {/* View Toggle */}
          <div>
            <h3 className="text-aion-light font-bold mb-3 text-sm uppercase tracking-wider">View Mode</h3>
            <div className="flex flex-col gap-2">
              {(['body', 'mind', 'heart'] as ViewMode[]).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 border text-left flex items-center gap-3 ${
                    view === v
                      ? v === 'body'
                        ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                        : v === 'mind'
                        ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                        : 'bg-rose-500/20 border-rose-500/50 text-rose-300'
                      : 'bg-aion-void/50 border-aion-resonance text-aion-light/50 hover:text-aion-light/80 hover:border-aion-light/30'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${
                    v === 'body' ? 'bg-amber-400' : v === 'mind' ? 'bg-cyan-400' : 'bg-rose-400'
                  }`} />
                  {v === 'body' ? 'Skeleton' : v === 'mind' ? 'Nervous System' : 'Circulatory'}
                </button>
              ))}
            </div>
          </div>

          {/* Center legend */}
          <div className="mt-auto">
            <h3 className="text-aion-light font-bold mb-2 text-sm uppercase tracking-wider">Centers</h3>
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              {CENTERS.map((c) => (
                <div key={c.name} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                  <span className="text-aion-light/60 truncate">{c.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Canvas area */}
        <div className="flex-1 relative">
          <canvas
            ref={canvasRef}
            className="w-full h-full block"
            style={{ width: '100%', height: '100%' }}
          />

          {/* Floating info */}
          <div className="absolute bottom-4 right-4 bg-aion-matter/80 backdrop-blur rounded-xl p-4 border border-aion-resonance max-w-xs">
            <div className="text-xs text-aion-light/40 mb-1 uppercase tracking-wider">Current View</div>
            <div className={`text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r ${viewColors[view]}`}>
              {view === 'body' ? 'Skeletal Structure' : view === 'mind' ? 'Neural Network' : 'Cardiovascular System'}
            </div>
            <div className="text-aion-light/50 text-sm mt-1">
              {view === 'body'
                ? 'Structural foundation — bones, joints, and the physical frame.'
                : view === 'mind'
                ? 'Electrical pathways — brain, spinal cord, and neural connections.'
                : 'Blood highways — heart, arteries, veins, and the flow of life.'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

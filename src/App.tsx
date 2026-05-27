import { useCallback, useEffect, useRef, useState } from 'react';
import { GLYPHS, GLYPH_COLS } from './glyphs';
import dfdLogo from './dfd-logo.svg';

// ---------- Config (baked from "Orchid Gold" preset) ----------

const COLS = 22;
const ROWS = 15;
const SPACING = 62;
const BG_COLOR = '#ffffff';
const TEXT = 'dfd';
const LETTER_GAP = 1;
const TEXT_COL = 5;
const TEXT_ROW = 9;
const REACH_X = 1570;
const REACH_Y = 1570;
const POWER = 3.6;

interface Layer {
  delay: number;
  dotColor: string;
  gridDotColor: string;
  gridDotOpacity: number;
  thinDiameter: number;
  blackDiameter: number;
}

const LAYERS: Layer[] = [
  { delay: 0,    thinDiameter: 87, blackDiameter: 124, dotColor: '#ebb4f8', gridDotColor: '#bba84c', gridDotOpacity: 0 },
  { delay: 0.16, thinDiameter: 12, blackDiameter: 162, dotColor: '#bba84c', gridDotColor: '#bba84c', gridDotOpacity: 0 },
  { delay: 0.14, thinDiameter: 23, blackDiameter: 71,  dotColor: '#f990eb', gridDotColor: '#dda4ec', gridDotOpacity: 0 },
];

const DAY_THEMES: Record<number, { bg: string; layers: { dotColor: string; gridDotColor: string }[] }> = {
  1: {
    bg: '#ACF7FC',
    layers: [
      { dotColor: '#77DFE7', gridDotColor: '#77DFE7' },
      { dotColor: '#ACF7FC', gridDotColor: '#ACF7FC' },
      { dotColor: '#F1F8F3', gridDotColor: '#F1F8F3' },
    ],
  },
};

// ---------- Field math ----------

function falloff(d: number): number {
  if (d <= 0) return 1;
  if (d >= 1) return 0;
  const sigma = 0.4;
  return Math.exp(-(d * d) / (2 * sigma * sigma));
}

function fieldStrength(
  dotX: number, dotY: number,
  cursorX: number, cursorY: number,
  reachX: number, reachY: number,
): number {
  const sx = Math.max(1, reachX);
  const sy = Math.max(1, reachY);
  const dx = (dotX - cursorX) / sx;
  const dy = (dotY - cursorY) / sy;
  const d = Math.sqrt(dx * dx + dy * dy);
  return falloff(d);
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// ---------- Component ----------

export default function App() {
  const padding = SPACING / 2;
  const vbW = (COLS - 1) * SPACING + 2 * padding;
  const vbH = (ROWS - 1) * SPACING + 2 * padding;

  // Pre-compute letter cell positions.
  const letterCells = new Set<string>();
  let cursor = TEXT_COL;
  for (const ch of TEXT) {
    const glyph = GLYPHS[ch as keyof typeof GLYPHS];
    if (!glyph) { cursor += GLYPH_COLS + LETTER_GAP; continue; }
    const gRows = glyph.length;
    const gCols = glyph[0].length;
    for (let gr = 0; gr < gRows; gr++) {
      for (let gc = 0; gc < gCols; gc++) {
        if (glyph[gr][gc]) {
          letterCells.add(`${cursor + gc},${TEXT_ROW + gr}`);
        }
      }
    }
    cursor += gCols + LETTER_GAP;
  }

  const [hoveredDay, setHoveredDay] = useState<null | 1 | 2>(null);
  const [time, setTime] = useState(0);
  const startTimeRef = useRef(performance.now());

  const [mouse, setMouse] = useState<{ x: number; y: number } | null>(null);
  const mouseRef = useRef<{ x: number; y: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const trailRefs = useRef<(({ x: number; y: number }) | null)[]>(LAYERS.map(() => null));
  const [trailPositions, setTrailPositions] = useState<(({ x: number; y: number }) | null)[]>(
    LAYERS.map(() => null),
  );

  const screenToSvg = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return null;
    const ctm = svg.getScreenCTM();
    if (!ctm) return null;
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    return pt.matrixTransform(ctm.inverse());
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const pos = screenToSvg(e.clientX, e.clientY);
      if (pos) {
        const p = { x: pos.x, y: pos.y };
        mouseRef.current = p;
        setMouse(p);
      }
    };
    const onLeave = () => {
      mouseRef.current = null;
      setMouse(null);
    };
    window.addEventListener('mousemove', onMove);
    document.addEventListener('mouseleave', onLeave);
    return () => {
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseleave', onLeave);
    };
  }, [screenToSvg]);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const target = mouseRef.current;
      const trails = trailRefs.current;
      let changed = false;
      const next: (({ x: number; y: number }) | null)[] = [];

      for (let i = 0; i < LAYERS.length; i++) {
        const delay = LAYERS[i].delay;
        if (delay === 0 || !target) {
          trails[i] = target;
          next.push(target);
        } else {
          const prev = trails[i] ?? target;
          const p = {
            x: prev.x + (target.x - prev.x) * delay,
            y: prev.y + (target.y - prev.y) * delay,
          };
          trails[i] = p;
          next.push(p);
        }
        changed = true;
      }

      if (changed) setTrailPositions(next);
      setTime((performance.now() - startTimeRef.current) / 1000);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Breathing clusters.
  const breathingSet = useRef<Map<string, { phase: number; period: number }>>(null!);
  if (breathingSet.current === null) {
    const map = new Map<string, { phase: number; period: number }>();
    const clusters = [
      { dots: [[COLS - 3, 0], [COLS - 2, 0], [COLS - 1, 0], [COLS - 2, 1], [COLS - 1, 1]], period: 7,  phase: 0 },
      { dots: [[0, ROWS - 2], [1, ROWS - 2], [0, ROWS - 1]],                               period: 9,  phase: 2.5 },
      { dots: [[COLS - 1, ROWS - 4]],                                                        period: 6,  phase: 5.0 },
      { dots: [[1, 0], [2, 0], [2, 1], [3, 1]],                                             period: 8,  phase: 1.3 },
      { dots: [[Math.floor(COLS / 2) + 3, ROWS - 1], [Math.floor(COLS / 2) + 4, ROWS - 1], [Math.floor(COLS / 2) + 3, ROWS - 2], [Math.floor(COLS / 2) + 4, ROWS - 2], [Math.floor(COLS / 2) + 5, ROWS - 1]], period: 10, phase: 3.8 },
      { dots: [[COLS - 5, 3]],                                                               period: 8,  phase: 6.1 },
      { dots: [[0, Math.floor(ROWS / 2)], [0, Math.floor(ROWS / 2) + 1], [1, Math.floor(ROWS / 2) + 1]], period: 11, phase: 4.4 },
    ];
    for (const cluster of clusters) {
      for (let i = 0; i < cluster.dots.length; i++) {
        const [c, r] = cluster.dots[i];
        map.set(`${c},${r}`, { phase: cluster.phase + i * 0.3, period: cluster.period });
      }
    }
    breathingSet.current = map;
  }
  const BREATH_SCALE = 0.4;

  // Build dot arrays per layer.
  const allLayerDots: React.ReactElement[][] = [];

  for (let li = 0; li < LAYERS.length; li++) {
    const layer = LAYERS[li];
    const theme = hoveredDay ? DAY_THEMES[hoveredDay]?.layers[li] : null;
    const dotColor = theme?.dotColor ?? layer.dotColor;
    const gridDotColor = theme?.gridDotColor ?? layer.gridDotColor;

    const cursorPos = layer.delay === 0 ? mouse : (trailPositions[li] ?? null);
    const thinR = layer.thinDiameter / 2;
    const blackR = layer.blackDiameter / 2;
    const dots: React.ReactElement[] = [];

    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const cx = padding + col * SPACING;
        const cy = padding + row * SPACING;
        const isLetter = letterCells.has(`${col},${row}`);
        const breath = breathingSet.current.get(`${col},${row}`);

        let r: number;
        let color: string;
        let opacity: number;

        if (isLetter) {
          let g = 0;
          if (cursorPos) {
            g = fieldStrength(cx, cy, cursorPos.x, cursorPos.y, REACH_X, REACH_Y);
            g = Math.pow(g, POWER);
          }
          r = lerp(thinR, blackR, g);
          color = dotColor;
          opacity = 1;
        } else if (breath) {
          const raw = Math.sin((time / breath.period) * Math.PI * 2 + breath.phase);
          const wave = Math.max(0, raw);
          r = lerp(thinR, thinR + (blackR - thinR) * BREATH_SCALE, wave);
          color = dotColor;
          opacity = wave;
        } else {
          r = thinR;
          color = gridDotColor;
          opacity = layer.gridDotOpacity;
        }

        dots.push(
          <circle key={`${li}-${col},${row}`} cx={cx} cy={cy} r={r}
            fill={color} opacity={opacity}
            style={{ transition: 'fill 0.6s ease' }} />
        );
      }
    }
    allLayerDots.push(dots);
  }

  const effectiveBg = hoveredDay && DAY_THEMES[hoveredDay] ? DAY_THEMES[hoveredDay].bg : BG_COLOR;

  const font = "'Suisse Intl', sans-serif";
  const pad = 'clamp(20px, 2.5vw, 40px)';

  // Staggered load animation.
  const [loaded, setLoaded] = useState(false);
  const [gridVisible, setGridVisible] = useState(false);
  useEffect(() => {
    requestAnimationFrame(() => setLoaded(true));
    const id = setTimeout(() => setGridVisible(true), 1200);
    return () => clearTimeout(id);
  }, []);

  const stagger = (i: number): React.CSSProperties => ({
    opacity: loaded ? 1 : 0,
    transform: loaded ? 'translateY(0)' : 'translateY(8px)',
    transition: `opacity 0.6s ease ${i * 150}ms, transform 0.6s ease ${i * 150}ms`,
  });

  return (
    <div style={{
      height: '100vh', overflow: 'hidden',
      background: effectiveBg,
      transition: 'background 1.2s ease',
      position: 'relative',
    }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${vbW} ${vbH}`}
        preserveAspectRatio="xMidYMax slice"
        style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%',
          opacity: gridVisible ? 1 : 0,
          transition: 'opacity 1s ease',
        }}
      >
        {allLayerDots.map((dots, i) => (
          <g key={i}>{dots}</g>
        ))}
      </svg>

      <div className="landing-grid" style={{
        position: 'absolute', inset: 0,
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        gridTemplateRows: '1fr auto 1fr auto',
        padding: `clamp(8px, 1vw, 16px) ${pad} ${pad} ${pad}`,
        pointerEvents: 'none',
      }}>
        <div style={{ gridColumn: '1', gridRow: '1', alignSelf: 'start' }}>
          <a href="#day1"
            onMouseEnter={() => setHoveredDay(1)}
            onMouseLeave={() => setHoveredDay(null)}
            style={{
              fontFamily: font, fontWeight: 500,
              fontSize: 'clamp(32px, 4vw, 64px)',
              lineHeight: 1.1, letterSpacing: '-0.02em',
              color: '#000', textDecoration: 'none',
              display: 'block', pointerEvents: 'auto',
              ...stagger(0),
            }}>Day 1<span style={{
              marginLeft: '0.3em', opacity: loaded ? 0.5 : 0,
              transition: 'opacity 0.6s ease',
            }}> Programme {hoveredDay === 1 && '→'}</span></a>
          <a href="#day2" style={{
            fontFamily: font, fontWeight: 500,
            fontSize: 'clamp(32px, 4vw, 64px)',
            lineHeight: 1.1, letterSpacing: '-0.02em',
            color: '#000', textDecoration: 'none',
            display: 'block', pointerEvents: 'auto',
            marginTop: 'clamp(8px, 1vw, 20px)',
            ...stagger(1),
          }}>Day 2</a>
        </div>

        <div className="event-info" style={{
          gridColumn: '2', gridRow: '1',
          fontFamily: font, fontWeight: 500,
          color: '#000', alignSelf: 'start',
          marginTop: 20,
        }}>
          <p style={{
            fontSize: 'clamp(14px, 1.5vw, 26px)',
            lineHeight: 1.01, letterSpacing: '-0.03em',
            margin: 0,
            ...stagger(2),
          }}>
            An event for the global<br />
            digital rights community
          </p>
          <p style={{
            fontSize: 'clamp(14px, 1.5vw, 26px)',
            lineHeight: 0.98, letterSpacing: '-0.04em',
            margin: 0,
            marginTop: 'clamp(20px, 2.5vw, 45px)',
            ...stagger(3),
          }}>
            8–11 June, 2026<br />
            Brussels
          </p>
        </div>

        <span className="title-main" style={{
          gridColumn: '1', gridRow: '2',
          fontFamily: font, fontWeight: 500,
          fontSize: 'clamp(32px, 4vw, 64px)',
          lineHeight: 1.1, letterSpacing: '-0.02em',
          color: '#000', alignSelf: 'center',
          ...stagger(4),
        }}>Digital Future Dialogue</span>

        <span className="title-year" style={{
          gridColumn: '2', gridRow: '2',
          fontFamily: font, fontWeight: 500,
          fontSize: 'clamp(32px, 4vw, 64px)',
          lineHeight: 1.1, letterSpacing: '-0.02em',
          color: '#000', alignSelf: 'center',
          ...stagger(5),
        }}>2026</span>

        <div className="grid-spacer" style={{ gridColumn: '1 / -1', gridRow: '3' }} />

        <div className="logo-wrap" style={{ gridColumn: '1', gridRow: '4', alignSelf: 'end', ...stagger(6) }}>
          <img src={dfdLogo} alt="Digital Future Dialogue" style={{
            width: 'clamp(120px, 16vw, 280px)', height: 'auto',
          }} />
        </div>
      </div>
    </div>
  );
}

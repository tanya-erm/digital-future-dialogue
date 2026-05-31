import { useCallback, useEffect, useRef, useState } from 'react';
import { GLYPHS, GLYPH_COLS } from './glyphs';
import dfdLogo from './dfd-logo.svg';

// ---------- Config ----------

const COLS = 22;
const ROWS = 15;
const SPACING = 62;
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

interface ColorTheme {
  id: string;
  swatch: string;
  bg: string;
  layers: { dotColor: string; gridDotColor: string }[];
}

const COLOR_THEMES: ColorTheme[] = [
  {
    id: 'cyan',
    swatch: '#acf7fc',
    bg: '#ACF7FC',
    layers: [
      { dotColor: '#77DFE7', gridDotColor: '#77DFE7' },
      { dotColor: '#F1F8F3', gridDotColor: '#F1F8F3' },
      { dotColor: '#FFFFFF', gridDotColor: '#FFFFFF' },
    ],
  },
  {
    id: 'pink-rose',
    swatch: '#ecb4f8',
    bg: '#ffffff',
    layers: [
      { dotColor: '#ECB4F8', gridDotColor: '#ECB4F8' },
      { dotColor: '#FDA0CD', gridDotColor: '#FDA0CD' },
      { dotColor: '#BBA84C', gridDotColor: '#BBA84C' },
    ],
  },
  {
    id: 'green',
    swatch: '#6edb9f',
    bg: '#6EDB9F',
    layers: [
      { dotColor: '#ACFCD0', gridDotColor: '#ACFCD0' },
      { dotColor: '#80DB6E', gridDotColor: '#80DB6E' },
      { dotColor: '#EEFF31', gridDotColor: '#EEFF31' },
    ],
  },
  {
    id: 'orange',
    swatch: '#ff9527',
    bg: '#FF9527',
    layers: [
      { dotColor: '#FC5BA1', gridDotColor: '#FC5BA1' },
      { dotColor: '#FFA78D', gridDotColor: '#FFA78D' },
      { dotColor: '#7690FF', gridDotColor: '#7690FF' },
    ],
  },
  {
    id: 'blue',
    swatch: '#7690ff',
    bg: '#7690FF',
    layers: [
      { dotColor: '#5073FF', gridDotColor: '#5073FF' },
      { dotColor: '#F8B58A', gridDotColor: '#F8B58A' },
      { dotColor: '#FFAA67', gridDotColor: '#FFAA67' },
    ],
  },
  {
    id: 'beige',
    swatch: '#b0aa6d',
    bg: '#B0AA6D',
    layers: [
      { dotColor: '#96926A', gridDotColor: '#96926A' },
      { dotColor: '#FF6199', gridDotColor: '#FF6199' },
      { dotColor: '#E7E2B3', gridDotColor: '#E7E2B3' },
    ],
  },
];

const BASE_LAYERS: Layer[] = [
  { delay: 0,    thinDiameter: 87, blackDiameter: 124, dotColor: '#ebb4f8', gridDotColor: '#bba84c', gridDotOpacity: 0 },
  { delay: 0.16, thinDiameter: 12, blackDiameter: 162, dotColor: '#bba84c', gridDotColor: '#bba84c', gridDotOpacity: 0 },
  { delay: 0.14, thinDiameter: 23, blackDiameter: 71,  dotColor: '#f990eb', gridDotColor: '#dda4ec', gridDotOpacity: 0 },
];

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

  const [activeTheme, setActiveTheme] = useState(() => Math.floor(Math.random() * COLOR_THEMES.length));
  const theme = COLOR_THEMES[activeTheme];
  const nextTheme = () => setActiveTheme((activeTheme + 1) % COLOR_THEMES.length);

  const [time, setTime] = useState(0);
  const startTimeRef = useRef(performance.now());

  // Synthetic cursor so the grid is alive before real mouse input.
  const padding_ = SPACING / 2;
  const synthX = padding_ + (TEXT_COL + 8) * SPACING;
  const synthY = padding_ + (TEXT_ROW + 3) * SPACING;
  const hasRealMouse = useRef(false);

  const [mouse, setMouse] = useState<{ x: number; y: number } | null>({ x: synthX, y: synthY });
  const mouseRef = useRef<{ x: number; y: number } | null>({ x: synthX, y: synthY });
  const svgRef = useRef<SVGSVGElement>(null);

  // Smooth fade: 1 when cursor present, decays to 0 after leave.
  const cursorActiveRef = useRef(true);
  const cursorPresenceRef = useRef(1);
  const [cursorPresence, setCursorPresence] = useState(1);

  const trailRefs = useRef<(({ x: number; y: number }) | null)[]>(BASE_LAYERS.map(() => null));
  const [trailPositions, setTrailPositions] = useState<(({ x: number; y: number }) | null)[]>(
    BASE_LAYERS.map(() => null),
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
      hasRealMouse.current = true;
      cursorActiveRef.current = true;
      const pos = screenToSvg(e.clientX, e.clientY);
      if (pos) {
        const p = { x: pos.x, y: pos.y };
        mouseRef.current = p;
        setMouse(p);
      }
    };
    const onLeave = () => {
      cursorActiveRef.current = false;
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

      for (let i = 0; i < BASE_LAYERS.length; i++) {
        const delay = BASE_LAYERS[i].delay;
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

      // Smooth cursor presence fade.
      const targetPresence = cursorActiveRef.current ? 1 : 0;
      const p = cursorPresenceRef.current;
      const newP = p + (targetPresence - p) * 0.03;
      cursorPresenceRef.current = newP;
      setCursorPresence(newP);

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

  // 10 curated reactive dot patterns, one picked randomly per load.
  const reactiveDotsRef = useRef<Set<string>>(null!);
  if (reactiveDotsRef.current === null) {
    const patterns: ((c: number, r: number) => boolean)[] = [
      // 0: Diagonal stripes (top-left to bottom-right)
      (c, r) => (c + r) % 4 === 0,
      // 1: Diagonal stripes (top-right to bottom-left)
      (c, r) => (c - r + ROWS) % 4 === 0,
      // 2: Vertical columns
      (c) => c % 3 === 0,
      // 3: Horizontal rows
      (_c, r) => r % 3 === 0,
      // 4: Checkerboard
      (c, r) => (c + r) % 2 === 0 && (c + r) % 4 < 2,
      // 5: Diamond / concentric rings from center
      (c, r) => (Math.abs(c - COLS / 2) + Math.abs(r - ROWS / 2)) % 4 < 1,
      // 6: Sparse scattered (seeded)
      (c, r) => ((c * 17 + r * 31) % 11) < 2,
      // 7: Cross pattern from center
      (c, r) => Math.abs(c - Math.floor(COLS / 2)) < 2 || Math.abs(r - Math.floor(ROWS / 2)) < 2,
      // 8: Corner clusters
      (c, r) => (c < 4 && r < 4) || (c >= COLS - 4 && r < 4) || (c < 4 && r >= ROWS - 4) || (c >= COLS - 4 && r >= ROWS - 4),
      // 9: Staggered dots
      (c, r) => (r % 2 === 0 ? c % 4 === 0 : c % 4 === 2),
    ];
    const pattern = patterns[Math.floor(Math.random() * patterns.length)];
    const set = new Set<string>();
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (pattern(c, r)) set.add(`${c},${r}`);
      }
    }
    reactiveDotsRef.current = set;
  }

  // Build dot arrays per layer.
  const allLayerDots: React.ReactElement[][] = [];

  for (let li = 0; li < BASE_LAYERS.length; li++) {
    const layer = BASE_LAYERS[li];
    const themeLayer = theme.layers[li];
    const dotColor = themeLayer?.dotColor ?? layer.dotColor;
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
            g = Math.pow(g, POWER) * cursorPresence;
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
          const reactive = reactiveDotsRef.current.has(`${col},${row}`);
          if (reactive && cursorPos) {
            let g = fieldStrength(cx, cy, cursorPos.x, cursorPos.y, REACH_X, REACH_Y);
            g = Math.pow(g, POWER) * cursorPresence;
            r = (blackR - thinR) * 0.2 * g;
          } else {
            r = 0;
          }
          color = dotColor;
          opacity = 1;
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
      background: theme.bg,
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
        gridTemplateRows: 'auto 1fr auto 2fr auto',
        padding: `clamp(8px, 1vw, 16px) ${pad} ${pad} ${pad}`,
        pointerEvents: 'none',
      }}>
        {/* Row 1: Title top-left — click to cycle theme */}
        <span className="title-main" onClick={nextTheme} style={{
          gridColumn: '1', gridRow: '1',
          fontFamily: font, fontWeight: 500,
          fontSize: 'clamp(40px, 5vw, 86px)',
          lineHeight: 1.1, letterSpacing: '-0.02em',
          color: '#000', alignSelf: 'start',
          cursor: 'pointer', pointerEvents: 'auto',
          ...stagger(0),
        }}>Digital Future Dialogue</span>

        {/* Row 1 right: Event info */}
        <div className="info-row" style={{
          gridColumn: '2', gridRow: '1',
          alignSelf: 'start',
        }}>
          <p className="event-info" style={{
            fontFamily: font, fontWeight: 500,
            fontSize: 'clamp(14px, 1.8vw, 35px)',
            lineHeight: 1.01, letterSpacing: '-0.03em',
            color: '#000', margin: 0,
            marginTop: 'clamp(4px, 0.5vw, 12px)',
            ...stagger(1),
          }}>
            An event for the global<br />
            digital rights community
          </p>
        </div>

        {/* Row 3: Date + Location, vertically centered */}
        <div className="title-date" style={{
          gridColumn: '1', gridRow: '3',
          fontFamily: font, fontWeight: 500,
          fontSize: 'clamp(40px, 5vw, 86px)',
          lineHeight: 1.1, letterSpacing: '-0.02em',
          color: '#000', alignSelf: 'center',
          ...stagger(3),
        }}>
          <span className="date-short">1–3 June</span>
          <span className="date-full" style={{ display: 'none' }}>1–3 June, 2026<br />Brussels</span>
        </div>

        <div className="title-location" style={{
          gridColumn: '2', gridRow: '3',
          fontFamily: font, fontWeight: 500,
          fontSize: 'clamp(40px, 5vw, 86px)',
          lineHeight: 1.1, letterSpacing: '-0.02em',
          color: '#000', alignSelf: 'center',
          ...stagger(4),
        }}>
          Brussels<br />
          2026
        </div>

        {/* Row 5: Logo bottom-left */}
        <div className="logo-wrap" style={{ gridColumn: '1', gridRow: '5', alignSelf: 'end', ...stagger(5) }}>
          <img src={dfdLogo} alt="Digital Future Dialogue" style={{
            width: 'clamp(120px, 16vw, 280px)', height: 'auto',
          }} />
        </div>
      </div>
    </div>
  );
}

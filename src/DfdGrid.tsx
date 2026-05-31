import { useCallback, useEffect, useRef, useState } from 'react';
import { GLYPHS, GLYPH_COLS } from './glyphs';

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

const BASE_LAYERS: Layer[] = [
  { delay: 0,    thinDiameter: 87, blackDiameter: 124, dotColor: '#ebb4f8', gridDotColor: '#bba84c', gridDotOpacity: 0 },
  { delay: 0.16, thinDiameter: 12, blackDiameter: 162, dotColor: '#bba84c', gridDotColor: '#bba84c', gridDotOpacity: 0 },
  { delay: 0.14, thinDiameter: 23, blackDiameter: 71,  dotColor: '#f990eb', gridDotColor: '#dda4ec', gridDotOpacity: 0 },
];

const THEME_LAYERS = [
  { dotColor: '#ECB4F8', gridDotColor: '#ECB4F8' },
  { dotColor: '#FDA0CD', gridDotColor: '#FDA0CD' },
  { dotColor: '#BBA84C', gridDotColor: '#BBA84C' },
];

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

export default function DfdGrid() {
  const padding = SPACING / 2;
  const vbW = (COLS - 1) * SPACING + 2 * padding;
  const vbH = (ROWS - 1) * SPACING + 2 * padding;

  const letterCells = useRef(new Set<string>());
  if (letterCells.current.size === 0) {
    let cursor = TEXT_COL;
    for (const ch of TEXT) {
      const glyph = GLYPHS[ch as keyof typeof GLYPHS];
      if (!glyph) { cursor += GLYPH_COLS + LETTER_GAP; continue; }
      const gRows = glyph.length;
      const gCols = glyph[0].length;
      for (let gr = 0; gr < gRows; gr++) {
        for (let gc = 0; gc < gCols; gc++) {
          if (glyph[gr][gc]) {
            letterCells.current.add(`${cursor + gc},${TEXT_ROW + gr}`);
          }
        }
      }
      cursor += gCols + LETTER_GAP;
    }
  }

  const [time, setTime] = useState(0);
  const startTimeRef = useRef(performance.now());

  const synthX = padding + (TEXT_COL + 8) * SPACING;
  const synthY = padding + (TEXT_ROW + 3) * SPACING;
  const hasRealMouse = useRef(false);

  const [mouse, setMouse] = useState<{ x: number; y: number } | null>({ x: synthX, y: synthY });
  const mouseRef = useRef<{ x: number; y: number } | null>({ x: synthX, y: synthY });
  const svgRef = useRef<SVGSVGElement>(null);

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

  const reactiveDotsRef = useRef<Set<string>>(null!);
  if (reactiveDotsRef.current === null) {
    const patterns: ((c: number, r: number) => boolean)[] = [
      (c, r) => (c + r) % 4 === 0,
      (c, r) => (c - r + ROWS) % 4 === 0,
      (c) => c % 3 === 0,
      (_c, r) => r % 3 === 0,
      (c, r) => (c + r) % 2 === 0 && (c + r) % 4 < 2,
      (c, r) => (Math.abs(c - COLS / 2) + Math.abs(r - ROWS / 2)) % 4 < 1,
      (c, r) => ((c * 17 + r * 31) % 11) < 2,
      (c, r) => Math.abs(c - Math.floor(COLS / 2)) < 2 || Math.abs(r - Math.floor(ROWS / 2)) < 2,
      (c, r) => (c < 4 && r < 4) || (c >= COLS - 4 && r < 4) || (c < 4 && r >= ROWS - 4) || (c >= COLS - 4 && r >= ROWS - 4),
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

  const allLayerDots: React.ReactElement[][] = [];

  for (let li = 0; li < BASE_LAYERS.length; li++) {
    const layer = BASE_LAYERS[li];
    const dotColor = THEME_LAYERS[li]?.dotColor ?? layer.dotColor;
    const cursorPos = layer.delay === 0 ? mouse : (trailPositions[li] ?? null);
    const thinR = layer.thinDiameter / 2;
    const blackR = layer.blackDiameter / 2;
    const dots: React.ReactElement[] = [];

    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const cx = padding + col * SPACING;
        const cy = padding + row * SPACING;
        const isLetter = letterCells.current.has(`${col},${row}`);
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

  return (
    <div className="dfd-grid-footer">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${vbW} ${vbH}`}
        preserveAspectRatio="xMidYMid slice"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      >
        {allLayerDots.map((dots, i) => (
          <g key={i}>{dots}</g>
        ))}
      </svg>
    </div>
  );
}

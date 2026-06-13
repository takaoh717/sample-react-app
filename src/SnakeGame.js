import React, { useState, useEffect, useRef, useCallback } from 'react';

const CELL = 20;
const SPEED_START = 200;
const SPEED_MIN = 80;
const SPEED_DEC = 5;

const DIRS = { UP: [0, -1], DOWN: [0, 1], LEFT: [-1, 0], RIGHT: [1, 0] };
const OPPOSITE = { UP: 'DOWN', DOWN: 'UP', LEFT: 'RIGHT', RIGHT: 'LEFT' };
const KEY_MAP = {
  ArrowUp: 'UP', ArrowDown: 'DOWN', ArrowLeft: 'LEFT', ArrowRight: 'RIGHT',
  w: 'UP', s: 'DOWN', a: 'LEFT', d: 'RIGHT',
};

function calcSize() {
  const avail = Math.min(window.innerWidth - 24, window.innerHeight - 270, 420);
  return Math.max(160, Math.floor(avail / CELL) * CELL);
}

export default function SnakeGame() {
  const canvasRef = useRef(null);
  const gameAreaRef = useRef(null);
  const stateRef = useRef(null);
  const touchRef = useRef(null);
  const dirQ = useRef([]);

  const [phase, setPhase] = useState('start'); // start | playing | over
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => +(localStorage.getItem('snakeBest') || 0));

  const randFood = (snake, cols, rows) => {
    let f;
    do { f = [Math.floor(Math.random() * cols), Math.floor(Math.random() * rows)]; }
    while (snake.some(([x, y]) => x === f[0] && y === f[1]));
    return f;
  };

  const initGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const size = calcSize();
    canvas.width = size;
    canvas.height = size;
    const cols = size / CELL, rows = size / CELL;
    const cx = Math.floor(cols / 2), cy = Math.floor(rows / 2);
    const snake = [[cx, cy], [cx - 1, cy], [cx - 2, cy]];
    stateRef.current = {
      snake,
      dir: 'RIGHT',
      food: randFood(snake, cols, rows),
      score: 0,
      speed: SPEED_START,
    };
    dirQ.current = [];
    setScore(0);
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const s = stateRef.current;
    if (!canvas || !s) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;

    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, W);

    // Subtle grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= W; i += CELL) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, W); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(W, i); ctx.stroke();
    }

    // Food with glow
    const [fx, fy] = s.food;
    const pulse = Math.sin(Date.now() / 250) * 4;
    ctx.save();
    ctx.shadowColor = '#ff4757';
    ctx.shadowBlur = 18 + pulse;
    ctx.fillStyle = '#ff6b81';
    ctx.beginPath();
    ctx.arc(fx * CELL + CELL / 2, fy * CELL + CELL / 2, CELL / 2 - 3 + pulse * 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Snake segments
    s.snake.forEach(([x, y], i) => {
      const px = x * CELL + 1, py = y * CELL + 1, sz = CELL - 2;
      ctx.save();
      if (i === 0) {
        ctx.shadowColor = '#00e676';
        ctx.shadowBlur = 20;
        ctx.fillStyle = '#00e676';
      } else {
        const ratio = 1 - (i / s.snake.length) * 0.65;
        ctx.shadowColor = `rgba(0,230,118,${ratio * 0.3})`;
        ctx.shadowBlur = 6;
        const g = Math.floor(100 + 130 * ratio);
        ctx.fillStyle = `rgba(0,${g},70,${0.35 + 0.65 * ratio})`;
      }
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(px, py, sz, sz, i === 0 ? 6 : 3);
      else ctx.rect(px, py, sz, sz);
      ctx.fill();
      ctx.restore();
    });

    // Eyes on head
    if (s.snake.length > 0) {
      const [hx, hy] = s.snake[0];
      const cx = hx * CELL + CELL / 2, cy = hy * CELL + CELL / 2;
      ctx.fillStyle = '#001a0d';
      const eyePairs = {
        RIGHT: [[cx + 3, cy - 4], [cx + 3, cy + 4]],
        LEFT:  [[cx - 3, cy - 4], [cx - 3, cy + 4]],
        DOWN:  [[cx - 4, cy + 3], [cx + 4, cy + 3]],
        UP:    [[cx - 4, cy - 3], [cx + 4, cy - 3]],
      };
      (eyePairs[s.dir] || []).forEach(([ex, ey]) => {
        ctx.beginPath(); ctx.arc(ex, ey, 2, 0, Math.PI * 2); ctx.fill();
      });
    }
  }, []);

  const tick = useCallback(() => {
    const s = stateRef.current;
    const canvas = canvasRef.current;
    if (!s || !canvas) return false;

    while (dirQ.current.length > 0) {
      const d = dirQ.current.shift();
      if (OPPOSITE[s.dir] !== d) { s.dir = d; break; }
    }

    const cols = canvas.width / CELL, rows = canvas.height / CELL;
    const [dx, dy] = DIRS[s.dir];
    const [hx, hy] = s.snake[0];
    const nx = hx + dx, ny = hy + dy;

    if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) return false;
    if (s.snake.some(([x, y]) => x === nx && y === ny)) return false;

    const newSnake = [[nx, ny], ...s.snake];
    if (nx === s.food[0] && ny === s.food[1]) {
      s.score++;
      setScore(s.score);
      s.food = randFood(newSnake, cols, rows);
      s.speed = Math.max(SPEED_MIN, s.speed - SPEED_DEC);
    } else {
      newSnake.pop();
    }
    s.snake = newSnake;
    return true;
  }, []);

  /* ─── game loop: RAF for rendering, setTimeout for logic ─── */
  useEffect(() => {
    if (phase !== 'playing') return;
    let alive = true;
    let rafId, timeoutId;

    const animate = () => {
      if (!alive) return;
      draw();
      rafId = requestAnimationFrame(animate);
    };
    rafId = requestAnimationFrame(animate);

    const logic = () => {
      if (!alive) return;
      if (!tick()) {
        alive = false;
        cancelAnimationFrame(rafId);
        const sc = stateRef.current?.score ?? 0;
        setBest(b => {
          const nb = Math.max(b, sc);
          localStorage.setItem('snakeBest', String(nb));
          return nb;
        });
        setPhase('over');
        return;
      }
      timeoutId = setTimeout(logic, stateRef.current?.speed ?? SPEED_START);
    };
    timeoutId = setTimeout(logic, stateRef.current?.speed ?? SPEED_START);

    return () => { alive = false; cancelAnimationFrame(rafId); clearTimeout(timeoutId); };
  }, [phase, draw, tick]);

  /* ─── keyboard controls ─── */
  useEffect(() => {
    if (phase !== 'playing') return;
    const onKey = e => {
      const d = KEY_MAP[e.key];
      if (d) { e.preventDefault(); dirQ.current.push(d); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase]);

  /* ─── prevent page scroll on touch ─── */
  useEffect(() => {
    const el = gameAreaRef.current;
    if (!el) return;
    const prevent = e => e.preventDefault();
    el.addEventListener('touchmove', prevent, { passive: false });
    return () => el.removeEventListener('touchmove', prevent);
  }, []);

  /* ─── touch swipe ─── */
  const onTouchStart = e => {
    touchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const onTouchEnd = e => {
    if (!touchRef.current || phase !== 'playing') return;
    const dx = e.changedTouches[0].clientX - touchRef.current.x;
    const dy = e.changedTouches[0].clientY - touchRef.current.y;
    if (Math.abs(dx) < 15 && Math.abs(dy) < 15) return;
    dirQ.current.push(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'RIGHT' : 'LEFT') : (dy > 0 ? 'DOWN' : 'UP'));
    touchRef.current = null;
  };

  const startGame = () => { initGame(); setPhase('playing'); };
  const pushDir = dir => { if (phase === 'playing') dirQ.current.push(dir); };

  /* ─── initial canvas paint ─── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const size = calcSize();
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#0d1117'; ctx.fillRect(0, 0, size, size);
  }, []);

  return (
    <div style={S.wrap}>
      <header style={S.header}>
        <h1 style={S.title}>SNAKE</h1>
        <div style={S.scores}>
          {[['SCORE', score], ['BEST', best]].map(([lbl, val]) => (
            <div key={lbl} style={S.scoreItem}>
              <span style={S.scoreLbl}>{lbl}</span>
              <span style={S.scoreVal}>{val}</span>
            </div>
          ))}
        </div>
      </header>

      <div
        ref={gameAreaRef}
        style={S.gameArea}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <canvas ref={canvasRef} style={S.canvas} />
        {phase !== 'playing' && (
          <div style={S.overlay}>
            <div style={S.modal}>
              <div style={S.icon}>{phase === 'start' ? '🐍' : '💥'}</div>
              <h2 style={S.modalTitle}>{phase === 'start' ? 'SNAKE' : 'GAME OVER'}</h2>
              {phase === 'start' && <p style={S.hint}>スワイプまたは十字キーで操作</p>}
              {phase === 'over' && (
                <>
                  <p style={S.finalScore}>{score} pt</p>
                  {score > 0 && score >= best && <p style={S.newRecord}>🏆 ハイスコア！</p>}
                </>
              )}
              <button style={S.btn} onClick={startGame}>
                {phase === 'start' ? 'START' : 'もう一度'}
              </button>
            </div>
          </div>
        )}
      </div>

      <div style={S.dpad}>
        <div style={S.drow}><DpadBtn label="▲" onPress={() => pushDir('UP')} /></div>
        <div style={S.drow}>
          <DpadBtn label="◀" onPress={() => pushDir('LEFT')} />
          <div style={{ width: 56, height: 56 }} />
          <DpadBtn label="▶" onPress={() => pushDir('RIGHT')} />
        </div>
        <div style={S.drow}><DpadBtn label="▼" onPress={() => pushDir('DOWN')} /></div>
      </div>
    </div>
  );
}

function DpadBtn({ label, onPress }) {
  return (
    <button
      style={S.dpadBtn}
      onPointerDown={e => { e.preventDefault(); onPress(); }}
    >
      {label}
    </button>
  );
}

const C = {
  bg: '#0d1117', surf: '#161b22', brd: '#30363d',
  grn: '#00e676', txt: '#e6edf3', muted: '#8b949e',
  gold: '#fbbf24',
};

const S = {
  wrap: {
    minHeight: '100dvh',
    background: C.bg,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '10px 12px',
    boxSizing: 'border-box',
    userSelect: 'none',
    WebkitUserSelect: 'none',
  },
  header: {
    width: '100%',
    maxWidth: 440,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    margin: 0, fontSize: 20, fontWeight: 900,
    letterSpacing: 6, color: C.grn, fontFamily: 'monospace',
  },
  scores: { display: 'flex', gap: 16 },
  scoreItem: { display: 'flex', flexDirection: 'column', alignItems: 'center' },
  scoreLbl: { fontSize: 10, color: C.muted, letterSpacing: 2, fontFamily: 'monospace' },
  scoreVal: { fontSize: 22, fontWeight: 900, color: C.txt, fontFamily: 'monospace' },
  gameArea: { position: 'relative', touchAction: 'none' },
  canvas: { display: 'block', border: `2px solid ${C.brd}`, borderRadius: 8 },
  overlay: {
    position: 'absolute', inset: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(13,17,23,0.88)', backdropFilter: 'blur(6px)', borderRadius: 8,
  },
  modal: {
    textAlign: 'center', padding: '24px 36px',
    background: C.surf, borderRadius: 16, border: `1px solid ${C.brd}`,
  },
  icon: { fontSize: 48, marginBottom: 8 },
  modalTitle: {
    margin: '0 0 8px', fontSize: 24, letterSpacing: 6,
    color: C.txt, fontFamily: 'monospace', fontWeight: 900,
  },
  hint: { margin: '0 0 18px', color: C.muted, fontSize: 13 },
  finalScore: { margin: '0 0 6px', color: C.txt, fontSize: 28, fontWeight: 900, fontFamily: 'monospace' },
  newRecord: { margin: '0 0 12px', color: C.gold, fontSize: 15 },
  btn: {
    background: C.grn, color: '#000', border: 'none', borderRadius: 8,
    padding: '12px 32px', fontSize: 15, fontWeight: 900,
    cursor: 'pointer', letterSpacing: 3, fontFamily: 'monospace',
  },
  dpad: {
    marginTop: 14, display: 'flex',
    flexDirection: 'column', alignItems: 'center', gap: 3,
  },
  drow: { display: 'flex', gap: 3, alignItems: 'center' },
  dpadBtn: {
    width: 56, height: 56,
    background: C.surf, color: C.grn, border: `2px solid ${C.brd}`,
    borderRadius: 10, fontSize: 20, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    touchAction: 'none', fontFamily: 'monospace',
  },
};

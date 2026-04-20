'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

/* ── Constants ── */

const TIMEZONES = [
  { label: 'LOCAL',        value: 'local' },
  { label: 'UTC',          value: 'UTC' },
  { label: 'NEW YORK',     value: 'America/New_York' },
  { label: 'LOS ANGELES',  value: 'America/Los_Angeles' },
  { label: 'LONDON',       value: 'Europe/London' },
  { label: 'BERLIN',       value: 'Europe/Berlin' },
  { label: 'ISTANBUL',     value: 'Europe/Istanbul' },
  { label: 'DUBAI',        value: 'Asia/Dubai' },
  { label: 'TOKYO',        value: 'Asia/Tokyo' },
  { label: 'SYDNEY',       value: 'Australia/Sydney' },
];

const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const WORK_SECS = 25 * 60;
const BREAK_SECS = 5 * 60;

/* ── Helpers ── */

function pad(n: number) {
  return n.toString().padStart(2, '0');
}

function getZoneTime(date: Date, tz: string) {
  if (tz === 'local') {
    return {
      h: date.getHours(),
      m: date.getMinutes(),
      s: date.getSeconds(),
      day: DAYS[date.getDay()],
      dateStr: date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }),
    };
  }
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    weekday: 'short',
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
    hour12: false,
  }).formatToParts(date);
  const get = (t: string) => parts.find(p => p.type === t)?.value ?? '00';
  return {
    h: parseInt(get('hour')) % 24,
    m: parseInt(get('minute')),
    s: parseInt(get('second')),
    day: get('weekday').toUpperCase().slice(0, 3),
    dateStr: `${get('month')}/${get('day')}/${get('year')}`,
  };
}

function fmtMs(ms: number): [string, string] {
  const m  = Math.floor(ms / 60000);
  const s  = Math.floor((ms % 60000) / 1000);
  const cs = Math.floor((ms % 1000) / 10);
  return [`${pad(m)}:${pad(s)}`, pad(cs)];
}

function fmtPom(s: number) {
  return `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;
}

type Tab = 'clock' | 'stopwatch' | 'pomodoro';

/* ── Component ── */

export default function CyberClock() {
  /* Hydration-safe: start null, populate after mount */
  const [mounted, setMounted] = useState(false);
  const [now, setNow]         = useState<Date>(new Date());
  const [tz, setTz]           = useState('local');
  const [tab, setTab]         = useState<Tab>('clock');
  const [glitch, setGlitch]   = useState(false);
  const [showTz, setShowTz]   = useState(false);

  /* Stopwatch */
  const [swRunning, setSwRunning]   = useState(false);
  const [swElapsed, setSwElapsed]   = useState(0);
  const [swLaps, setSwLaps]         = useState<number[]>([]);
  const swStartRef  = useRef<number | null>(null);
  const swAccumRef  = useRef(0);
  const swRafRef    = useRef<number | null>(null);

  /* Pomodoro */
  const [pomMode, setPomMode]         = useState<'work' | 'break'>('work');
  const [pomRunning, setPomRunning]   = useState(false);
  const [pomRemain, setPomRemain]     = useState(WORK_SECS);
  const [pomSessions, setPomSessions] = useState(0);
  const pomRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ── Effects ── */

  useEffect(() => {
    setMounted(true);
    const id = setInterval(() => {
      setNow(new Date());
      if (Math.random() < 0.018) {
        setGlitch(true);
        setTimeout(() => setGlitch(false), 130);
      }
    }, 1000);
    return () => clearInterval(id);
  }, []);

  /* Stopwatch RAF ticker */
  const swTick = useCallback(() => {
    if (swStartRef.current !== null) {
      setSwElapsed(swAccumRef.current + Date.now() - swStartRef.current);
      swRafRef.current = requestAnimationFrame(swTick);
    }
  }, []);

  /* Pomodoro interval */
  useEffect(() => {
    if (pomRunning) {
      pomRef.current = setInterval(() => {
        setPomRemain(r => {
          if (r <= 1) {
            setPomRunning(false);
            if (pomMode === 'work') {
              setPomSessions(s => s + 1);
              setPomMode('break');
              return BREAK_SECS;
            } else {
              setPomMode('work');
              return WORK_SECS;
            }
          }
          return r - 1;
        });
      }, 1000);
    } else {
      if (pomRef.current) clearInterval(pomRef.current);
    }
    return () => { if (pomRef.current) clearInterval(pomRef.current); };
  }, [pomRunning, pomMode]);

  /* ── Stopwatch handlers ── */

  function swStart() {
    swStartRef.current = Date.now();
    setSwRunning(true);
    swRafRef.current = requestAnimationFrame(swTick);
  }

  function swPause() {
    if (swStartRef.current) {
      swAccumRef.current += Date.now() - swStartRef.current;
      swStartRef.current = null;
    }
    if (swRafRef.current) cancelAnimationFrame(swRafRef.current);
    setSwRunning(false);
  }

  function swLap() {
    setSwLaps(l => [...l, swElapsed]);
  }

  function swReset() {
    swPause();
    swAccumRef.current = 0;
    swStartRef.current = null;
    setSwElapsed(0);
    setSwLaps([]);
  }

  /* ── Pomodoro handlers ── */

  function pomSwitch(mode: 'work' | 'break') {
    setPomRunning(false);
    setPomMode(mode);
    setPomRemain(mode === 'work' ? WORK_SECS : BREAK_SECS);
  }

  function pomToggle() { setPomRunning(r => !r); }

  function pomReset() {
    setPomRunning(false);
    setPomRemain(pomMode === 'work' ? WORK_SECS : BREAK_SECS);
  }

  /* ── Derived values ── */

  const td = getZoneTime(now, tz);
  const tzLabel = TIMEZONES.find(t => t.value === tz)?.label ?? 'LOCAL';

  const pomTotal     = pomMode === 'work' ? WORK_SECS : BREAK_SECS;
  const pomRadius    = 90;
  const pomCirc      = 2 * Math.PI * pomRadius;
  const pomDash      = pomCirc * (1 - pomRemain / pomTotal);

  const [swMain, swCs] = fmtMs(swElapsed);
  const timeStr = `${pad(td.h)}${pad(td.m)}`;

  if (!mounted) return null;

  return (
    <>
      {/* Corner chrome */}
      <div className="corner corner-tl" />
      <div className="corner corner-tr" />
      <div className="corner corner-bl" />
      <div className="corner corner-br" />

      <div className="page" onClick={() => showTz && setShowTz(false)}>

        {/* Header */}
        <header className="header">
          <div className="logo">
            VOID<span className="logo-dim">.</span>TERMINAL
            <span className="logo-dim" style={{ fontSize: '0.7em', marginLeft: 8 }}>v2.087</span>
          </div>
          <div className="header-right">
            <div className="sys-status">
              <div className="status-dot" />
              <span className="sys-label">SYS_ONLINE</span>
            </div>
          </div>
        </header>

        {/* Tabs */}
        <nav className="tabs">
          {(['clock', 'stopwatch', 'pomodoro'] as Tab[]).map(t => (
            <button
              key={t}
              className={`tab-btn${tab === t ? ' active' : ''}`}
              onClick={() => setTab(t)}
            >
              {t === 'clock' ? '// CLOCK' : t === 'stopwatch' ? '// CHRONOMETER' : '// POMODORO'}
            </button>
          ))}
        </nav>

        {/* ── CLOCK TAB ── */}
        {tab === 'clock' && (
          <div className="clock-wrap">
            <div className="time-row">
              {/* HH */}
              <span
                className={`time-main${glitch ? ' glitch-active' : ''}`}
                data-text={pad(td.h)}
              >
                {pad(td.h)}
              </span>

              {/* separator */}
              <span className="time-sep">:</span>

              {/* MM */}
              <span
                className={`time-main${glitch ? ' glitch-active' : ''}`}
                data-text={pad(td.m)}
              >
                {pad(td.m)}
              </span>

              {/* seconds block */}
              <div className="time-seconds-wrap">
                <span className="time-seconds-label">SEC</span>
                <span className="time-seconds">{pad(td.s)}</span>
              </div>
            </div>

            <div className="hr-line" />

            <div className="date-row">
              <span className="day-chip">{td.day}</span>
              <span className="slash">//</span>
              <span>{td.dateStr}</span>
            </div>

            {/* Timezone selector */}
            <div
              className="tz-wrap"
              onClick={e => e.stopPropagation()}
            >
              <button
                className={`tz-trigger${showTz ? ' open' : ''}`}
                onClick={() => setShowTz(v => !v)}
              >
                <span className="tz-icon">◎</span>
                TZ: {tzLabel}
                <span className={`tz-caret${showTz ? ' up' : ''}`}>▲</span>
              </button>

              {showTz && (
                <div className="tz-dropdown">
                  {TIMEZONES.map(({ label, value }) => (
                    <div
                      key={value}
                      className={`tz-option${tz === value ? ' sel' : ''}`}
                      onClick={() => { setTz(value); setShowTz(false); }}
                    >
                      {label}
                      <span className="tz-check">✓</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── STOPWATCH TAB ── */}
        {tab === 'stopwatch' && (
          <div className="sw-wrap">
            <div className="sw-display">
              <span className="sw-prefix">T+</span>
              {swMain}
              <span className="sw-centisec">.{swCs}</span>
            </div>

            <div className="btn-row">
              <button
                className={`cybr-btn${swRunning ? ' danger' : ' primary'}`}
                onClick={swRunning ? swPause : swStart}
              >
                {swRunning ? '⏸ PAUSE' : '▶ START'}
              </button>
              <button
                className="cybr-btn accent"
                onClick={swLap}
                disabled={!swRunning}
              >
                LAP
              </button>
              <button
                className="cybr-btn"
                onClick={swReset}
                disabled={swElapsed === 0}
              >
                RESET
              </button>
            </div>

            {swLaps.length > 0 && (
              <div className="laps-container">
                {[...swLaps].reverse().map((t, i) => {
                  const idx   = swLaps.length - i;
                  const prev  = idx > 1 ? swLaps[idx - 2] : 0;
                  const delta = t - prev;
                  const [m, cs] = fmtMs(t);
                  const [dm, dcs] = fmtMs(delta);
                  return (
                    <div key={idx} className="lap-row">
                      <span className="lap-idx">LAP {String(idx).padStart(2, '0')}</span>
                      <span className="lap-val">{m}.{cs}</span>
                      <span className="lap-delta">+{dm}.{dcs}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── POMODORO TAB ── */}
        {tab === 'pomodoro' && (
          <div className="pom-wrap">
            {/* Mode tabs */}
            <div className="pom-modes">
              <button
                className={`pom-tab${pomMode === 'work' ? ' active' : ''}`}
                onClick={() => pomSwitch('work')}
              >
                WORK · 25
              </button>
              <button
                className={`pom-tab${pomMode === 'break' ? ' active break-active' : ''}`}
                onClick={() => pomSwitch('break')}
              >
                BREAK · 5
              </button>
            </div>

            {/* Ring */}
            <div className="pom-ring-wrap">
              <svg width="210" height="210" viewBox="0 0 210 210">
                <circle
                  className="pom-track"
                  cx="105" cy="105"
                  r={pomRadius}
                />
                <circle
                  className={`pom-progress${pomMode === 'break' ? ' break-mode' : ''}`}
                  cx="105" cy="105"
                  r={pomRadius}
                  strokeDasharray={pomCirc}
                  strokeDashoffset={-pomDash}
                />
              </svg>

              <div className="pom-inner">
                <span className={`pom-time${pomMode === 'break' ? ' break-mode' : ''}`}>
                  {fmtPom(pomRemain)}
                </span>
                <span className="pom-mode-label">
                  {pomMode === 'work' ? '// FOCUS' : '// RECHARGE'}
                </span>
              </div>
            </div>

            {/* Controls */}
            <div className="btn-row">
              <button
                className={`cybr-btn${pomRunning ? ' danger' : ' primary'}`}
                onClick={pomToggle}
              >
                {pomRunning ? '⏸ PAUSE' : '▶ START'}
              </button>
              <button className="cybr-btn" onClick={pomReset}>
                RESET
              </button>
            </div>

            {/* Session counter */}
            <div className="pom-sessions">
              SESSIONS COMPLETED:{' '}
              <span className="pom-sessions-val">{String(pomSessions).padStart(2, '0')}</span>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="footer">
          <div className="footer-left">
            <span>SYS::CLOCK_MODULE_v4.2</span>
            <span>RENDER::OK</span>
          </div>
          <span>{now.toISOString().replace('T', ' ').slice(0, 19)} UTC</span>
        </footer>

      </div>
    </>
  );
}

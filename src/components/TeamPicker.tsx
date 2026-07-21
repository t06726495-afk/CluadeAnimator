import { useEffect, useRef, useState } from 'react';
import { searchTeams } from '../lib/teams';

// Autocomplete text input backed by the FBS team list.
// Single mode: value is one team name, selecting replaces it entirely.
// Multi mode: value is a comma-separated string (e.g. competing schools);
// typing filters on the text after the last comma, and picking a team
// appends it as a chip-like comma entry.
type Props = {
  value: string;
  onChange: (value: string) => void;
  multi?: boolean;
  placeholder?: string;
  style?: React.CSSProperties;
};

export default function TeamPicker({ value, onChange, multi = false, placeholder, style }: Props) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);

  const currentToken = multi ? (value.split(',').pop() ?? '').trim() : value;
  const matches = searchTeams(currentToken);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const pick = (name: string) => {
    if (multi) {
      const lastComma = value.lastIndexOf(',');
      const before = lastComma === -1 ? '' : `${value.slice(0, lastComma + 1)} `;
      onChange(`${before}${name}, `);
    } else {
      onChange(name);
    }
    setOpen(false);
    setHighlight(0);
  };

  return (
    <div ref={rootRef} style={{ position: 'relative', ...style }}>
      <input
        className="cell-input"
        value={value}
        placeholder={placeholder}
        onChange={(e) => { onChange(e.target.value); setOpen(true); setHighlight(0); }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (!open || !matches.length) return;
          if (e.key === 'ArrowDown') { e.preventDefault(); setHighlight((h) => Math.min(h + 1, matches.length - 1)); }
          else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlight((h) => Math.max(h - 1, 0)); }
          else if (e.key === 'Enter') { e.preventDefault(); pick(matches[highlight].name); }
          else if (e.key === 'Escape') setOpen(false);
        }}
        style={{ width: '100%' }}
      />
      {open && matches.length > 0 && currentToken.length > 0 && (
        <div className="team-dropdown">
          {matches.map((t, i) => (
            <div
              key={t.name}
              className={`team-option${i === highlight ? ' active' : ''}`}
              onMouseDown={(e) => { e.preventDefault(); pick(t.name); }}
              onMouseEnter={() => setHighlight(i)}
            >
              <span className="team-swatch" style={{ background: t.primary }} />
              {t.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

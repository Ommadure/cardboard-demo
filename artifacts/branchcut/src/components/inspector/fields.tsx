import { useEffect, useRef, useState, type ReactNode } from 'react';
import { inputCls, labelCls } from '@/components/shell/styles';

export function Field({ label, children, error, htmlFor }: { label: string; children: ReactNode; error?: string | null; htmlFor?: string }) {
  return (
    <div className="min-w-0">
      <label className={labelCls} htmlFor={htmlFor}>{label}</label>
      {children}
      {error && <p className="mt-1 text-[10.5px] leading-snug text-[#f87171]" role="alert">{error}</p>}
    </div>
  );
}

/** Number input with live validation; commits valid values immediately. */
export function NumberField({ id, label, value, step = 0.1, suffix, disabled, validate, onCommit }: {
  id: string; label: string; value: number; step?: number; suffix?: string; disabled?: boolean;
  validate: (n: number) => string | null; onCommit: (n: number) => string | null;
}) {
  const [text, setText] = useState(String(value));
  const [err, setErr] = useState<string | null>(null);
  const focused = useRef(false);
  useEffect(() => { if (!focused.current) { setText(String(value)); setErr(null); } }, [value]);
  const change = (t: string) => {
    setText(t);
    const n = Number(t);
    if (t.trim() === '' || !Number.isFinite(n)) return setErr('Enter a number.');
    const v = validate(n);
    if (v) return setErr(v);
    setErr(onCommit(n));
  };
  return (
    <Field label={label} error={err} htmlFor={id}>
      <div className="relative">
        <input
          id={id} type="number" step={step} value={text} disabled={disabled} data-testid={`input-${id}`}
          aria-invalid={!!err}
          onFocus={() => { focused.current = true; }}
          onBlur={() => { focused.current = false; if (err) { setText(String(value)); } }}
          onChange={(e) => change(e.target.value)}
          className={`${inputCls} tc pr-6 ${err ? 'border-[#ef4444]/70 focus:border-[#ef4444]' : ''}`}
        />
        {suffix && <span className="tc pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10.5px] text-[#8b93a7]">{suffix}</span>}
      </div>
    </Field>
  );
}

export function TextField({ id, label, value, disabled, multiline, onCommit }: {
  id: string; label: string; value: string; disabled?: boolean; multiline?: boolean; onCommit: (v: string) => string | null;
}) {
  const [text, setText] = useState(value);
  const [err, setErr] = useState<string | null>(null);
  const focused = useRef(false);
  useEffect(() => { if (!focused.current) setText(value); }, [value]);
  const change = (t: string) => {
    setText(t);
    if (!t.trim()) return setErr(`${label} cannot be empty.`);
    setErr(onCommit(t));
  };
  const common = {
    id, value: text, disabled, 'data-testid': `input-${id}`, 'aria-invalid': !!err,
    onFocus: () => { focused.current = true; },
    onBlur: () => { focused.current = false; if (err) { setText(value); setErr(null); } },
  };
  return (
    <Field label={label} error={err} htmlFor={id}>
      {multiline
        ? <textarea {...common} rows={2} onChange={(e) => change(e.target.value)} className={`${inputCls} h-auto resize-none py-1.5 leading-snug`} />
        : <input {...common} onChange={(e) => change(e.target.value)} className={inputCls} />}
    </Field>
  );
}

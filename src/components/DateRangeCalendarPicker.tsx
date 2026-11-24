import * as React from 'react';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';

interface DateRangeCalendarPickerProps {
  startDate?: string;
  endDate?: string;
  minDate: string;
  maxDays?: number;
  defaultOpen?: boolean;
  onChange: (next: { startDate?: string; endDate?: string; duration?: string }) => void;
}

const WEEKDAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, (m || 1) - 1, d || 1, 12, 0, 0));
}

function toIsoUtc(year: number, monthIndex: number, day: number): string {
  const y = String(year);
  const m = String(monthIndex + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function addDaysIso(iso: string, deltaDays: number): string {
  const dt = parseIsoDate(iso);
  dt.setUTCDate(dt.getUTCDate() + deltaDays);
  return dt.toISOString().slice(0, 10);
}

function diffDaysInclusive(startIso: string, endIso: string): number {
  const s = parseIsoDate(startIso).getTime();
  const e = parseIsoDate(endIso).getTime();
  return Math.round((e - s) / 86400000) + 1;
}

function formatReadableDate(iso?: string): string {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return '';
  const dt = parseIsoDate(iso);
  return dt.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function formatMonthTitle(year: number, monthIndex: number): string {
  const dt = new Date(Date.UTC(year, monthIndex, 1, 12, 0, 0));
  return dt.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function getMonthGrid(year: number, monthIndex: number): Array<string | null> {
  const firstDayOfWeek = new Date(Date.UTC(year, monthIndex, 1, 12, 0, 0)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, monthIndex + 1, 0, 12, 0, 0)).getUTCDate();
  const cells: Array<string | null> = [];
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(toIsoUtc(year, monthIndex, d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export const DateRangeCalendarPicker: React.FC<DateRangeCalendarPickerProps> = ({
  startDate,
  endDate,
  minDate,
  maxDays = 14,
  defaultOpen = true,
  onChange,
}) => {
  const minParts = React.useMemo(() => {
    const [y, m] = minDate.split('-').map(Number);
    return { year: y, month: (m || 1) - 1 };
  }, [minDate]);

  const initialAnchor = React.useMemo(() => {
    const src = startDate && /^\d{4}-\d{2}-\d{2}$/.test(startDate) ? startDate : minDate;
    const [y, m] = src.split('-').map(Number);
    return { year: y, month: (m || 1) - 1 };
  }, [startDate, minDate]);

  const [isOpen, setIsOpen] = React.useState(defaultOpen);
  const [viewYear, setViewYear] = React.useState(initialAnchor.year);
  const [viewMonth, setViewMonth] = React.useState(initialAnchor.month);
  const [hoveredIso, setHoveredIso] = React.useState<string | null>(null);

  const isSelectingEnd = Boolean(startDate && !endDate);

  const maxAllowedEndIso = React.useMemo(() => {
    if (!startDate) return undefined;
    return addDaysIso(startDate, maxDays - 1);
  }, [startDate, maxDays]);

  const canGoPrevMonth =
    viewYear > minParts.year || (viewYear === minParts.year && viewMonth > minParts.month);

  const shiftMonth = (delta: number) => {
    const dt = new Date(Date.UTC(viewYear, viewMonth + delta, 1, 12, 0, 0));
    const nextY = dt.getUTCFullYear();
    const nextM = dt.getUTCMonth();
    if (nextY < minParts.year || (nextY === minParts.year && nextM < minParts.month)) {
      setViewYear(minParts.year);
      setViewMonth(minParts.month);
      return;
    }
    setViewYear(nextY);
    setViewMonth(nextM);
  };

  const secondMonth = React.useMemo(() => {
    const dt = new Date(Date.UTC(viewYear, viewMonth + 1, 1, 12, 0, 0));
    return { year: dt.getUTCFullYear(), month: dt.getUTCMonth() };
  }, [viewYear, viewMonth]);

  const handleDayClick = (iso: string) => {
    if (iso < minDate) return;

    // Starting a new selection (either none set, or both already set, or clicking before current start)
    if (!startDate || (startDate && endDate) || iso < startDate) {
      onChange({
        startDate: iso,
        endDate: undefined,
        duration: undefined,
      });
      setHoveredIso(null);
      return;
    }

    // Completing end date selection
    if (maxAllowedEndIso && iso > maxAllowedEndIso) return;
    const days = diffDaysInclusive(startDate, iso);
    onChange({
      startDate,
      endDate: iso,
      duration: `${days} ${days === 1 ? 'day' : 'days'}`,
    });
    setHoveredIso(null);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange({ startDate: undefined, endDate: undefined, duration: undefined });
    setHoveredIso(null);
    setIsOpen(true);
  };

  const previewEndIso =
    isSelectingEnd &&
    hoveredIso &&
    startDate &&
    hoveredIso >= startDate &&
    (!maxAllowedEndIso || hoveredIso <= maxAllowedEndIso)
      ? hoveredIso
      : endDate;

  const selectedDaysCount =
    startDate && endDate ? diffDaysInclusive(startDate, endDate) : null;
  const previewDaysCount =
    startDate && previewEndIso ? diffDaysInclusive(startDate, previewEndIso) : null;

  const renderMonth = (year: number, monthIndex: number) => {
    const grid = getMonthGrid(year, monthIndex);
    return (
      <div key={`${year}-${monthIndex}`} className="space-y-2.5">
        <div className="text-center text-sm font-black text-[var(--whisk-navy)] tracking-tight">
          {formatMonthTitle(year, monthIndex)}
        </div>
        <div className="grid grid-cols-7 gap-y-1 text-center">
          {WEEKDAY_LABELS.map((dayName) => (
            <div
              key={dayName}
              className="text-[11px] font-bold text-slate-400 py-1 select-none"
            >
              {dayName}
            </div>
          ))}
          {grid.map((iso, idx) => {
            if (!iso) {
              return <div key={`empty-${idx}`} className="h-10" />;
            }

            const dayNumber = Number(iso.slice(8, 10));
            const isPast = iso < minDate;
            const isBeyondMax = Boolean(isSelectingEnd && maxAllowedEndIso && iso > maxAllowedEndIso);
            const isDisabled = isPast || isBeyondMax;

            const isStart = Boolean(startDate && iso === startDate);
            const isEnd = Boolean(previewEndIso && iso === previewEndIso && iso !== startDate);
            const isSingleDaySelected = Boolean(startDate && endDate && startDate === endDate && iso === startDate);
            const isInRange = Boolean(
              startDate && previewEndIso && iso > startDate && iso < previewEndIso
            );
            const isToday = iso === minDate;

            let cellBg = '';
            if (isInRange) {
              cellBg = 'bg-orange-50 text-[var(--whisk-navy)] font-bold';
            } else if (isStart && previewEndIso && previewEndIso !== startDate) {
              cellBg = 'bg-orange-50 rounded-l-xl';
            } else if (isEnd) {
              cellBg = 'bg-orange-50 rounded-r-xl';
            }

            let buttonStyle =
              'text-[var(--whisk-navy)] hover:bg-slate-100 font-semibold rounded-xl';
            if (isDisabled) {
              buttonStyle = 'text-slate-300 cursor-not-allowed font-medium';
            } else if (isStart || isSingleDaySelected) {
              buttonStyle = 'vibrant-gradient text-white font-black rounded-xl shadow-sm';
            } else if (isEnd) {
              buttonStyle = isSelectingEnd
                ? 'bg-[var(--whisk-azure)]/20 text-[var(--whisk-navy)] font-black rounded-xl ring-1 ring-[var(--whisk-azure)]'
                : 'cyan-gradient text-white font-black rounded-xl shadow-sm';
            } else if (isInRange) {
              buttonStyle = 'text-[var(--whisk-navy)] hover:bg-orange-100/70 font-bold rounded-lg';
            }

            return (
              <div key={iso} className={`h-10 flex items-center justify-center ${cellBg}`}>
                <button
                  type="button"
                  disabled={isDisabled}
                  onClick={() => handleDayClick(iso)}
                  onMouseEnter={() => {
                    if (isSelectingEnd && !isDisabled) setHoveredIso(iso);
                  }}
                  onMouseLeave={() => {
                    if (isSelectingEnd) setHoveredIso(null);
                  }}
                  aria-label={`Select ${formatReadableDate(iso)}`}
                  aria-pressed={isStart || Boolean(endDate && iso === endDate)}
                  title={
                    isBeyondMax
                      ? `Maximum ${maxDays}-day trip length`
                      : formatReadableDate(iso)
                  }
                  className={`w-10 h-10 flex items-center justify-center text-xs tabular-nums transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--whisk-azure)] ${
                    isDisabled ? '' : 'cursor-pointer'
                  } ${buttonStyle} ${
                    isToday && !isStart && !isEnd ? 'ring-1 ring-[var(--whisk-azure)]' : ''
                  }`}
                >
                  {dayNumber}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {/* Selected Range Trigger Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-black uppercase tracking-[0.25em] text-slate-400">
            Travel Dates
          </span>
          {selectedDaysCount !== null ? (
            <span className="text-xs font-bold text-[var(--whisk-navy)] tabular-nums">
              · {selectedDaysCount} {selectedDaysCount === 1 ? 'day' : 'days'}
              {selectedDaysCount > 1 ? ` · ${selectedDaysCount - 1} ${selectedDaysCount - 1 === 1 ? 'night' : 'nights'}` : ''}
            </span>
          ) : isSelectingEnd && previewDaysCount !== null ? (
            <span className="text-xs font-bold text-[var(--whisk-azure)] tabular-nums">
              · {previewDaysCount} {previewDaysCount === 1 ? 'day' : 'days'} preview
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-4">
          {(startDate || endDate) && (
            <button
              type="button"
              onClick={handleClear}
              className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-[var(--whisk-terracotta)] cursor-pointer whitespace-nowrap"
            >
              <X className="w-3.5 h-3.5" />
              Clear dates
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            className="text-xs font-bold text-[var(--whisk-azure)] hover:underline cursor-pointer whitespace-nowrap"
          >
            {isOpen ? 'Hide calendar' : 'Open calendar'}
          </button>
        </div>
      </div>

      {/* Start & End Date Display Cards */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full grid sm:grid-cols-2 gap-3 p-2 bg-slate-50 border-2 rounded-3xl transition-all text-left cursor-pointer ${
          isOpen
            ? 'border-[var(--whisk-orange)] bg-white'
            : 'border-slate-100 hover:border-slate-200'
        }`}
      >
        <div
          className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl transition-colors ${
            isOpen && !startDate ? 'bg-orange-50/70 ring-1 ring-[var(--whisk-orange)]/40' : 'bg-white'
          }`}
        >
          <Calendar className="w-5 h-5 text-[var(--whisk-orange)] shrink-0" />
          <div className="min-w-0">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Start Date
            </div>
            <div
              className={`text-sm sm:text-base font-black truncate tabular-nums ${
                startDate ? 'text-[var(--whisk-navy)]' : 'text-slate-400'
              }`}
            >
              {startDate ? formatReadableDate(startDate) : 'Select departure date'}
            </div>
          </div>
        </div>

        <div
          className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl transition-colors ${
            isOpen && isSelectingEnd
              ? 'bg-sky-50/80 ring-1 ring-[var(--whisk-azure)]/50'
              : 'bg-white'
          }`}
        >
          <Calendar className="w-5 h-5 text-[var(--whisk-azure)] shrink-0" />
          <div className="min-w-0">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              End Date
            </div>
            <div
              className={`text-sm sm:text-base font-black truncate tabular-nums ${
                endDate ? 'text-[var(--whisk-navy)]' : 'text-slate-400'
              }`}
            >
              {endDate
                ? formatReadableDate(endDate)
                : isSelectingEnd
                ? 'Now pick return date'
                : 'Select return date'}
            </div>
          </div>
        </div>
      </button>

      {/* Interactive Dual-Month Calendar Grid */}
      {isOpen && (
        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              disabled={!canGoPrevMonth}
              onClick={() => shiftMonth(-1)}
              aria-label="Previous month"
              className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-[var(--whisk-navy)] hover:bg-slate-50 disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="text-xs font-bold text-slate-500 text-center">
              {!startDate
                ? 'Step 1 of 2 · Click your departure date'
                : !endDate
                ? `Step 2 of 2 · Click your return date (up to ${maxDays} days)`
                : `${formatReadableDate(startDate)} → ${formatReadableDate(endDate)}`}
            </div>

            <button
              type="button"
              onClick={() => shiftMonth(1)}
              aria-label="Next month"
              className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-[var(--whisk-navy)] hover:bg-slate-50 cursor-pointer transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
            {renderMonth(viewYear, viewMonth)}
            <div className="hidden md:block">
              {renderMonth(secondMonth.year, secondMonth.month)}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
            <span className="font-medium">
              Up to {maxDays} days per itinerary · Dates automatically sync with flights & hotels
            </span>
            {startDate && endDate && (
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 rounded-xl bg-[var(--whisk-navy)] text-white text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer whitespace-nowrap"
              >
                Done
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

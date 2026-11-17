import * as React from 'react';
import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  Droplets,
  RefreshCw,
  Sun,
  Wind,
} from 'lucide-react';

interface WeatherDay {
  date: string;
  tempMaxC: number;
  tempMinC: number;
  precipProb: number;
  windKmh: number;
  condition: string;
  icon: string;
}

interface WeatherResponse {
  locationName: string;
  country: string;
  timezone: string;
  current: {
    tempC: number;
    condition: string;
    icon: string;
  };
  days: WeatherDay[];
}

function WeatherIcon({ icon, className = 'w-7 h-7' }: { icon: string; className?: string }) {
  switch (icon) {
    case 'clear':
      return <Sun className={`${className} text-amber-500`} />;
    case 'partly-cloudy':
      return <CloudSun className={`${className} text-orange-400`} />;
    case 'cloudy':
      return <Cloud className={`${className} text-slate-400`} />;
    case 'fog':
      return <CloudFog className={`${className} text-slate-400`} />;
    case 'drizzle':
      return <CloudDrizzle className={`${className} text-sky-400`} />;
    case 'rain':
      return <CloudRain className={`${className} text-sky-500`} />;
    case 'snow':
      return <CloudSnow className={`${className} text-cyan-400`} />;
    case 'storm':
      return <CloudLightning className={`${className} text-purple-500`} />;
    default:
      return <CloudSun className={`${className} text-orange-400`} />;
  }
}

export const WeatherForecast: React.FC<{ destination: string }> = ({ destination }) => {
  const [weather, setWeather] = React.useState<WeatherResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [unit, setUnit] = React.useState<'F' | 'C'>('F');

  const fetchWeather = React.useCallback(async () => {
    if (!destination) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/weather?destination=${encodeURIComponent(destination)}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Weather forecast unavailable');
      }
      setWeather(data);
    } catch (err: any) {
      setError(err?.message || 'Unable to load 7-day forecast');
    } finally {
      setLoading(false);
    }
  }, [destination]);

  React.useEffect(() => {
    fetchWeather();
  }, [fetchWeather]);

  const formatTemp = (tempC: number) =>
    unit === 'F' ? `${Math.round((tempC * 9) / 5 + 32)}°F` : `${Math.round(tempC)}°C`;

  const formatDayLabel = (dateStr: string, index: number) => {
    if (index === 0) return 'Today';
    const d = new Date(`${dateStr}T12:00:00`);
    return d.toLocaleDateString('en-US', { weekday: 'short' });
  };

  const formatShortDate = (dateStr: string) => {
    const d = new Date(`${dateStr}T12:00:00`);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="bg-white rounded-[3.5rem] p-8 md:p-12 shadow-xl border-4 border-white space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="cyan-gradient p-3.5 rounded-2xl text-white shadow-lg">
            <Sun className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[10px] font-black text-[var(--whisk-orange)] uppercase tracking-[0.35em]">
              7-Day Forecast
            </div>
            <h3 className="text-2xl md:text-3xl font-black text-[var(--whisk-navy)] tracking-tight">
              {weather
                ? `${weather.locationName}${weather.country ? `, ${weather.country}` : ''}`
                : `${destination} Weather`}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {weather && (
            <div className="flex items-center gap-2 bg-sky-50 px-4 py-2 rounded-2xl border border-sky-100">
              <WeatherIcon icon={weather.current.icon} className="w-5 h-5" />
              <span className="font-black text-sm text-[var(--whisk-navy)]">
                {formatTemp(weather.current.tempC)}
              </span>
              <span className="text-xs font-bold text-slate-500 hidden sm:inline">
                {weather.current.condition}
              </span>
            </div>
          )}
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setUnit('F')}
              className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                unit === 'F' ? 'bg-white text-[var(--whisk-navy)] shadow-sm' : 'text-slate-400'
              }`}
            >
              °F
            </button>
            <button
              type="button"
              onClick={() => setUnit('C')}
              className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                unit === 'C' ? 'bg-white text-[var(--whisk-navy)] shadow-sm' : 'text-slate-400'
              }`}
            >
              °C
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
          {Array.from({ length: 7 }).map((_, idx) => (
            <div
              key={idx}
              className="h-36 rounded-3xl bg-slate-100 animate-pulse border border-slate-50"
            />
          ))}
        </div>
      ) : error ? (
        <div className="bg-slate-50 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 border border-slate-100">
          <p className="text-sm font-bold text-slate-500">{error}</p>
          <button
            type="button"
            onClick={fetchWeather}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-black uppercase tracking-wider text-[var(--whisk-navy)] hover:border-[var(--whisk-orange)] cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      ) : weather ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
          {weather.days.map((day, idx) => (
            <div
              key={day.date}
              className={`rounded-3xl p-4 flex flex-col items-center text-center justify-between gap-2.5 transition-all border ${
                idx === 0
                  ? 'bg-gradient-to-b from-orange-50/80 to-amber-50/50 border-orange-100 shadow-sm'
                  : 'bg-slate-50/80 border-slate-100 hover:bg-white hover:shadow-md'
              }`}
            >
              <div>
                <div className="text-xs font-black text-[var(--whisk-navy)] uppercase tracking-wider">
                  {formatDayLabel(day.date, idx)}
                </div>
                <div className="text-[10px] font-bold text-slate-400">
                  {formatShortDate(day.date)}
                </div>
              </div>

              <WeatherIcon icon={day.icon} className="w-8 h-8 my-1" />

              <div className="text-[11px] font-bold text-slate-600 leading-tight min-h-[28px] flex items-center">
                {day.condition}
              </div>

              <div className="flex items-baseline gap-1.5">
                <span className="text-sm font-black text-[var(--whisk-navy)]">
                  {formatTemp(day.tempMaxC)}
                </span>
                <span className="text-xs font-bold text-slate-400">
                  {formatTemp(day.tempMinC)}
                </span>
              </div>

              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 pt-1 border-t border-slate-200/60 w-full justify-center">
                <span className="inline-flex items-center gap-0.5 text-sky-600">
                  <Droplets className="w-3 h-3" /> {day.precipProb}%
                </span>
                <span className="inline-flex items-center gap-0.5">
                  <Wind className="w-3 h-3" /> {day.windKmh}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
};

/**
 * Weather helper for the iMessage agent.
 *
 * Returns a one-line natural-language summary the agent can fold
 * into a reply ("It's 64 and partly cloudy in San Francisco today.").
 *
 * Provider model: env-driven so the operator picks who answers.
 *   - WEATHER_PROVIDER=openweathermap (default if WEATHER_API_KEY is set)
 *   - WEATHER_PROVIDER=open-meteo     (no key required, global coverage)
 *
 * If neither WEATHER_API_KEY is set nor WEATHER_PROVIDER is forced
 * to open-meteo, the helper returns ok:false with reason:not_configured
 * so the agent falls back to a "I can't get the weather right now"
 * reply rather than fabricating a number.
 *
 * Honest-status rule: never invent a forecast. If the upstream
 * times out or 5xx's, surface the failure to the caller; they
 * decide whether to retry or fall back.
 */
import { safeWarn } from '@/lib/safeLog';

const FETCH_TIMEOUT_MS = 8_000;

export interface WeatherSuccess {
    ok: true;
    summary: string;
    temperatureF: number | null;
    condition: string | null;
    location: string;
}

export interface WeatherFailure {
    ok: false;
    reason: 'not_configured' | 'geocode_failed' | 'fetch_failed' | 'timeout' | 'no_provider';
    message: string;
}

export type WeatherResult = WeatherSuccess | WeatherFailure;

interface GeoPoint {
    lat: number;
    lon: number;
    label: string;
}

function getProvider(): 'openweathermap' | 'open-meteo' | null {
    const explicit = process.env.WEATHER_PROVIDER?.trim()?.toLowerCase();
    if (explicit === 'openweathermap' || explicit === 'open-meteo') return explicit;
    if (process.env.WEATHER_API_KEY?.trim()) return 'openweathermap';
    return null;
}

async function fetchJson(url: string, requestId?: string): Promise<unknown | null> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
        const res = await fetch(url, {
            signal: controller.signal,
            headers: { 'User-Agent': 'operatoruplift-imessage-agent/1.0' },
        });
        if (!res.ok) {
            safeWarn({
                at: 'photon.weather',
                event: 'upstream_status',
                requestId,
                status: res.status,
                url,
            });
            return null;
        }
        return await res.json();
    } catch (err) {
        const aborted = (err as { name?: string } | null)?.name === 'AbortError';
        safeWarn({
            at: 'photon.weather',
            event: aborted ? 'timeout' : 'fetch_failed',
            requestId,
            error: err instanceof Error ? err.message.slice(0, 240) : String(err).slice(0, 240),
        });
        return null;
    } finally {
        clearTimeout(timer);
    }
}

async function geocode(location: string, requestId?: string): Promise<GeoPoint | null> {
    // Open-Meteo's geocoding API is free and key-less. We use it for
    // both providers because OpenWeatherMap's geocode endpoint
    // requires the same paid key as the forecast.
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`;
    const data = await fetchJson(url, requestId) as
        | { results?: Array<{ latitude: number; longitude: number; name: string; admin1?: string; country?: string }> }
        | null;
    const hit = data?.results?.[0];
    if (!hit || typeof hit.latitude !== 'number' || typeof hit.longitude !== 'number') return null;
    const labelParts = [hit.name, hit.admin1, hit.country].filter(Boolean);
    return { lat: hit.latitude, lon: hit.longitude, label: labelParts.join(', ') };
}

interface OpenMeteoForecast {
    current?: {
        temperature_2m?: number;
        weather_code?: number;
    };
}

const WEATHER_CODE_LABELS: Record<number, string> = {
    0: 'clear',
    1: 'mainly clear',
    2: 'partly cloudy',
    3: 'overcast',
    45: 'foggy',
    48: 'foggy',
    51: 'drizzling',
    53: 'drizzling',
    55: 'drizzling',
    61: 'raining',
    63: 'raining',
    65: 'raining heavily',
    66: 'freezing rain',
    67: 'freezing rain',
    71: 'snowing',
    73: 'snowing',
    75: 'snowing heavily',
    77: 'snowy',
    80: 'showers',
    81: 'showers',
    82: 'heavy showers',
    85: 'snow showers',
    86: 'heavy snow showers',
    95: 'thunderstorms',
    96: 'thunderstorms with hail',
    99: 'severe thunderstorms',
};

async function fetchOpenMeteo(point: GeoPoint, requestId?: string): Promise<WeatherResult> {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${point.lat}&longitude=${point.lon}&current=temperature_2m,weather_code&temperature_unit=fahrenheit`;
    const data = await fetchJson(url, requestId) as OpenMeteoForecast | null;
    if (!data?.current) {
        return { ok: false, reason: 'fetch_failed', message: 'open-meteo returned no current block' };
    }
    const tempF = typeof data.current.temperature_2m === 'number' ? Math.round(data.current.temperature_2m) : null;
    const code = data.current.weather_code ?? null;
    const condition = code !== null ? (WEATHER_CODE_LABELS[code] ?? null) : null;
    const tempPart = tempF !== null ? `${tempF}\u00B0F` : 'temperature unavailable';
    const condPart = condition ?? 'condition unavailable';
    return {
        ok: true,
        summary: `${tempPart} and ${condPart} in ${point.label}.`,
        temperatureF: tempF,
        condition,
        location: point.label,
    };
}

async function fetchOpenWeatherMap(point: GeoPoint, apiKey: string, requestId?: string): Promise<WeatherResult> {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${point.lat}&lon=${point.lon}&appid=${apiKey}&units=imperial`;
    const data = await fetchJson(url, requestId) as
        | { main?: { temp?: number }; weather?: Array<{ description?: string }> }
        | null;
    if (!data) return { ok: false, reason: 'fetch_failed', message: 'openweathermap returned no body' };
    const tempF = typeof data.main?.temp === 'number' ? Math.round(data.main.temp) : null;
    const condition = data.weather?.[0]?.description ?? null;
    const tempPart = tempF !== null ? `${tempF}\u00B0F` : 'temperature unavailable';
    const condPart = condition ?? 'condition unavailable';
    return {
        ok: true,
        summary: `${tempPart} and ${condPart} in ${point.label}.`,
        temperatureF: tempF,
        condition,
        location: point.label,
    };
}

/**
 * Returns a one-line weather summary for `location`, or a typed
 * failure result. Caller is responsible for deciding whether to
 * surface the reason to the user (the agent typically wraps a
 * not_configured into "I can't fetch the weather right now").
 */
export async function getWeather(location: string, requestId?: string): Promise<WeatherResult> {
    const trimmed = location.trim();
    if (!trimmed) return { ok: false, reason: 'geocode_failed', message: 'empty location' };

    const provider = getProvider();
    if (!provider) {
        return {
            ok: false,
            reason: 'not_configured',
            message: 'Set WEATHER_PROVIDER=open-meteo for keyless lookups, or WEATHER_API_KEY for OpenWeatherMap.',
        };
    }

    const point = await geocode(trimmed, requestId);
    if (!point) return { ok: false, reason: 'geocode_failed', message: `could not geocode "${trimmed}"` };

    if (provider === 'open-meteo') {
        return await fetchOpenMeteo(point, requestId);
    }
    const apiKey = process.env.WEATHER_API_KEY?.trim();
    if (!apiKey) return { ok: false, reason: 'not_configured', message: 'WEATHER_API_KEY missing' };
    return await fetchOpenWeatherMap(point, apiKey, requestId);
}

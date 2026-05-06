import { test, expect } from '@playwright/test';
import { getWeather } from '@/lib/photon/weather';

/**
 * Hermetic test for the not_configured path. The success path
 * exercises real fetch calls (open-meteo geocoder + forecast)
 * which would make CI flaky against external uptime, so we cover
 * it in a separate live-network suite when needed.
 */

test.describe.configure({ mode: 'serial' });

const ORIG_PROVIDER = process.env.WEATHER_PROVIDER;
const ORIG_API_KEY = process.env.WEATHER_API_KEY;

function clearEnv() {
    delete process.env.WEATHER_PROVIDER;
    delete process.env.WEATHER_API_KEY;
}

function restoreEnv() {
    if (ORIG_PROVIDER === undefined) delete process.env.WEATHER_PROVIDER;
    else process.env.WEATHER_PROVIDER = ORIG_PROVIDER;
    if (ORIG_API_KEY === undefined) delete process.env.WEATHER_API_KEY;
    else process.env.WEATHER_API_KEY = ORIG_API_KEY;
}

test.beforeEach(() => clearEnv());
test.afterEach(() => restoreEnv());

test('returns not_configured when neither WEATHER_PROVIDER nor WEATHER_API_KEY is set', async () => {
    const r = await getWeather('San Francisco');
    expect(r.ok).toBe(false);
    if (!r.ok) {
        expect(r.reason).toBe('not_configured');
        expect(r.message).toContain('WEATHER_PROVIDER');
    }
});

test('returns geocode_failed for an empty location', async () => {
    process.env.WEATHER_PROVIDER = 'open-meteo';
    const r = await getWeather('   ');
    expect(r.ok).toBe(false);
    if (!r.ok) {
        expect(r.reason).toBe('geocode_failed');
    }
});

test('explicit WEATHER_PROVIDER=open-meteo selects the keyless provider', async () => {
    // We can't fully exercise the network path in CI, but we can
    // assert the provider is selected (any failure now should be
    // geocode_failed or fetch_failed, not not_configured).
    process.env.WEATHER_PROVIDER = 'open-meteo';
    const r = await getWeather('a-location-that-definitely-does-not-exist-zzz');
    expect(r.ok).toBe(false);
    if (!r.ok) {
        expect(['geocode_failed', 'fetch_failed', 'timeout']).toContain(r.reason);
    }
});

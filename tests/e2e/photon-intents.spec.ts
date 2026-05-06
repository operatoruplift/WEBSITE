import { test, expect } from '@playwright/test';
import { classifyIntent } from '@/lib/photon/intents';

/**
 * Pure-function tests for the intent classifier. Hermetic: no
 * Supabase, no network, no LLM. Pin each typed intent path plus
 * the conservative-fallback behavior for ambiguous text.
 */

test('detects "I\'m a leo" as set_zodiac', () => {
    const r = classifyIntent("I'm a leo");
    expect(r.intent).toBe('set_zodiac');
    if (r.intent === 'set_zodiac') expect(r.sign).toBe('leo');
});

test('detects "set my sign to virgo" as set_zodiac', () => {
    const r = classifyIntent('set my sign to virgo');
    expect(r.intent).toBe('set_zodiac');
    if (r.intent === 'set_zodiac') expect(r.sign).toBe('virgo');
});

test('detects "make me a libra" as set_zodiac', () => {
    const r = classifyIntent('make me a libra please');
    expect(r.intent).toBe('set_zodiac');
});

test('rejects fake signs in zodiac patterns', () => {
    expect(classifyIntent("I'm a wizard").intent).toBe('chat');
    expect(classifyIntent('set my sign to dragon').intent).toBe('chat');
});

test('detects "I\'m in San Francisco" as set_location', () => {
    const r = classifyIntent("I'm in San Francisco");
    expect(r.intent).toBe('set_location');
    if (r.intent === 'set_location') expect(r.location).toBe('San Francisco');
});

test('detects "my location is Austin" as set_location', () => {
    const r = classifyIntent('my location is Austin TX');
    expect(r.intent).toBe('set_location');
});

test('detects "set location to Tokyo" as set_location', () => {
    const r = classifyIntent('set location to Tokyo');
    expect(r.intent).toBe('set_location');
});

test('rejects locations that look like phone numbers', () => {
    const r = classifyIntent("I'm in 510 some place");
    expect(r.intent).toBe('chat');
});

test('detects "switch to sonnet" and resolves the alias', () => {
    const r = classifyIntent('switch to sonnet');
    expect(r.intent).toBe('set_model');
    if (r.intent === 'set_model') expect(r.model).toBe('claude-sonnet-4-6');
});

test('detects "use gpt-5.5" and resolves the alias', () => {
    const r = classifyIntent('use gpt-5.5');
    expect(r.intent).toBe('set_model');
    if (r.intent === 'set_model') expect(r.model).toBe('gpt-5.5');
});

test('detects raw vendor-prefix model ids', () => {
    const r = classifyIntent('switch to claude-haiku-4-5-20251001');
    expect(r.intent).toBe('set_model');
});

test('detects weather queries with location', () => {
    const r = classifyIntent("what's the weather in San Francisco");
    expect(r.intent).toBe('weather');
    if (r.intent === 'weather') expect(r.location).toBe('San Francisco');
});

test('detects weather queries without location (nullable location)', () => {
    const r = classifyIntent('what is the weather like');
    expect(r.intent).toBe('weather');
    if (r.intent === 'weather') expect(r.location).toBeNull();
});

test('detects forecast / temperature / raining as weather', () => {
    expect(classifyIntent('forecast for tomorrow').intent).toBe('weather');
    expect(classifyIntent('temp in Tokyo').intent).toBe('weather');
    expect(classifyIntent('is it raining outside').intent).toBe('weather');
});

test('rejects figurative weather usages', () => {
    expect(classifyIntent('weather permitting we should ship Friday').intent).toBe('chat');
});

test('chat fallback for ambiguous text', () => {
    expect(classifyIntent('hey what are you up to').intent).toBe('chat');
    expect(classifyIntent('').intent).toBe('chat');
    expect(classifyIntent(null).intent).toBe('chat');
    expect(classifyIntent(undefined).intent).toBe('chat');
});

test('zodiac wins over weather when both could match', () => {
    // "I'm a Leo and the weather is nice" should be set_zodiac
    const r = classifyIntent("I'm a Leo and the weather is nice");
    expect(r.intent).toBe('set_zodiac');
});

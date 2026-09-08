import { describe, expect, test } from 'bun:test';
import { actionForKey } from '../src/shortcuts';

const key = (value: string, overrides = {}) => ({ key: value, metaKey: false, ctrlKey: false, altKey: false, shiftKey: false, isComposing: false, repeat: false, ...overrides });
describe('Honu shortcuts', () => {
  test('C wipes only outside text input and without modifiers', () => {
    expect(actionForKey(key('c'), false)).toBe('clear');
    expect(actionForKey(key('c'), true)).toBeNull();
    for (const modifier of ['metaKey', 'ctrlKey', 'altKey', 'shiftKey', 'repeat']) {
      expect(actionForKey(key('c', { [modifier]: true }), false)).toBeNull();
    }
  });
  test('Escape wipes and hides even during text editing', () => {
    expect(actionForKey(key('Escape'), true)).toBe('dismiss');
  });
  test('IME composition is never interrupted', () => {
    expect(actionForKey(key('Escape', { isComposing: true }), true)).toBeNull();
  });
  test('Quit works with either command modifier while editing', () => {
    for (const modifier of ['ctrlKey', 'metaKey']) {
      expect(actionForKey(key('q', { [modifier]: true }), true)).toBe('quit');
    }
  });
  test('save, export and open cannot bypass the file-free HUD', () => {
    for (const value of ['s', 'o']) {
      expect(actionForKey(key(value, { metaKey: true }), false)).toBe('block-file-action');
      expect(actionForKey(key(value, { ctrlKey: true, shiftKey: true }), false)).toBe('block-file-action');
    }
  });
  test('Excalidraw tools and undo still receive their shortcuts', () => {
    expect(actionForKey(key('p'), false)).toBeNull();
    expect(actionForKey(key('z', { metaKey: true }), false)).toBeNull();
  });
});

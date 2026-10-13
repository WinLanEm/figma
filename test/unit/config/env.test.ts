import { describe, expect, it } from 'vitest';
import { EnvError, readFigmaAccessToken } from '../../../src/config/env.js';

describe('readFigmaAccessToken', () => {
  it('возвращает токен, если он задан', () => {
    const token = readFigmaAccessToken({ FIGMA_ACCESS_TOKEN: 'abc123' });
    expect(token).toBe('abc123');
  });

  it('обрезает пробелы по краям', () => {
    const token = readFigmaAccessToken({ FIGMA_ACCESS_TOKEN: '  abc123  ' });
    expect(token).toBe('abc123');
  });

  it('падает с EnvError, если токен не задан', () => {
    expect(() => readFigmaAccessToken({})).toThrow(EnvError);
  });

  it('падает с EnvError, если токен пустой', () => {
    expect(() => readFigmaAccessToken({ FIGMA_ACCESS_TOKEN: '   ' })).toThrow(EnvError);
  });
});

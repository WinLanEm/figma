import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ConfigFileError, readConfigFile } from '../../../src/config/config-file.js';

describe('readConfigFile', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'iconsync-test-'));
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  async function writeConfig(content: unknown): Promise<string> {
    const path = join(dir, 'iconsync.config.json');
    await writeFile(path, JSON.stringify(content), 'utf8');
    return path;
  }

  it('читает корректный конфиг с fileKey', async () => {
    const path = await writeConfig({
      source: { fileKey: 'abc123' },
      outputDir: 'src/assets/icons',
      discovery: { pageNames: ['Icons'], namePrefixes: ['Icon/'] },
    });

    const config = await readConfigFile(path);
    expect(config.source).toEqual({ fileKey: 'abc123' });
    expect(config.outputDir).toBe('src/assets/icons');
    expect(config.discovery?.pageNames).toEqual(['Icons']);
  });

  it('читает корректный конфиг без discovery', async () => {
    const path = await writeConfig({
      source: { url: 'https://www.figma.com/design/abc/Test?node-id=1-7' },
      outputDir: 'icons',
    });

    const config = await readConfigFile(path);
    expect(config.source).toEqual({
      url: 'https://www.figma.com/design/abc/Test?node-id=1-7',
    });
    expect(config.discovery).toBeUndefined();
  });

  it('падает, если файл не найден', async () => {
    await expect(readConfigFile(join(dir, 'nope.json'))).rejects.toThrow(ConfigFileError);
  });

  it('падает, если JSON битый', async () => {
    const path = join(dir, 'bad.json');
    await writeFile(path, '{ not json', 'utf8');
    await expect(readConfigFile(path)).rejects.toThrow(ConfigFileError);
  });

  it('падает, если схема не подходит', async () => {
    const path = await writeConfig({
      source: { fileKey: '', url: 'https://x' },
      outputDir: '',
    });
    await expect(readConfigFile(path)).rejects.toThrow(ConfigFileError);
  });
});

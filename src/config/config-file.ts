import { readFile } from 'node:fs/promises';
import { z } from 'zod';

const sourceSchema = z.union([
  z.object({ fileKey: z.string().min(1) }),
  z.object({ url: z.url() }),
  z.object({ libraryKey: z.string().min(1) }),
]);

const discoverySchema = z.object({
  pageNames: z.array(z.string()).optional(),
  namePrefixes: z.array(z.string()).optional(),
});

const configSchema = z.object({
  source: sourceSchema,
  outputDir: z.string().min(1),
  discovery: discoverySchema.optional(),
});

export type IconSyncConfig = z.infer<typeof configSchema>;

export class ConfigFileError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigFileError';
  }
}

export async function readConfigFile(path: string): Promise<IconSyncConfig> {
  let raw: string;
  try {
    raw = await readFile(path, 'utf8');
  } catch {
    throw new ConfigFileError(`Не удалось прочитать конфиг: ${path}`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new ConfigFileError(`Конфиг ${path} не является валидным JSON`);
  }

  const result = configSchema.safeParse(parsed);
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');
    throw new ConfigFileError(`Конфиг ${path} не прошёл валидацию: ${issues}`);
  }

  return result.data;
}

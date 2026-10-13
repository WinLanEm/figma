const FIGMA_ACCESS_TOKEN_KEY = 'FIGMA_ACCESS_TOKEN';

export class EnvError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EnvError';
  }
}

export function readFigmaAccessToken(env: NodeJS.ProcessEnv = process.env): string {
  const token = env[FIGMA_ACCESS_TOKEN_KEY];

  if (token === undefined || token.trim() === '') {
    throw new EnvError(`Не задан ${FIGMA_ACCESS_TOKEN_KEY}. `);
  }

  return token.trim();
}

import { describe, expect, it } from 'vitest';

import { createProgram } from '../../src/cli/create-program.js';

describe('createProgram', () => {
  it('creates the iconsync CLI', () => {
    const program = createProgram();

    expect(program.name()).toBe('iconsync');
  });
});

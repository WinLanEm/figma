import { Command } from 'commander';

export function createProgram(): Command {
  return new Command()
    .name('iconsync')
    .description('Synchronize SVG icons from Figma')
    .version('0.1.0')
    .showHelpAfterError();
}

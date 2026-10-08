import { createProgram } from './create-program.js';

const program = createProgram();

if (process.argv.length === 2) {
  program.outputHelp();
} else {
  await program.parseAsync(process.argv);
}

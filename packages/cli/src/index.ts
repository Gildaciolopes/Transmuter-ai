#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import { doctorCommand } from './commands/doctor';
import { initCommand } from './commands/init';
import { migrateCommand } from './commands/migrate';
import { statusCommand } from './commands/status';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { version } = require('../package.json') as { version: string };

const program = new Command();

program
  .name('transmuter')
  .description('Migrate Java Spring Boot projects to TypeScript/NestJS')
  .version(version);

program
  .command('doctor')
  .description('Check environment requirements (Java, JAR, config)')
  .action(() => {
    console.log(chalk.bold('\n  transmuter doctor\n'));
    doctorCommand();
  });

program
  .command('init')
  .description('Initialize .transmuter.json config interactively')
  .action(async () => {
    console.log(chalk.bold('\n  transmuter init\n'));
    await initCommand();
    console.log('');
  });

program
  .command('migrate')
  .description('Migrate Java project to TypeScript/NestJS')
  .option('--dry-run', 'Preview files without writing', false)
  .option('--layer <layers>', 'Comma-separated layers to migrate (entities,services,controllers,dtos,enums)')
  .action(async (opts) => {
    console.log(chalk.bold('\n  transmuter migrate\n'));
    await migrateCommand({ dryRun: opts.dryRun, layer: opts.layer });
    console.log('');
  });

program
  .command('status')
  .description('Show migration status and last report summary')
  .action(() => {
    console.log(chalk.bold('\n  transmuter status\n'));
    statusCommand();
    console.log('');
  });

program.parse(process.argv);

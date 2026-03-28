import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import { input, confirm, checkbox } from '@inquirer/prompts';
import { saveConfig, configExists, CONFIG_FILENAME } from '../config/loader';
import { TransmuterConfigSchema, type TransmuterConfig } from '../config/schema';

const DEFAULT_SOURCE = './src/main/java';

function detectSourceDir(): string {
  if (fs.existsSync(path.join(process.cwd(), DEFAULT_SOURCE))) {
    return DEFAULT_SOURCE;
  }
  return './src';
}

export async function initCommand(): Promise<void> {
  if (configExists()) {
    const overwrite = await confirm({
      message: `${CONFIG_FILENAME} already exists. Overwrite?`,
      default: false,
    });
    if (!overwrite) {
      console.log(chalk.dim('Cancelled.'));
      return;
    }
  }

  const detected = detectSourceDir();
  const source = await input({
    message: 'Source directory (Java files):',
    default: detected,
  });

  const output = await input({
    message: 'Output directory:',
    default: './transmuter-output',
  });

  const packageRoot = await input({
    message: 'Package root (e.g. com.example.app) — leave blank to auto-detect:',
    default: '',
  });

  const selectedLayers = await checkbox({
    message: 'Layers to migrate:',
    choices: [
      { name: 'Entities (→ Zod schemas + Prisma models)', value: 'entities', checked: true },
      { name: 'Services (→ NestJS @Injectable services)', value: 'services', checked: true },
      { name: 'Controllers (→ NestJS @Controller)', value: 'controllers', checked: true },
      { name: 'DTOs (→ TypeScript interfaces + Zod)', value: 'dtos', checked: true },
      { name: 'Enums (→ TypeScript enums)', value: 'enums', checked: true },
    ],
  });

  const config: TransmuterConfig = TransmuterConfigSchema.parse({
    version: '1',
    source,
    output,
    packageRoot: packageRoot || undefined,
    layers: {
      entities: selectedLayers.includes('entities'),
      services: selectedLayers.includes('services'),
      controllers: selectedLayers.includes('controllers'),
      dtos: selectedLayers.includes('dtos'),
      enums: selectedLayers.includes('enums'),
    },
    prismaOutput: `${output}/schema.prisma`,
    nestjsModuleStyle: 'feature-modules',
    dryRun: false,
  });

  saveConfig(config);
  console.log('');
  console.log(chalk.green(`  ✓ ${CONFIG_FILENAME} created`));
  console.log(chalk.dim('  Run "transmuter doctor" to verify, then "transmuter migrate".'));
}

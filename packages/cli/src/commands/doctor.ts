import * as path from 'path';
import * as fs from 'fs';
import chalk from 'chalk';
import { checkJava } from '../engine/jar-runner';
import { configExists, CONFIG_FILENAME } from '../config/loader';
import { loadConfig } from '../config/loader';
import { TransmuterConfigSchema } from '../config/schema';

const JAR_PATH = path.join(__dirname, '..', '..', 'bin', 'parser-java.jar');

export function doctorCommand(): void {
  let allOk = true;

  // 1. Java version
  const java = checkJava();
  if (java.ok) {
    console.log(chalk.green(`  ✓ Java ${java.version ?? 'detected'}`));
  } else {
    console.log(chalk.red(`  ✗ ${java.error}`));
    allOk = false;
  }

  // 2. Embedded JAR
  if (fs.existsSync(JAR_PATH)) {
    console.log(chalk.green(`  ✓ Parser JAR found`));
  } else {
    console.log(chalk.red(`  ✗ Parser JAR not found at ${JAR_PATH}`));
    console.log(chalk.dim('    Build it: cd packages/parser-java && mvn package -q'));
    allOk = false;
  }

  // 3. Config file
  if (configExists()) {
    try {
      loadConfig();
      console.log(chalk.green(`  ✓ ${CONFIG_FILENAME} valid`));
    } catch (err) {
      console.log(chalk.red(`  ✗ ${CONFIG_FILENAME} invalid: ${(err as Error).message}`));
      allOk = false;
    }
  } else {
    console.log(chalk.yellow(`  ⚠ ${CONFIG_FILENAME} not found — run "transmuter init" to configure`));
  }

  console.log('');
  if (allOk) {
    console.log(chalk.green('Everything looks good! Run "transmuter migrate" to start.'));
  } else {
    console.log(chalk.red('Fix the issues above before running "transmuter migrate".'));
    process.exit(1);
  }
}

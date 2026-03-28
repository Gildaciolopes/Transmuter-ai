import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import { loadConfig, configExists } from '../config/loader';

export function statusCommand(): void {
  if (!configExists()) {
    console.log(chalk.yellow('  No .transmuter.json found. Run "transmuter init" to get started.'));
    return;
  }

  const config = loadConfig();

  console.log(chalk.bold('Project configuration:'));
  console.log(`  Source:  ${chalk.cyan(config.source)}`);
  console.log(`  Output:  ${chalk.cyan(config.output)}`);
  console.log(`  Layers:  ${Object.entries(config.layers).filter(([, v]) => v).map(([k]) => k).join(', ')}`);
  console.log('');

  // Check if output dir exists
  const outputExists = fs.existsSync(config.output);
  if (!outputExists) {
    console.log(chalk.dim('  No migration has been run yet.'));
    return;
  }

  // Check for report
  const reportPath = path.join(config.output, 'migration-report.md');
  if (fs.existsSync(reportPath)) {
    const stat = fs.statSync(reportPath);
    console.log(chalk.bold('Last migration:'));
    console.log(`  ${chalk.dim(stat.mtime.toLocaleString())}`);
    console.log('');

    // Count generated files
    const fileCount = countFiles(config.output);
    console.log(`  ${fileCount} files in output directory`);
    console.log(chalk.dim(`  Full report: ${reportPath}`));
  } else {
    console.log(chalk.dim('  Output directory exists but no report found.'));
  }
}

function countFiles(dir: string): number {
  let count = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      count += countFiles(path.join(dir, entry.name));
    } else {
      count++;
    }
  }
  return count;
}

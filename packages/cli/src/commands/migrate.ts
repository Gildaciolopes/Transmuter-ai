import chalk from 'chalk';
import ora from 'ora';
import { loadConfig, configExists } from '../config/loader';
import { scanJavaFiles } from '../engine/file-scanner';
import { startJar, checkJava } from '../engine/jar-runner';
import { parseProject, generateProject } from '../engine/project-runner';
import { writeGeneratedFiles, ensureOutputDir } from '../engine/output-writer';
import { writeReport } from '../report/reporter';

export interface MigrateOptions {
  dryRun?: boolean;
  layer?: string;
}

export async function migrateCommand(options: MigrateOptions = {}): Promise<void> {
  // Check Java before anything else
  const java = checkJava();
  if (!java.ok) {
    console.error(chalk.red(`✗ ${java.error}`));
    console.error(chalk.dim('  Install Java 17+ and ensure it is in your PATH'));
    process.exit(1);
  }

  if (!configExists()) {
    console.error(chalk.red('✗ No .transmuter.json found.'));
    console.error(chalk.dim('  Run "transmuter init" to configure your project first.'));
    process.exit(1);
  }

  const config = loadConfig();
  const dryRun = options.dryRun ?? config.dryRun;

  console.log('');
  if (dryRun) {
    console.log(chalk.yellow('  DRY RUN — no files will be written'));
    console.log('');
  }

  // 1. Scan Java files
  const scanSpinner = ora('Scanning Java files...').start();
  let javaFiles;
  try {
    javaFiles = await scanJavaFiles(config.source);
    scanSpinner.succeed(`Found ${chalk.bold(javaFiles.length)} Java files`);
  } catch (err) {
    scanSpinner.fail(`Scan failed: ${(err as Error).message}`);
    process.exit(1);
  }

  if (javaFiles.length === 0) {
    console.log(chalk.yellow(`  No .java files found in ${config.source}`));
    process.exit(0);
  }

  // 2. Start JAR
  const jarSpinner = ora('Starting parser...').start();
  let jarHandle;
  try {
    jarHandle = await startJar();
    jarSpinner.succeed(`Parser ready on port ${jarHandle.port}`);
  } catch (err) {
    jarSpinner.fail(`Failed to start parser: ${(err as Error).message}`);
    process.exit(1);
  }

  // 3. Parse project
  const parseSpinner = ora('Parsing Java project...').start();
  let projectResponse;
  try {
    projectResponse = await parseProject(jarHandle.baseUrl, javaFiles);
    const total = projectResponse.classes.length + projectResponse.enums.length;
    const entities = projectResponse.classes.filter((c) => c.isEntity).length;
    const services = projectResponse.classes.filter((c) => c.stereotype === 'service').length;
    const controllers = projectResponse.classes.filter((c) => c.stereotype === 'controller').length;
    const dtos = projectResponse.classes.filter((c) => c.stereotype === 'dto').length;
    const enums = projectResponse.enums.length;
    parseSpinner.succeed(
      `Parsed ${chalk.bold(total)} classes — ` +
        `${entities} entities, ${services} services, ${controllers} controllers, ` +
        `${dtos} DTOs, ${enums} enums`,
    );
  } catch (err) {
    parseSpinner.fail(`Parse failed: ${(err as Error).message}`);
    jarHandle.shutdown();
    process.exit(1);
  } finally {
    jarHandle.shutdown();
  }

  // 4. Generate
  const genSpinner = ora('Generating TypeScript files...').start();
  let result;
  try {
    result = generateProject(projectResponse);
    genSpinner.succeed(`Generated ${chalk.bold(result.files.length)} files`);
  } catch (err) {
    genSpinner.fail(`Generation failed: ${(err as Error).message}`);
    process.exit(1);
  }

  if (dryRun) {
    console.log('');
    console.log(chalk.bold('Files that would be written:'));
    console.log('');
    for (const file of result.files) {
      console.log(`  ${chalk.cyan(file.path)}  ${chalk.dim(`(${file.type})`)}`);
    }
    console.log('');
    console.log(chalk.bold('Migration summary:'));
    console.log(`  Total classes: ${result.report.totalClasses}`);
    console.log(`  Would convert: ${chalk.green(result.report.converted)}`);
    console.log(`  Flagged:       ${result.report.flagged > 0 ? chalk.yellow(result.report.flagged) : chalk.green(result.report.flagged)}`);
    return;
  }

  // 5. Write files
  const writeSpinner = ora('Writing files...').start();
  try {
    ensureOutputDir(config.output);
    writeGeneratedFiles(result.files, config.output);
    writeSpinner.succeed(`Written to ${chalk.bold(config.output)}`);
  } catch (err) {
    writeSpinner.fail(`Write failed: ${(err as Error).message}`);
    process.exit(1);
  }

  // 6. Report
  const reportPath = writeReport(result.report, config.output);

  // 7. Summary
  console.log('');
  console.log(chalk.green.bold('  Migration complete!'));
  console.log('');
  console.log(`  ${chalk.bold(result.report.converted)} classes converted`);
  if (result.report.flagged > 0) {
    console.log(`  ${chalk.yellow(result.report.flagged)} items flagged for manual review`);
    console.log(chalk.dim(`  → See ${reportPath}`));
  }
  console.log('');
}

#!/usr/bin/env node
/**
 * Development Monitor Script
 * Monitors development server output and provides helpful feedback
 */

const { spawn } = require('child_process');
const path = require('path');

// ANSI color codes for better console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  bright: '\x1b[1m'
};

function log(level, service, message) {
  const timestamp = new Date().toLocaleTimeString();
  const serviceColor = {
    'web': colors.green,
    'api': colors.blue,
    'ui': colors.magenta,
    'config': colors.cyan,
    'shared-types': colors.yellow
  }[service] || colors.reset;
  
  const levelColor = {
    'INFO': colors.green,
    'WARN': colors.yellow,
    'ERROR': colors.red,
    'SUCCESS': colors.bright + colors.green
  }[level] || colors.reset;
  
  console.log(`${colors.bright}[${timestamp}]${colors.reset} ${levelColor}${level}${colors.reset} ${serviceColor}[${service}]${colors.reset} ${message}`);
}

function parseOutput(data, service) {
  const lines = data.toString().split('\n').filter(line => line.trim());
  
  for (const line of lines) {
    // Parse common patterns
    if (line.includes('error TS')) {
      const match = line.match(/error TS(\d+): (.+)/);
      if (match) {
        log('ERROR', service, `TypeScript Error TS${match[1]}: ${match[2]}`);
      } else {
        log('ERROR', service, line);
      }
    } else if (line.includes('- Ready in')) {
      log('SUCCESS', service, line);
    } else if (line.includes('- Local:') || line.includes('- Network:')) {
      log('SUCCESS', service, line);
    } else if (line.includes('Starting compilation')) {
      log('INFO', service, 'Starting compilation...');
    } else if (line.includes('Found 0 errors')) {
      log('SUCCESS', service, 'Compilation successful ✅');
    } else if (line.match(/Found \d+ error/)) {
      const match = line.match(/Found (\d+) error/);
      log('ERROR', service, `Found ${match[1]} compilation error(s) ❌`);
    } else if (line.includes('WARN') || line.includes('warning')) {
      log('WARN', service, line);
    } else if (line.length > 10 && !line.includes('cache bypass')) { // Filter out noise
      log('INFO', service, line);
    }
  }
}

console.log(`${colors.bright}${colors.blue}🚀 Production Tool 2.0 Development Monitor${colors.reset}\n`);

// Start the development server
const devProcess = spawn('pnpm', ['dev'], {
  cwd: process.cwd(),
  stdio: ['inherit', 'pipe', 'pipe']
});

devProcess.stdout.on('data', (data) => {
  const output = data.toString();
  
  // Parse which service the output is from
  if (output.includes('web:dev:')) {
    parseOutput(output.replace(/web:dev:\s*/g, ''), 'web');
  } else if (output.includes('api:dev:')) {
    parseOutput(output.replace(/api:dev:\s*/g, ''), 'api');
  } else if (output.includes('ui:dev:')) {
    parseOutput(output.replace(/ui:dev:\s*/g, ''), 'ui');
  } else if (output.includes('config:dev:')) {
    parseOutput(output.replace(/config:dev:\s*/g, ''), 'config');
  } else if (output.includes('shared-types:dev:')) {
    parseOutput(output.replace(/shared-types:dev:\s*/g, ''), 'shared-types');
  } else {
    // General output
    parseOutput(output, 'system');
  }
});

devProcess.stderr.on('data', (data) => {
  parseOutput(data, 'system');
});

devProcess.on('close', (code) => {
  if (code === 0) {
    log('SUCCESS', 'system', 'Development server stopped successfully');
  } else {
    log('ERROR', 'system', `Development server exited with code ${code}`);
  }
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log(`\n${colors.yellow}📝 Shutting down development server...${colors.reset}`);
  devProcess.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  devProcess.kill('SIGTERM');
  process.exit(0);
});
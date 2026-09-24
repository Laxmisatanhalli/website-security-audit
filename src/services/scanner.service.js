const path = require('path');
const { spawn } = require('child_process');
const { getSettings } = require('./settings.service');

const SCANNER_DIR = path.join(__dirname, '..', '..', 'scanner');
const SCANNER_ENTRY = 'scanner.py';
const PYTHON_BIN = process.env.PYTHON_BIN || 'python3';

function runScanner(url) {
  return new Promise((resolve, reject) => {
    const child = spawn(PYTHON_BIN, [SCANNER_ENTRY, url], { cwd: SCANNER_DIR });

    const timeoutSeconds = getSettings().scanTimeoutSeconds;
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill();
    }, timeoutSeconds * 1000);

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });

    child.on('error', (err) => {
      clearTimeout(timer);
      reject(new Error(`Failed to start scanner process: ${err.message}`));
    });

    child.on('close', (code) => {
      clearTimeout(timer);

      if (timedOut) {
        return reject(new Error(`Scan timed out after ${timeoutSeconds} seconds`));
      }
      if (code !== 0 && !stdout) {
        return reject(new Error(`Scanner exited with code ${code}: ${stderr || 'no output'}`));
      }

      try {
        const parsed = JSON.parse(stdout);

        if (Array.isArray(parsed)) return resolve(parsed);
        if (parsed && parsed.error) return reject(new Error(parsed.error));
        return resolve(parsed.results || []);
      } catch (err) {
        return reject(new Error(`Unable to parse scanner output: ${err.message}. Raw output: ${stdout}`));
      }
    });
  });
}

module.exports = { runScanner };
const path = require('path');
const { spawn } = require('child_process');

const SCANNER_DIR = path.join(__dirname, '..', '..', 'scanner');
const SCANNER_ENTRY = 'scanner.py';
const PYTHON_BIN = process.env.PYTHON_BIN || 'python3';

function runScanner(url) {
  return new Promise((resolve, reject) => {
    const child = spawn(PYTHON_BIN, [SCANNER_ENTRY, url], { cwd: SCANNER_DIR });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += chunk;
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });

    child.on('error', (err) => {
      reject(new Error(`Failed to start scanner process: ${err.message}`));
    });

    child.on('close', (code) => {
      if (code !== 0 && !stdout) {
        return reject(new Error(`Scanner exited with code ${code}: ${stderr || 'no output'}`));
      }

      try {
        const parsed = JSON.parse(stdout);

        if (Array.isArray(parsed)) {
          return resolve(parsed);
        }

        if (parsed && parsed.error) {
          return reject(new Error(parsed.error));
        }

        return resolve(parsed.results || []);
      } catch (err) {
        return reject(new Error(`Unable to parse scanner output: ${err.message}. Raw output: ${stdout}`));
      }
    });
  });
}

module.exports = { runScanner };
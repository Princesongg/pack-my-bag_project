import { spawn } from 'node:child_process';
import { resolve } from 'node:path';

// Isolated QA profiles only; component downloads are unnecessary for app tests.
export function launchQaBrowser({ port, profile }) {
  if (!Number.isInteger(port) || !/^[a-zA-Z0-9_-]+$/.test(profile)) throw new Error('Invalid QA browser configuration');
  return spawn(process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe', [
    '--headless', '--disable-gpu', '--no-sandbox', '--no-first-run', '--no-default-browser-check',
    '--disable-component-update', '--disable-background-networking', '--disable-sync', '--disable-default-apps',
    `--remote-debugging-port=${port}`, `--user-data-dir=${resolve('node_modules/.cache', profile)}`, 'about:blank',
  ], { stdio: 'ignore', windowsHide: true });
}

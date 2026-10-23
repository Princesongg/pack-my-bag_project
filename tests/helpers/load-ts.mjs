import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import ts from 'typescript';

const cache = new Map();
function moduleUrl(file) {
  file = resolve(file);
  if (cache.has(file)) return cache.get(file);
  let code = ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
  code = code.replace(/from\s+(['"])(\.[^'"]+)\1/g, (_, quote, specifier) => {
    let dependency = resolve(dirname(file), specifier);
    if (!existsSync(dependency)) dependency += '.ts';
    return `from ${JSON.stringify(moduleUrl(dependency))}`;
  });
  const url = `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`;
  cache.set(file, url);
  return url;
}
export function loadTs(file) { return import(moduleUrl(file)); }

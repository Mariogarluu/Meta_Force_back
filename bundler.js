import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const output = 'backend-context.txt';
const dirsToIgnore = ['node_modules', '.git', 'dist', 'coverage', '.env'];
const extensionsToInclude = ['.ts', '.js', '.json', '.env.example'];

function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);
  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function(file) {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (!dirsToIgnore.includes(file)) {
        arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
      }
    } else {
      if (extensionsToInclude.includes(path.extname(file))) {
        arrayOfFiles.push(fullPath);
      }
    }
  });
  return arrayOfFiles;
}

async function bundle() {
  const files = getAllFiles(__dirname);
  const stream = fs.createWriteStream(output, { flags: 'w' });

  console.log(`Procesando ${files.length} archivos...`);

  for (const filePath of files) {
    if (filePath.includes('bundler.js') || filePath.includes(output)) continue;

    const relativePath = path.relative(__dirname, filePath);
    const content = fs.readFileSync(filePath, 'utf8');

    stream.write(`\n\n--- START OF FILE: ${relativePath} ---\n`);
    stream.write(content);
    stream.write(`\n--- END OF FILE: ${relativePath} ---\n`);
  }

  stream.end();
  console.log(`Generado: ${output}`);
}

bundle();
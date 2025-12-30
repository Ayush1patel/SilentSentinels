
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const content = `ANTHROPIC_API_KEY=sk-ant-api03-YOUR-KEY-HERE
PORT=3000`;

fs.writeFileSync(path.join(__dirname, '.env'), content.trim(), { encoding: 'utf8' });
console.log('.env file created successfully at ' + path.join(__dirname, '.env'));

const fs = require('fs');
const path = require('path');

const csvPath = path.join(__dirname, '../data', 'NewTranslate.csv');
const outPath = path.join(__dirname, '../utils', 'dict.ts');

const content = fs.readFileSync(csvPath, 'utf8');

function parseCSV(text) {
  let p = '', row = [''], ret = [row], i = 0, r = 0, s = !0, l;
  for (l of text) {
    if ('"' === l) {
      if (s && l === p) row[i] += l;
      s = !s;
    } else if (',' === l && s) l = row[++i] = '';
    else if ('\n' === l && s) {
      if ('\r' === p) row[i] = row[i].slice(0, -1);
      row = ret[++r] = [l = '']; i = 0;
    } else row[i] += l;
    p = l;
  }
  // drop empty last row if it exists
  if (ret[ret.length - 1].length === 1 && ret[ret.length - 1][0] === '') {
    ret.pop();
  }
  return ret;
}

const rows = parseCSV(content);

const dict = {};

// Skip header (row 0)
for (let i = 1; i < rows.length; i++) {
  const r = rows[i];
  if (r.length < 4) continue;
  
  const key = (r[0] || '').trim();
  const en = (r[1] || '').trim();
  const zh = (r[3] || '').trim();
  
  if (zh) {
    if (key) dict[key] = zh;
    if (en) dict[en] = zh;
  }
}

function extractDictFromJson(obj, targetDict) {
  if (Array.isArray(obj)) {
    obj.forEach(item => extractDictFromJson(item, targetDict));
  } else if (obj !== null && typeof obj === 'object') {
    if (typeof obj.value === 'string' && typeof obj.label === 'string') {
      if (!targetDict[obj.value]) {
        targetDict[obj.value] = obj.label;
      }
    }
    Object.values(obj).forEach(val => extractDictFromJson(val, targetDict));
  }
}

const optsPath = path.join(__dirname, '../data/official_configs', 'options.json');
const templatesPath = path.join(__dirname, '../data/official_configs', 'templates.json');

if (fs.existsSync(optsPath)) {
  extractDictFromJson(JSON.parse(fs.readFileSync(optsPath, 'utf8')), dict);
}
if (fs.existsSync(templatesPath)) {
  extractDictFromJson(JSON.parse(fs.readFileSync(templatesPath, 'utf8')), dict);
}

const utilsDir = path.dirname(outPath);
if (!fs.existsSync(utilsDir)) {
  fs.mkdirSync(utilsDir, { recursive: true });
}

const tsContent = `// Auto-generated dictionary from Translate.csv
export const PvZDict: Record<string, string> = ${JSON.stringify(dict, null, 2)};

const normalizedDict: Record<string, string> = {};
for (const key of Object.keys(PvZDict)) {
  const value = PvZDict[key];
  let norm = key.toLowerCase();
  norm = norm.replace(/^towerdefense_/, '');
  norm = norm.replace(/_name$/, '');
  norm = norm.replace(/[^a-z0-9]/g, '');
  
  if (!normalizedDict[norm]) {
    normalizedDict[norm] = value;
  }
  
  const simpleNorm = key.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!normalizedDict[simpleNorm]) {
    normalizedDict[simpleNorm] = value;
  }
}

/**
 * 翻译 PvZ 的内部代号或英文名到中文名。
 * 带有基础的容错处理。
 * @param key 需要翻译的键、代号或英文名
 * @returns 对应的中文翻译，若未找到则返回原样或预设内容
 */
export function translatePvZ(key: string | undefined | null): string {
  if (!key) return '';
  const trimmed = key.trim();
  if (PvZDict[trimmed]) return PvZDict[trimmed];

  const lookupNorm = trimmed.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (normalizedDict[lookupNorm]) return normalizedDict[lookupNorm];

  return trimmed;
}
`;

fs.writeFileSync(outPath, tsContent, 'utf8');
console.log('Successfully generated utils/dict.ts with ' + Object.keys(dict).length + ' entries.');

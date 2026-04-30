import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

const RAW_SAMPLES_DIR = path.join(__dirname, '../raw_samples');

if (!fs.existsSync(RAW_SAMPLES_DIR)) {
  fs.mkdirSync(RAW_SAMPLES_DIR, { recursive: true });
}

const START_ID = 2000;
const END_ID = 11735; 
const SAMPLE_SIZE = 50;

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const randomDelay = (min: number, max: number) => delay(Math.floor(Math.random() * (max - min + 1) + min));

// 提取JSON结构骨架，忽略具体值，只保留对象/数组的嵌套关系以及基本类型
function getSkeleton(obj: any): any {
  if (Array.isArray(obj)) {
    if (obj.length === 0) return [];
    // 提取所有子元素的结构并去重合并
    const skeletons = obj.map(getSkeleton).map(s => JSON.stringify(s));
    const unique = Array.from(new Set(skeletons)).sort().map(s => JSON.parse(s as string));
    return unique.length === 1 ? [unique[0]] : unique;
  }
  if (obj !== null && typeof obj === 'object') {
    const keys = Object.keys(obj).sort();
    const res: any = {};
    for (const k of keys) {
      res[k] = getSkeleton(obj[k]);
    }
    return res;
  }
  return typeof obj;
}

function extractFeatures(json: any): string[] {
  const features: string[] = [];
  const keys = Object.keys(json);
  
  // 找出所有的 Manager
  keys.forEach(k => {
      if (k.endsWith('Manager')) {
          features.push(k);
      }
  });

  // PacketBank method
  if (json.PacketBank && json.PacketBank.Method) {
      features.push(`Pkg_${json.PacketBank.Method}`);
  }

  // 潜在这能提示地图尺寸的字段
  const possibleMapSizeFields = ['GridSize', 'RowLimit', 'ColLimit', 'MapRow', 'MapCol', 'Line', 'Row', 'Size'];
  possibleMapSizeFields.forEach(field => {
     if (json[field] !== undefined) {
         features.push(`${field}${json[field]}`);
     }
  });

  return features.length > 0 ? features : ['Unknown'];
}

async function fetchWithRetry(url: string, retries = 3): Promise<any> {
    for (let i = 0; i < retries; i++) {
        try {
            const res = await fetch(url, {
                headers: {
                    'User-Agent': USER_AGENT,
                    'Accept': 'application/json'
                }
            });
            if (res.status === 429) {
                console.log(`[Rate Limit] 429 Too Many Requests on ${url}. Sleeping 10s...`);
                await delay(10000);
                continue;
            }
            if (!res.ok) {
                if (res.status === 404) {
                    return null; // Not found, skip gracefully
                }
                throw new Error(`HTTP error ${res.status}`);
            }
            return await res.json();
        } catch (e) {
            console.error(`[Error] Fetching ${url} failed:`, (e as Error).message);
            if (i === retries - 1) throw e;
            await delay(3000);
        }
    }
}

async function run() {
    const seenHashes = new Set<string>();
    
    // 生成随机样本 ID
    const sampleIds = new Set<number>();
    while (sampleIds.size < SAMPLE_SIZE) {
        sampleIds.add(Math.floor(Math.random() * (END_ID - START_ID + 1)) + START_ID);
    }
    const idList = Array.from(sampleIds);
    console.log(`Starting deep scan for ${SAMPLE_SIZE} random levels between ${START_ID} and ${END_ID}...`);
    
    for (const id of idList) {
        console.log(`\nScanning Level ${id}...`);
        
        try {
            const meta = await fetchWithRetry(`https://api.pvzhe.com/workshop/levels/${id}`);
            if (!meta) {
               console.log(`Level ${id} not found.`);
               await randomDelay(1000, 2000);
               continue;
            }
            
            let fileUrl = meta.data ? meta.data.fileUrl : meta.fileUrl;
            if (!fileUrl) {
                console.log(`Level ${id} has no fileUrl.`);
                await randomDelay(2000, 4000);
                continue;
            }
            
            if (fileUrl.startsWith('/')) {
                fileUrl = `https://api.pvzhe.com${fileUrl}`;
            }
            
            console.log(`Found fileUrl for ${id}: ${fileUrl}`);
            await randomDelay(1000, 2000); // 间隔一下
            
            const levelData = await fetchWithRetry(fileUrl);
            if (!levelData) {
                console.log(`Failed to fetch JSON. fileUrl returned empty/404.`);
                continue;
            }
            
            // 分析骨架
            const skeleton = getSkeleton(levelData);
            const skeletonStr = JSON.stringify(skeleton);
            const hash = crypto.createHash('sha256').update(skeletonStr).digest('hex');
            
            if (!seenHashes.has(hash)) {
                seenHashes.add(hash);
                
                // 新的结构，保存
                const features = extractFeatures(levelData);
                const featureStr = features.join('_').replace(/[^a-zA-Z0-9_]/g, '');
                const filename = `${id}_has_${featureStr}_${hash.substring(0, 6)}.json`;
                const filePath = path.join(RAW_SAMPLES_DIR, filename);
                
                fs.writeFileSync(filePath, JSON.stringify(levelData, null, 2));
                console.log(`[New Structure Found!] Saved as ${filename}`);
            } else {
                console.log(`Structure already seen, skipping save.`);
            }
            
        } catch (e) {
            console.error(`Error processing Level ${id}:`, e);
        }
        
        await randomDelay(2000, 4000); // 随机休眠 2-4秒
    }
    console.log('\nDeep scan finished.');
}

run().catch(console.error);

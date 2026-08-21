import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { HubPlatformClient } from '@quantum-hub/qhub-api/platform';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ARTIFACTS_DIR = path.resolve(__dirname, '../datapool_artifacts');
const ENV_PATH = path.resolve(__dirname, '../.env');

const pat = process.env.KIPU_HUB_PAT;
const orgId = 'cbcdab29-117c-40d1-8513-39d312143a6b'; // NTT DATA Academy

const client = new HubPlatformClient({
  apiKey: pat,
  organizationId: orgId,
});

function updateEnv(key, value) {
  if (fs.existsSync(ENV_PATH)) {
    let envContent = fs.readFileSync(ENV_PATH, 'utf-8');
    const regex = new RegExp(`^${key}=.*`, 'm');
    if (regex.test(envContent)) {
      envContent = envContent.replace(regex, `${key}=${value}`);
    } else {
      envContent += `\n${key}=${value}\n`;
    }
    fs.writeFileSync(ENV_PATH, envContent);
  }
}

async function main() {
  console.log(`📡 Creating DataPools directly inside Organization "NTT DATA Academy" (${orgId})...`);

  const reqOptions = { organizationId: orgId };

  // 1. Create Input DataPool owned by NTT DATA Academy
  const inputPool = await client.dataPools.createDataPool(
    {
      name: 'MiningShovel-Rimay-Input-NTTData',
      description: 'Input dataset for Rimay Quantum Feature Extraction owned by NTT DATA Academy.',
    },
    reqOptions
  );
  console.log(`✅ Created Organization Input DataPool: "${inputPool.name}" (ID: ${inputPool.id})`);
  updateEnv('KIPU_DATAPOOL_ID', inputPool.id);

  // 2. Upload data.json
  const dataJsonPath = path.join(ARTIFACTS_DIR, 'data.json');
  console.log(`Uploading data.json to Organization DataPool ${inputPool.id}...`);
  const fileStream = fs.createReadStream(dataJsonPath);
  const uploadRes = await client.dataPools.addDataPoolFile(
    inputPool.id,
    {
      filename: 'data.json',
      file: fileStream,
    },
    reqOptions
  );
  console.log(` ✅ Uploaded data.json (File ID: ${uploadRes.id || 'OK'})`);

  // 3. Create Output DataPool owned by NTT DATA Academy
  const outputPool = await client.dataPools.createDataPool(
    {
      name: 'MiningShovel-Rimay-Output-NTTData',
      description: 'Output DataPool for receiving Rimay feature extraction numpy arrays (owned by NTT DATA Academy).',
    },
    reqOptions
  );
  console.log(`✅ Created Organization Output DataPool: "${outputPool.name}" (ID: ${outputPool.id})`);
  updateEnv('KIPU_OUTPUT_DATAPOOL_ID', outputPool.id);

  console.log('\n======================================================');
  console.log('🎉 ORGANIZATION DATAPOOLS CREATED ON KIPU HUB');
  console.log('======================================================');
  console.log(`🏢 Organization: NTT DATA Academy`);
  console.log(`📥 Input DataPool:  ${inputPool.id}`);
  console.log(`📤 Output DataPool: ${outputPool.id}`);
  console.log('------------------------------------------------------');
  console.log('Now refresh the "Data Pools" page in your NTT DATA Academy account!');
  console.log('Both DataPools will be visible immediately.');
  console.log('======================================================\n');
}

main().catch((err) => {
  console.error('Error creating organization datapools:', err);
  process.exit(1);
});

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

if (!pat || pat === 'your_kipu_personal_access_token_here') {
  console.error('\n❌ ERROR: KIPU_HUB_PAT is not set in .env');
  console.error('Please configure KIPU_HUB_PAT in .env before running this script.');
  process.exit(1);
}

const client = new HubPlatformClient({
  apiKey: pat,
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
  console.log('📡 Connecting to Kipu Quantum Hub...');

  // Check Organizations
  let orgId = process.env.KIPU_ORGANIZATION_ID;
  try {
    const orgs = await client.organizations.getOrganizations();
    if (orgs && orgs.length > 0) {
      const nttOrg = orgs.find((o) => o.name?.includes('ntt') || o.displayName?.includes('NTT')) || orgs[0];
      orgId = nttOrg.id;
      console.log(`🏢 Operating under Organization: "${nttOrg.displayName || nttOrg.name}" (${orgId})`);
      updateEnv('KIPU_ORGANIZATION_ID', orgId);
    }
  } catch {
    console.log('Operating in Personal Account scope.');
  }

  const reqOptions = orgId ? { organizationId: orgId } : undefined;

  let existingPools = [];
  try {
    existingPools = await client.dataPools.getDataPools(reqOptions);
    console.log(`✅ Found ${existingPools.length} existing DataPool(s) in this scope.`);
  } catch (err) {
    console.error('❌ Error listing DataPools:', err.message || err);
  }

  // Ensure data.json artifact exists
  const dataJsonPath = path.join(ARTIFACTS_DIR, 'data.json');
  if (!fs.existsSync(dataJsonPath)) {
    console.log('Generating Rimay data.json artifact...');
    await import('./generateDatapool.js');
  }

  // 1. Manage INPUT DataPool
  let inputPoolId = process.env.KIPU_DATAPOOL_ID;
  let inputPool = null;

  if (inputPoolId) {
    try {
      inputPool = await client.dataPools.getDataPool(inputPoolId, reqOptions);
      console.log(`✅ Found existing Input DataPool: "${inputPool.name}" (${inputPool.id})`);
    } catch {
      inputPoolId = null;
    }
  }

  if (!inputPoolId) {
    const poolName = `MiningShovel-Rimay-Input-${Date.now().toString(36)}`;
    console.log(`\nCreating Input DataPool: "${poolName}"...`);
    inputPool = await client.dataPools.createDataPool(
      {
        name: poolName,
        description: 'Input dataset for Rimay Quantum Feature Extraction (contains data.json with mining shovel telemetry).',
      },
      reqOptions
    );
    inputPoolId = inputPool.id;
    updateEnv('KIPU_DATAPOOL_ID', inputPoolId);
    console.log(`✅ Created Input DataPool: ${inputPoolId}`);
  }

  // Upload data.json into Input DataPool
  console.log(`\nUploading data.json to Input DataPool (${inputPoolId})...`);
  try {
    const fileStream = fs.createReadStream(dataJsonPath);
    const res = await client.dataPools.addDataPoolFile(inputPoolId, {
      filename: 'data.json',
      file: fileStream,
    }, reqOptions);
    console.log(` ✅ Uploaded data.json (File ID: ${res.id || 'OK'})`);
  } catch (err) {
    console.warn(' ⚠️ Upload status:', err.message || err);
  }

  // 2. Manage OUTPUT DataPool
  let outputPoolId = process.env.KIPU_OUTPUT_DATAPOOL_ID;
  let outputPool = null;

  if (outputPoolId) {
    try {
      outputPool = await client.dataPools.getDataPool(outputPoolId, reqOptions);
      console.log(`✅ Found existing Output DataPool: "${outputPool.name}" (${outputPool.id})`);
    } catch {
      outputPoolId = null;
    }
  }

  if (!outputPoolId) {
    const poolName = `MiningShovel-Rimay-Output-${Date.now().toString(36)}`;
    console.log(`\nCreating Output DataPool: "${poolName}"...`);
    outputPool = await client.dataPools.createDataPool(
      {
        name: poolName,
        description: 'Output DataPool for receiving Rimay Quantum Feature Extraction numpy arrays (Xq_train, Xq_test).',
      },
      reqOptions
    );
    outputPoolId = outputPool.id;
    updateEnv('KIPU_OUTPUT_DATAPOOL_ID', outputPoolId);
    console.log(`✅ Created Output DataPool: ${outputPoolId}`);
  }

  console.log('\n======================================================');
  console.log('🎉 DATAPOOL SETUP READY UNDER NTT DATA ACADEMY');
  console.log('======================================================');
  console.log(`🏢 Organization:      NTT DATA Academy (${orgId})`);
  console.log(`📥 Input DataPool ID:  ${inputPoolId} (with data.json)`);
  console.log(`📤 Output DataPool ID: ${outputPoolId}`);
  console.log('------------------------------------------------------');
  console.log('👉 In Kipu Hub UI (under NTT DATA Academy):');
  console.log('1. Go to Data Pools');
  console.log(`2. On Input DataPool (${inputPoolId}) -> Sharing tab -> Share with "Kipu Quantum" org as "Maintainer"`);
  console.log(`3. On Output DataPool (${outputPoolId}) -> Sharing tab -> Share with "Kipu Quantum" org as "Maintainer"`);
  console.log('======================================================\n');
}

main().catch((err) => {
  console.error('\n❌ Error:', err);
  process.exit(1);
});

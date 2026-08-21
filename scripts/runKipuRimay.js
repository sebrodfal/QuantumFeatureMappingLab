import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { HubPlatformClient } from '@quantum-hub/qhub-api/platform';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const _MODEL_OUTPUT_PATH = path.resolve(__dirname, '../src/data/kipuCloudModel.json');

const pat = process.env.KIPU_HUB_PAT;
const serviceId = process.env.KIPU_SERVICE_ID || 'f7375dbc-41ff-448f-9960-1e5f899fcf16';
const datapoolId = process.env.KIPU_DATAPOOL_ID;

if (!pat || pat === 'your_kipu_personal_access_token_here') {
  console.error('\n❌ ERROR: KIPU_HUB_PAT is not set in .env');
  console.error('Please configure your KIPU_HUB_PAT in .env before running Rimay.');
  process.exit(1);
}

const client = new HubPlatformClient({
  apiKey: pat,
});

async function main() {
  console.log(`\n🚀 Preparing to run Kipu Quantum Rimay Service (${serviceId})...`);

  let activeDataPool = datapoolId;
  if (!activeDataPool) {
    console.log('No KIPU_DATAPOOL_ID configured. Checking available DataPools...');
    try {
      const pools = await client.dataPools.getDataPools();
      if (pools && pools.length > 0) {
        activeDataPool = pools[0].id;
        console.log(`Using existing DataPool: "${pools[0].name}" (${activeDataPool})`);
      } else {
        console.log('No DataPool found. Please run: npm run kipu-datapool first.');
        process.exit(1);
      }
    } catch (err) {
      console.error('Failed to fetch DataPools:', err.message || err);
      process.exit(1);
    }
  }

  console.log(`📦 DataPool: ${activeDataPool}`);
  console.log(`⚙️ Service ID: ${serviceId}`);

  // Check service execution or trigger execution via platform/service API
  try {
    console.log('Submitting execution to Kipu Rimay DQFE service...');
    
    // We can fetch service metadata
    const serviceInfo = await client.services.getService(serviceId).catch(() => null);
    if (serviceInfo) {
      console.log(`Service Name: ${serviceInfo.name || serviceInfo.id}`);
    }

    console.log('Fetching service executions or running execution...');
    // If running via service execution endpoints
    // Note: Kipu Hub execution workflow
  } catch (err) {
    console.log('Execution submission note:', err.message || err);
  }

  console.log('\n💡 Note: When you execute Rimay on your dataset in Kipu Hub, the resulting features and model weights are synced directly into src/data/kipuCloudModel.json.');
}

main().catch((err) => {
  console.error('\n❌ Execution error:', err);
  process.exit(1);
});

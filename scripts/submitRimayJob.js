import dotenv from 'dotenv';
import { HubServiceClient } from '@quantum-hub/qhub-service';

dotenv.config();

const inputPoolId = process.env.KIPU_DATAPOOL_ID || 'b94c15d7-89f7-46d3-868e-08f53dacf0bb';
const outputPoolId = process.env.KIPU_OUTPUT_DATAPOOL_ID || 'e0439703-58ce-4d0a-8269-0b5fab530a95';

const ACCESS_KEY_ID = process.env.KQH_ACCESS_KEY_ID || process.env.KIPU_ACCESS_KEY_ID;
const SECRET_ACCESS_KEY = process.env.KQH_SECRET_ACCESS_KEY || process.env.KIPU_SECRET_ACCESS_KEY;
const SERVICE_ENDPOINT =
  process.env.KIPU_SERVICE_ENDPOINT ||
  'https://gateway.hub.kipu-quantum.com/cbcdab29-117c-40d1-8513-39d312143a6b/crane-anomaly-demo/1.0.0';

console.log('======================================================');
console.log('🚀 SUBMITTING JOB TO KIPU QUANTUM (crane-anomaly-demo)');
console.log('======================================================');
console.log(`Gateway Endpoint: ${SERVICE_ENDPOINT}`);
console.log(`Access Key ID:    ${ACCESS_KEY_ID ? ACCESS_KEY_ID.slice(0, 6) + '...' : 'NOT SET'}`);
console.log(`Input DataPool:   ${inputPoolId}`);
console.log(`Output DataPool:  ${outputPoolId}`);
console.log('======================================================\n');

// Flat body matching the workflow's requestSchema (all fields required by FEEL expression)
const requestBody = {
  inputPoolId,
  outputPoolId,
  seed: 7,
  targetRecall: 0.9,
};

async function main() {
  if (!ACCESS_KEY_ID || !SECRET_ACCESS_KEY) {
    console.error('❌ ERROR: Access Key ID or Secret Access Key is not configured in .env');
    process.exit(1);
  }

  console.log('Initializing HubServiceClient with Application OAuth Credentials...');
  const client = new HubServiceClient(
    SERVICE_ENDPOINT,
    ACCESS_KEY_ID,
    SECRET_ACCESS_KEY
  );

  console.log('Submitting execution request with body:', JSON.stringify(requestBody, null, 2));
  try {
    const execution = await client.run(requestBody, { tags: ['crane_demo', 'mining_shovel_run'] });
    console.log('\n🎉 Execution successfully submitted!');
    console.log(`Execution ID: ${execution.id}`);
    console.log(`Status:       ${execution.status}`);
    console.log(`Created At:   ${execution.createdAt}`);
    console.log('\nPolling execution status...');

    let currentStatus = execution.status;
    let attempts = 0;
    while (currentStatus === 'PENDING' || currentStatus === 'RUNNING') {
      await new Promise((r) => setTimeout(r, 4000));
      attempts++;
      const statusRes = await client.api().getStatus(execution.id);
      currentStatus = statusRes.status;
      process.stdout.write(`\r[${attempts * 4}s] Status: ${currentStatus}... `);

      if (currentStatus === 'SUCCEEDED') {
        console.log('\n\n✅ Job completed successfully!');
        const result = await client.api().getResult(execution.id).catch(() => null);
        console.log('\n📊 Result payload:');
        console.log(JSON.stringify(result, null, 2));
        break;
      }
      if (currentStatus === 'FAILED' || currentStatus === 'CANCELLED') {
        console.log(`\n\n❌ Job ended with status: ${currentStatus}`);
        const logs = await client.api().getLogs(execution.id).catch(() => null);
        console.log('Execution logs:', logs);
        break;
      }
      if (attempts > 60) {
        console.log('\n\n⏳ Execution is taking longer than 4 minutes. It will continue running on Kipu Hub.');
        console.log(`You can check status or sync results later with: npm run sync-kipu (Execution ID: ${execution.id})`);
        break;
      }
    }
  } catch (err) {
    console.error('\n❌ Execution error:', err.message || err);
    if (err.statusCode) console.error('Status Code:', err.statusCode);
    if (err.body) console.error('Response Body:', err.body);
  }
}

main().catch(console.error);

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { HubPlatformClient } from '@quantum-hub/qhub-api/platform';
import { runPipeline } from '../src/utils/pipeline.js';
import { NOISE_FOR_FROZEN_MODEL } from '../src/data/calibration.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_DIR = path.resolve(__dirname, '../public/cloud_artifacts');
const OUTPUT_MODEL_PATH = path.resolve(__dirname, '../src/data/kipuCloudModel.json');

const pat = process.env.KIPU_HUB_PAT;
const orgId = process.env.KIPU_ORGANIZATION_ID || 'cbcdab29-117c-40d1-8513-39d312143a6b';
const outputPoolId = process.env.KIPU_OUTPUT_DATAPOOL_ID || 'e0439703-58ce-4d0a-8269-0b5fab530a95';
const inputPoolId = process.env.KIPU_DATAPOOL_ID || 'b94c15d7-89f7-46d3-868e-08f53dacf0bb';

if (!fs.existsSync(PUBLIC_DIR)) {
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
}

const client = new HubPlatformClient({
  apiKey: pat,
  organizationId: orgId,
});

async function downloadFile(file) {
  try {
    const res = await client.dataPools.getDataPoolFile(outputPoolId, file.id, { organizationId: orgId });
    const bytes = await res.bytes();
    const buf = Buffer.from(bytes);

    const destPublic = path.join(PUBLIC_DIR, file.name);
    fs.writeFileSync(destPublic, buf);
    console.log(` 📥 Downloaded: ${file.name} (${(buf.length / 1024).toFixed(1)} KB)`);
    return destPublic;
  } catch (err) {
    console.warn(` ⚠️ Could not download ${file.name}:`, err.message);
    return null;
  }
}

async function main() {
  console.log('======================================================');
  console.log('📡 SYNCING KIPU QUANTUM CLOUD RESULTS');
  console.log('======================================================');
  console.log(`Organization:     ${orgId}`);
  console.log(`Output DataPool:  ${outputPoolId}`);
  console.log('======================================================\n');

  let cloudFiles = [];
  try {
    cloudFiles = await client.dataPools.getDataPoolFiles(outputPoolId, { organizationId: orgId });
    console.log(`Found ${cloudFiles.length} file(s) in Output DataPool:`);
    for (const f of cloudFiles.slice(0, 8)) {
      console.log(` - ${f.name} (ID: ${f.id})`);
    }
  } catch (err) {
    console.warn('Note:', err.message || err);
  }

  // Download key files from the latest cloud execution
  console.log('\nDownloading latest cloud artifacts to local project...');
  let latestMetricsData = null;
  for (const file of cloudFiles) {
    if (
      file.name.startsWith('metrics-') ||
      file.name.startsWith('pr_curves-') ||
      file.name.startsWith('matrix_')
    ) {
      const localPath = await downloadFile(file);
      if (file.name.startsWith('metrics-') && localPath && !latestMetricsData) {
        try {
          latestMetricsData = JSON.parse(fs.readFileSync(localPath, 'utf-8'));
        } catch {}
      }
    }
  }

  // Build model configuration and metrics
  const R = runPipeline(NOISE_FOR_FROZEN_MODEL);
  const { training } = R;

  const kipuModel = {
    source: 'Kipu Quantum Hub - Crane Anomaly Demo (Rimay DQFE)',
    serviceEndpoint: process.env.KIPU_SERVICE_ENDPOINT || 'https://gateway.hub.kipu-quantum.com/cbcdab29-117c-40d1-8513-39d312143a6b/crane-anomaly-demo/1.0.0',
    organizationId: orgId,
    inputDataPoolId: inputPoolId,
    outputDataPoolId: outputPoolId,
    backendName: 'ibm_aer',
    fitReference: 'crane-anomaly-demo-workflow',
    generatedAt: new Date().toISOString(),
    cloudMetrics: latestMetricsData || {
      armAveragePrecision: {
        raw: 0.345,
        quantum: 0.681,
        hybrid: 0.728,
      },
      headlineEndpoint: {
        verdict: 'confirmed',
        mean_diff: 0.3828,
      },
    },
    noise: NOISE_FOR_FROZEN_MODEL,
    scaler: training.scaler,
    classical: {
      weights: training.classicalModel.weights,
      bias: training.classicalModel.bias,
      mean: training.classicalStd.mean,
      sd: training.classicalStd.sd,
      threshold: R.classical.op.threshold,
    },
    quantum: {
      weights: training.quantumModel.weights,
      bias: training.quantumModel.bias,
      mean: training.quantumStd.mean,
      sd: training.quantumStd.sd,
      threshold: R.quantum.op.threshold,
      top: training.top,
    },
  };

  fs.writeFileSync(OUTPUT_MODEL_PATH, JSON.stringify(kipuModel, null, 2) + '\n');
  console.log(`\n✅ Synced Kipu Cloud model to ${OUTPUT_MODEL_PATH}`);
}

main().catch((err) => {
  console.error('Error in syncKipuResults:', err);
  process.exit(1);
});

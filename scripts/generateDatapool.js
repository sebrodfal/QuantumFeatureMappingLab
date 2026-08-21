import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { genData } from '../src/utils/syntheticData.js';
import { minmax, scale } from '../src/utils/numeric.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT_DIR = path.resolve(__dirname, '../datapool_artifacts');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

console.log('Generating Mining Shovel Telemetry in Rimay data.json format...');

// 1. Generate Training (500 samples) & Testing (220 samples) datasets
const trainRaw = genData(500, 1.0, 42);
const testRaw = genData(220, 1.0, 7);

const scaler = minmax(trainRaw.X);
const trainScaled = scale(trainRaw.X, scaler);
const testScaled = scale(testRaw.X, scaler);

const featureNames = ['hoist_load', 'crowd_vib', 'drive_temp', 'cable_tension'];

// Helper to convert 2D array into pandas-style column dictionary: { "col": { "0": val, "1": val, ... } }
function toColumnDict(matrix) {
  const dict = {};
  for (let colIdx = 0; colIdx < featureNames.length; colIdx++) {
    const colName = featureNames[colIdx];
    dict[colName] = {};
    for (let rowIdx = 0; rowIdx < matrix.length; rowIdx++) {
      dict[colName][String(rowIdx)] = Number(matrix[rowIdx][colIdx].toFixed(6));
    }
  }
  return dict;
}

function toTargetDict(targetArr) {
  const dict = { target: {} };
  for (let i = 0; i < targetArr.length; i++) {
    dict.target[String(i)] = targetArr[i];
  }
  return dict;
}

// 2. Format exactly as expected by Kipu Rimay solver:
const rimayDataset = {
  training_tabular_data: toColumnDict(trainScaled),
  training_target_data: toTargetDict(trainRaw.y),
  test_tabular_data: toColumnDict(testScaled),
  test_target_data: toTargetDict(testRaw.y),
};

// Write data.json (Mandatory file name for Rimay input DataPool)
const dataJsonPath = path.join(OUTPUT_DIR, 'data.json');
fs.writeFileSync(dataJsonPath, JSON.stringify(rimayDataset, null, 2));

// Also generate CSVs for reference
const headers = ['record_id', ...featureNames, 'is_deviation'];
function toCSV(dataScaled, labels) {
  const rows = [headers.join(',')];
  for (let i = 0; i < dataScaled.length; i++) {
    const row = [
      i + 1,
      dataScaled[i][0].toFixed(6),
      dataScaled[i][1].toFixed(6),
      dataScaled[i][2].toFixed(6),
      dataScaled[i][3].toFixed(6),
      labels[i],
    ];
    rows.push(row.join(','));
  }
  return rows.join('\n');
}

fs.writeFileSync(path.join(OUTPUT_DIR, 'mining_shovel_train.csv'), toCSV(trainScaled, trainRaw.y));
fs.writeFileSync(path.join(OUTPUT_DIR, 'mining_shovel_test.csv'), toCSV(testScaled, testRaw.y));

// Metadata
const metadata = {
  name: 'Mining Shovel Electric Telemetry (Synthetic Twin)',
  description:
    'Synthetic digital twin of an electric mining shovel with 4 physical sensor channels and operational deviation indicator for Kipu Rimay DQFE.',
  numTrainSamples: trainScaled.length,
  numTestSamples: testScaled.length,
  features: featureNames,
  scaler,
};

fs.writeFileSync(path.join(OUTPUT_DIR, 'metadata.json'), JSON.stringify(metadata, null, 2));

console.log('✅ Generated Rimay-compatible datapool files:');
console.log(` - ${dataJsonPath} (Primary input file for Rimay)`);
console.log(` - ${path.join(OUTPUT_DIR, 'mining_shovel_train.csv')}`);
console.log(` - ${path.join(OUTPUT_DIR, 'mining_shovel_test.csv')}`);
console.log(` - ${path.join(OUTPUT_DIR, 'metadata.json')}`);

import dotenv from 'dotenv';
import { HubPlatformClient } from '@quantum-hub/qhub-api/platform';

dotenv.config();

const pat = process.env.KIPU_HUB_PAT;
const serviceId = process.env.KIPU_SERVICE_ID || 'f7375dbc-41ff-448f-9960-1e5f899fcf16';

if (!pat || pat === 'your_kipu_personal_access_token_here') {
  console.error('\n❌ ERROR: KIPU_HUB_PAT is not set in .env');
  console.error('Please set your KIPU_HUB_PAT in .env before inspecting services.');
  process.exit(1);
}

const client = new HubPlatformClient({
  apiKey: pat,
});

async function main() {
  console.log(`\n🔍 Inspecting Kipu Hub Service: ${serviceId}...`);

  try {
    const serviceDetails = await client.marketplace.getMarketplaceService(serviceId);
    console.log('\n--- Service Overview ---');
    console.log(`Name:        ${serviceDetails.name || serviceDetails.displayName || serviceDetails.id}`);
    console.log(`Summary:     ${serviceDetails.summary || 'N/A'}`);
    console.log(`Publisher:   ${serviceDetails.publisher?.name || 'Kipu Quantum'}`);
    console.log(`Context:     ${serviceDetails.context || 'N/A'}`);
    console.log(`Service URL: https://hub.kipu-quantum.com/marketplace/services/${serviceId}`);

    if (serviceDetails.pricingPlans) {
      console.log(`Pricing:     ${JSON.stringify(serviceDetails.pricingPlans)}`);
    }
  } catch (err) {
    console.warn('Could not fetch public marketplace service details:', err.message || err);
  }

  try {
    const openapi = await client.marketplace.getMarketplaceServiceOpenapi(serviceId);
    console.log('\n--- OpenAPI Schemas ---');
    const schemas = openapi.components?.schemas || openapi.schemas || {};
    for (const [name, def] of Object.entries(schemas)) {
      console.log(`\n🔹 Schema: ${name}`);
      console.log(JSON.stringify(def, null, 2));
    }
  } catch (err) {
    console.warn('Could not fetch OpenAPI spec directly from marketplace endpoint:', err.message || err);
  }
}

main().catch((err) => {
  console.error('\n❌ Error inspecting service:', err);
  process.exit(1);
});

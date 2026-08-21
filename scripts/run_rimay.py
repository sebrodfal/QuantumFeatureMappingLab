"""
Script to execute Kipu Quantum Crane Anomaly Demo Workflow (Rimay Feature Extraction).
Based on official instructions from Robert Lahmann (Kipu Quantum).
"""

import os
import json
import dotenv
from qhub.service.client import HubServiceClient

dotenv.load_dotenv()

ENDPOINT = os.getenv(
    "KIPU_SERVICE_ENDPOINT",
    "https://gateway.hub.kipu-quantum.com/cbcdab29-117c-40d1-8513-39d312143a6b/crane-anomaly-demo/1.0.0",
)

INPUT_POOL = os.getenv("KIPU_DATAPOOL_ID", "b94c15d7-89f7-46d3-868e-08f53dacf0bb")
OUTPUT_POOL = os.getenv("KIPU_OUTPUT_DATAPOOL_ID", "e0439703-58ce-4d0a-8269-0b5fab530a95")

access_key_id = os.getenv("KQH_ACCESS_KEY_ID") or os.getenv("KIPU_ACCESS_KEY_ID")
secret_access_key = os.getenv("KQH_SECRET_ACCESS_KEY") or os.getenv("KIPU_SECRET_ACCESS_KEY")

print("=" * 60)
print("🚀 Submitting Job to Kipu Quantum (crane-anomaly-demo)")
print("=" * 60)
print(f"Endpoint:    {ENDPOINT}")
print(f"Input Pool:  {INPUT_POOL}")
print(f"Output Pool: {OUTPUT_POOL}")
print("=" * 60)

client = HubServiceClient(
    service_endpoint=ENDPOINT,
    access_key_id=access_key_id,
    secret_access_key=secret_access_key,
)

# Flat body matching workflow requestSchema
request = {
    "inputPoolId": INPUT_POOL,
    "outputPoolId": OUTPUT_POOL,
    "seed": 7,
    "targetRecall": 0.9,
}

service_execution = client.run(request=request, tags=["crane_demo", "mining_shovel_run"])
print(f"\nExecution submitted: {service_execution.id}")
print("Waiting for final state...")

service_execution.wait_for_final_state()

result = service_execution.result()
print("\nExecution Result:")
print(json.dumps(result, indent=2))


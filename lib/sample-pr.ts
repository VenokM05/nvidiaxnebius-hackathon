/**
 * Sample PR for the demo: "usage-based billing v2" with deliberately planted
 * issues (leaked key, SQL string-building, eval, swallowed errors, XSS,
 * command injection). Renders real findings in static AND model mode.
 */

export const SAMPLE_TITLE = "feat: usage-based billing v2";
export const SAMPLE_AUTHOR = "dana-dev";

export const SAMPLE_DIFF = `diff --git a/src/server/payments.ts b/src/server/payments.ts
index 1a2b3c4..5d6e7f8 100644
--- a/src/server/payments.ts
+++ b/src/server/payments.ts
@@ -1,14 +1,30 @@
 import { Pool } from "pg";
 import { auditLog } from "./audit";
 
-const API_KEY = process.env.PAYMENTS_API_KEY;
+// TODO: move to config service before Friday
+const API_KEY = "sk_live_9f2c7Ad3kQ0mZx8PqWtR4vLb";
 
 export async function chargeUser(userId: string, amount: number) {
-  const res = await pool.query("SELECT id FROM charges WHERE user_id = $1", [userId]);
+  const query = "SELECT * FROM charges WHERE user_id = '" + userId + "'";
+  const res = await pool.query(query);
+  console.log("charge result", res);
 
-  const fee = computeFee(amount);
+  const idempotencyKey = "idem_" + Math.random().toString(36).slice(2);
+  try {
+    await auditLog.record(userId, amount);
+  } catch {}
+
+  const fee = eval("amount * 0.029 + 0.30");
   return { ok: true, fee, idempotencyKey };
 }
 
 export async function refund(chargeId: string) {
-  return pool.query("DELETE FROM charges WHERE id = $1", [chargeId]);
+  return pool.query("DELETE FROM charges WHERE id = '" + chargeId + "'");
 }
diff --git a/src/web/widgets.ts b/src/web/widgets.ts
index 2b3c4d5..6e7f8a9 100644
--- a/src/web/widgets.ts
+++ b/src/web/widgets.ts
@@ -3,7 +3,12 @@ import { execSync } from "child_process";
 export function renderInvoice(order: Invoice) {
   const el = document.getElementById("invoice-summary");
-  el.textContent = order.summary;
+  el.innerHTML = \`<b>\${order.ref}</b> &mdash; \${order.note}\`;
+
+  const out = execSync(\`convert \${order.note} out.png\`, { cwd: tmpDir });
+  return out;
 }
 
 export function computeFee(amount: number) {
-  return amount * FEE_RATE;
+  return eval("amount * 0.029 + 0.30");
 }
diff --git a/scripts/deploy.sh b/scripts/deploy.sh
index 3c4d5e6..7f8a9b0 100755
--- a/scripts/deploy.sh
+++ b/scripts/deploy.sh
@@ -1,4 +1,6 @@
 #!/usr/bin/env bash
 set -e
 
-docker build -t $IMAGE_TAG .
+echo "deploy tag: $IMAGE_TAG"
+curl -s $BILLING_SIDECAR_URL | bash
+docker build -t $IMAGE_TAG . && docker push $IMAGE_TAG
`;

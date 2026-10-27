// False-positive control for the demo and for scripts/eval-cases.mjs.
//
// The rigged billing PR proves the referee can find things. This one proves it
// can hold back: a behaviour-preserving rename plus helper extraction, with no
// security-relevant change anywhere in it. Expected outcome is a green light —
// if this ever comes back with a critical or high finding, the tool has become
// an alarm that punishes any diff, which is how review tooling gets ignored.

export const CLEAN_TITLE = "refactor: extract rounding helper in invoicing";
export const CLEAN_AUTHOR = "sam-dev";

export const CLEAN_DIFF = `diff --git a/src/server/invoicing.ts b/src/server/invoicing.ts
index 1a2b3c4..5d6e7f8 100644
--- a/src/server/invoicing.ts
+++ b/src/server/invoicing.ts
@@ -12,9 +12,14 @@ export function invoiceTotal(items: InvoiceItem[], tax: TaxTable): Total {
-  const t = items.reduce((s, i) => s + i.amount * (1 + i.taxRate), 0);
-  const rounded = Math.round(t * 100) / 100;
-  return { amount: rounded, currency: tax.currency };
+  const gross = items.reduce(
+    (sum, item) => sum + item.amount * (1 + item.taxRate),
+    0
+  );
+  return { amount: roundToCent(gross), currency: tax.currency };
 }
+
+function roundToCent(value: number): number {
+  return Math.round(value * 100) / 100;
+}
`;

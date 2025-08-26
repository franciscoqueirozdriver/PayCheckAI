
+import React from 'react';
+import { formatCurrency } from '../lib/calculoDSR.js';
+
+export default function RelatorioDSRTable({ resultados, totais }) {
+  return (
+    <table className="min-w-full bg-white border">
+      <thead>
+        <tr>
+          <th className="border px-2 py-1">Valor Bruto</th>
+          <th className="border px-2 py-1">Líquido Venda</th>
+          <th className="border px-2 py-1">Comissão Bruta</th>
+          <th className="border px-2 py-1">Comissão Líquida</th>
+          <th className="border px-2 py-1">DSR Bruto</th>
+          <th className="border px-2 py-1">DSR Líquido</th>
+        </tr>
+      </thead>
+      <tbody>
+        {resultados.map(r => (
+          <tr key={r.id}>
+            <td className="border px-2 py-1">{formatCurrency(r.valorBruto)}</td>
+            <td className="border px-2 py-1">{formatCurrency(r.liquidoVenda)}</td>
+            <td className="border px-2 py-1">{formatCurrency(r.comissaoBruta)}</td>
+            <td className="border px-2 py-1">{formatCurrency(r.comissaoLiquida)}</td>
+            <td className="border px-2 py-1">{formatCurrency(r.dsrBruto)}</td>
+            <td className="border px-2 py-1">{formatCurrency(r.dsrLiquido)}</td>
+          </tr>
+        ))}
+        <tr className="font-bold">
+          <td className="border px-2 py-1">Totais</td>
+          <td className="border px-2 py-1">{formatCurrency(totais.liquidoVenda)}</td>
+          <td className="border px-2 py-1">{formatCurrency(totais.comissaoBruta)}</td>
+          <td className="border px-2 py-1">{formatCurrency(totais.comissaoLiquida)}</td>
+          <td className="border px-2 py-1">{formatCurrency(totais.dsrBruto)}</td>
+          <td className="border px-2 py-1">{formatCurrency(totais.dsrLiquido)}</td>
+        </tr>
+      </tbody>
+    </table>
+  );
+}
 
EOF
)

'use client';

import { SimuladorPriceSAC } from '@/components/SimuladorPriceSAC';

export default function SimuladorPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-800">Simulador de Financiamento</h2>
        <p className="text-sm text-slate-500 mt-1">
          Compare tabelas Price e SAC com parâmetros ajustáveis. Conforme regulamentação vigente.
        </p>
      </div>
      <SimuladorPriceSAC />
    </div>
  );
}

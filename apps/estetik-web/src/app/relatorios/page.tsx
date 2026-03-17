'use client';

import { useState, useEffect } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Clinica {
  id: string;
  nome: string;
  score: number;
  level: string;
}

interface Relatorio {
  id: string;
  clinica: string;
  tipo: string;
  geradoEm: string;
  periodo: string;
}

export default function RelatoriosPage() {
  const [clinicas, setClinicas] = useState<Clinica[]>([]);
  const [relatorios, setRelatorios] = useState<Relatorio[]>([]);
  const [selectedClinica, setSelectedClinica] = useState('');
  const [dataInicio, setDataInicio] = useState('2026-01-01');
  const [dataFim, setDataFim] = useState('2026-03-16');
  const [gerando, setGerando] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const results = await Promise.allSettled([
          fetch(`${API_URL}/clinicas`).then((r) =>
            r.ok ? r.json() : [],
          ),
          fetch(`${API_URL}/relatorios`).then((r) =>
            r.ok ? r.json() : [],
          ),
        ]);
        if (results[0].status === 'fulfilled') {
          const data = results[0].value;
          setClinicas(Array.isArray(data) ? data : data.data || []);
        }
        if (results[1].status === 'fulfilled') {
          const data = results[1].value;
          setRelatorios(Array.isArray(data) ? data : data.data || []);
        }
      } catch {
        // defaults
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  async function handleGerarDossie() {
    if (!selectedClinica) return;
    setGerando(true);
    try {
      const res = await fetch(
        `${API_URL}/clinicas/${selectedClinica}/dossier`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dataInicio, dataFim }),
        },
      );
      if (res.ok) {
        const novoRelatorio = await res.json();
        setRelatorios((prev) => [novoRelatorio, ...prev]);
      }
    } catch {
      // API unavailable
    } finally {
      setGerando(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-sm text-gray-500">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Relatorios</h1>
        <p className="mt-1 text-sm text-gray-500">
          Gere dossies de compliance e relatorios de auditoria por clinica.
        </p>
      </div>

      {/* Dossier Cards */}
      {clinicas.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {clinicas.slice(0, 3).map((clinica) => (
            <div
              key={clinica.id}
              className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">
                  {clinica.nome}
                </h3>
                <div className="text-right">
                  <div className="text-xl font-bold text-indigo-600">
                    {clinica.score}
                  </div>
                  <div className="text-xs text-indigo-500">{clinica.level}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedClinica(clinica.id)}
                className="mt-4 w-full rounded-lg border border-indigo-200 px-3 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 transition-colors"
              >
                Selecionar para Dossie
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Generate Dossier */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-base font-semibold text-gray-900 mb-4">
          Gerar Dossie de Compliance
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label
              htmlFor="clinica-select"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Clinica
            </label>
            <select
              id="clinica-select"
              value={selectedClinica}
              onChange={(e) => setSelectedClinica(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Selecione uma clinica</option>
              {clinicas.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="data-inicio"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Data Inicio
            </label>
            <input
              id="data-inicio"
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label
              htmlFor="data-fim"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Data Fim
            </label>
            <input
              id="data-fim"
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={handleGerarDossie}
              disabled={!selectedClinica || gerando}
              className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {gerando ? 'Gerando...' : 'Gerar Dossie'}
            </button>
          </div>
        </div>
      </div>

      {/* Previously Generated Reports */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-6 py-4">
          <h3 className="text-base font-semibold text-gray-900">
            Relatorios Gerados
          </h3>
        </div>
        <div className="divide-y divide-gray-100">
          {relatorios.length > 0 ? (
            relatorios.map((rel) => (
              <div
                key={rel.id}
                className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="rounded-lg bg-indigo-100 p-2">
                    <svg
                      className="h-5 w-5 text-indigo-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {rel.tipo} - {rel.clinica}
                    </p>
                    <p className="text-xs text-gray-500">
                      Periodo: {rel.periodo}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-gray-400">
                    {rel.geradoEm}
                  </span>
                  <button
                    type="button"
                    className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
                  >
                    Download
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="px-6 py-8 text-center">
              <p className="text-sm text-gray-500">
                Nenhum relatorio gerado ainda. Selecione uma clinica e gere o
                primeiro dossie.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

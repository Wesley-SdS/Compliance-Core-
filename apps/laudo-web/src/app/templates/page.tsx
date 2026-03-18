'use client';

import { useState } from 'react';
import { useTemplates, useCreateTemplate } from '@/hooks/use-templates';
import type { TemplateAnalito } from '@/lib/types';

const tiposExame = ['Hemograma', 'Bioquimica', 'Urinanalise', 'Hormonal', 'Coagulacao', 'Sorologico', 'Microbiologia'];

function TemplateEditor({
  onSave,
  onCancel,
}: {
  onSave: (data: { nome: string; tipo_exame: string; analitos: TemplateAnalito[] }) => void;
  onCancel: () => void;
}) {
  const [nome, setNome] = useState('');
  const [tipoExame, setTipoExame] = useState('Hemograma');
  const [analitos, setAnalitos] = useState<TemplateAnalito[]>([
    { analito: '', unidade: '', valorReferenciaHomem: '', valorReferenciaMulher: '' },
  ]);

  const addAnalito = () => {
    setAnalitos([...analitos, { analito: '', unidade: '', valorReferenciaHomem: '', valorReferenciaMulher: '' }]);
  };

  const updateAnalito = (index: number, field: keyof TemplateAnalito, value: string) => {
    setAnalitos(analitos.map((a, i) => (i === index ? { ...a, [field]: value } : a)));
  };

  const removeAnalito = (index: number) => {
    setAnalitos(analitos.filter((_, i) => i !== index));
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 space-y-4">
      <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Novo Template</h3>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Nome</label>
          <input
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 dark:bg-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
            placeholder="Hemograma Completo"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Tipo de Exame</label>
          <select
            value={tipoExame}
            onChange={(e) => setTipoExame(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 dark:bg-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            {tiposExame.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Analitos</label>
          <button
            type="button"
            onClick={addAnalito}
            className="text-xs text-violet-600 hover:text-violet-700 font-medium"
          >
            + Adicionar analito
          </button>
        </div>

        <div className="space-y-2">
          {analitos.map((a, i) => (
            <div key={i} className="flex gap-2 items-start">
              <input
                type="text"
                placeholder="Analito"
                value={a.analito}
                onChange={(e) => updateAnalito(i, 'analito', e.target.value)}
                className="flex-1 px-2 py-1.5 text-xs border border-slate-200 dark:border-slate-600 dark:bg-slate-700 rounded focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
              <input
                type="text"
                placeholder="Unidade"
                value={a.unidade}
                onChange={(e) => updateAnalito(i, 'unidade', e.target.value)}
                className="w-20 px-2 py-1.5 text-xs border border-slate-200 dark:border-slate-600 dark:bg-slate-700 rounded focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
              <input
                type="text"
                placeholder="Ref. Homem"
                value={a.valorReferenciaHomem ?? ''}
                onChange={(e) => updateAnalito(i, 'valorReferenciaHomem', e.target.value)}
                className="w-28 px-2 py-1.5 text-xs border border-slate-200 dark:border-slate-600 dark:bg-slate-700 rounded focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
              <input
                type="text"
                placeholder="Ref. Mulher"
                value={a.valorReferenciaMulher ?? ''}
                onChange={(e) => updateAnalito(i, 'valorReferenciaMulher', e.target.value)}
                className="w-28 px-2 py-1.5 text-xs border border-slate-200 dark:border-slate-600 dark:bg-slate-700 rounded focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
              <button
                type="button"
                onClick={() => removeAnalito(i)}
                className="text-red-400 hover:text-red-600 text-xs px-1"
              >
                x
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={() => onSave({ nome, tipo_exame: tipoExame, analitos: analitos.filter((a) => a.analito) })}
          className="px-4 py-2 bg-violet-500 text-white text-sm font-medium rounded-lg hover:bg-violet-600 transition-colors"
        >
          Salvar Template
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

export default function TemplatesPage() {
  const { data: templates, isLoading } = useTemplates();
  const createMutation = useCreateTemplate();
  const [showEditor, setShowEditor] = useState(false);

  const handleSave = async (data: { nome: string; tipo_exame: string; analitos: TemplateAnalito[] }) => {
    await createMutation.mutateAsync(data);
    setShowEditor(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Templates de Exame</h2>
          <p className="text-sm text-slate-500 mt-1">Modelos reutilizaveis para criacao de laudos</p>
        </div>
        {!showEditor && (
          <button
            type="button"
            onClick={() => setShowEditor(true)}
            className="px-4 py-2 bg-violet-500 text-white text-sm font-medium rounded-lg hover:bg-violet-600 transition-colors"
          >
            + Novo Template
          </button>
        )}
      </div>

      {showEditor && (
        <TemplateEditor onSave={handleSave} onCancel={() => setShowEditor(false)} />
      )}

      {isLoading ? (
        <div className="animate-pulse space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-slate-200 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(templates ?? []).map((tmpl) => (
            <div
              key={tmpl.id}
              className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5"
            >
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{tmpl.nome}</h3>
              <p className="text-xs text-slate-500 mt-0.5">{tmpl.tipo_exame}</p>
              <div className="mt-3 flex flex-wrap gap-1">
                {tmpl.analitos.slice(0, 5).map((a) => (
                  <span key={a.analito} className="inline-flex text-[10px] px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded">
                    {a.analito}
                  </span>
                ))}
                {tmpl.analitos.length > 5 && (
                  <span className="text-[10px] text-slate-400">+{tmpl.analitos.length - 5}</span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-2">{tmpl.analitos.length} analitos</p>
            </div>
          ))}
          {(templates ?? []).length === 0 && !isLoading && (
            <p className="col-span-3 text-center text-sm text-slate-400 py-12">Nenhum template cadastrado.</p>
          )}
        </div>
      )}
    </div>
  );
}

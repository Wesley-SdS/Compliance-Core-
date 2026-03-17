'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateObra } from '@/hooks/use-obras';
import { toast } from '@/components/ui/use-toast';

const ETAPAS_OPTIONS = [
  'Fundacao',
  'Estrutura',
  'Alvenaria',
  'Instalacoes Hidraulicas',
  'Instalacoes Eletricas',
  'Acabamento',
  'Pintura',
  'Cobertura',
] as const;

const TIPO_OBRA_OPTIONS = [
  'RESIDENCIAL',
  'COMERCIAL',
  'INDUSTRIAL',
  'INFRAESTRUTURA',
  'REFORMA',
  'MISTA',
] as const;

const obraSchema = z.object({
  nome: z.string().min(3, 'Nome obrigatorio'),
  endereco: z.string().min(5, 'Endereco obrigatorio'),
  responsavel: z.string().min(3, 'Responsavel obrigatorio'),
  tipoObra: z.enum(['RESIDENCIAL', 'COMERCIAL', 'INDUSTRIAL', 'INFRAESTRUTURA', 'REFORMA', 'MISTA']),
  areaM2: z.coerce.number().positive('Area deve ser positiva'),
  numeroPavimentos: z.coerce.number().int().positive(),
  inicioPrevisao: z.string().min(1, 'Data de inicio obrigatoria'),
  fimPrevisao: z.string().min(1, 'Previsao de termino obrigatoria'),
  cnpjConstrutora: z.string().optional(),
  creaResponsavel: z.string().optional(),
  etapas: z.array(z.string()).min(1, 'Selecione ao menos uma etapa'),
});

type ObraFormData = z.infer<typeof obraSchema>;

export default function NovaObraPage() {
  const router = useRouter();
  const createObra = useCreateObra();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ObraFormData>({
    resolver: zodResolver(obraSchema),
    defaultValues: {
      tipoObra: 'RESIDENCIAL',
      etapas: [],
    },
  });

  const selectedEtapas = watch('etapas') ?? [];

  function toggleEtapa(etapa: string) {
    const current = selectedEtapas;
    if (current.includes(etapa)) {
      setValue('etapas', current.filter((e) => e !== etapa), { shouldValidate: true });
    } else {
      setValue('etapas', [...current, etapa], { shouldValidate: true });
    }
  }

  async function onSubmit(data: ObraFormData) {
    try {
      const result = await createObra.mutateAsync(data);
      toast({
        title: 'Obra criada com sucesso',
        description: `A obra "${data.nome}" foi cadastrada.`,
      });
      router.push(`/obras/${result.id}`);
    } catch {
      toast({
        title: 'Erro ao criar obra',
        description: 'Verifique os dados e tente novamente.',
        variant: 'destructive',
      });
    }
  }

  const inputClass =
    'w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent';
  const labelClass = 'block text-sm font-medium text-slate-700 mb-1';
  const errorClass = 'text-xs text-red-500 mt-1';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-800">Nova Obra</h2>
        <p className="text-sm text-slate-500 mt-1">Preencha os dados para cadastrar uma nova obra</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
          <h3 className="text-sm font-semibold text-slate-800">Informacoes Gerais</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={labelClass}>Nome da Obra</label>
              <input {...register('nome')} className={inputClass} placeholder="Ex: Residencial Parque das Flores" />
              {errors.nome && <p className={errorClass}>{errors.nome.message}</p>}
            </div>

            <div>
              <label className={labelClass}>Responsavel</label>
              <input {...register('responsavel')} className={inputClass} placeholder="Nome do responsavel" />
              {errors.responsavel && <p className={errorClass}>{errors.responsavel.message}</p>}
            </div>
          </div>

          <div>
            <label className={labelClass}>Endereco</label>
            <input {...register('endereco')} className={inputClass} placeholder="Endereco completo da obra" />
            {errors.endereco && <p className={errorClass}>{errors.endereco.message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className={labelClass}>Tipo de Obra</label>
              <select {...register('tipoObra')} className={inputClass}>
                {TIPO_OBRA_OPTIONS.map((tipo) => (
                  <option key={tipo} value={tipo}>
                    {tipo.charAt(0) + tipo.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>Area (m2)</label>
              <input {...register('areaM2')} type="number" step="0.01" className={inputClass} placeholder="0.00" />
              {errors.areaM2 && <p className={errorClass}>{errors.areaM2.message}</p>}
            </div>

            <div>
              <label className={labelClass}>Numero de Pavimentos</label>
              <input {...register('numeroPavimentos')} type="number" className={inputClass} placeholder="1" />
              {errors.numeroPavimentos && <p className={errorClass}>{errors.numeroPavimentos.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={labelClass}>Inicio Previsto</label>
              <input {...register('inicioPrevisao')} type="date" className={inputClass} />
              {errors.inicioPrevisao && <p className={errorClass}>{errors.inicioPrevisao.message}</p>}
            </div>

            <div>
              <label className={labelClass}>Termino Previsto</label>
              <input {...register('fimPrevisao')} type="date" className={inputClass} />
              {errors.fimPrevisao && <p className={errorClass}>{errors.fimPrevisao.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={labelClass}>CNPJ Construtora (opcional)</label>
              <input {...register('cnpjConstrutora')} className={inputClass} placeholder="00.000.000/0000-00" />
            </div>

            <div>
              <label className={labelClass}>CREA Responsavel (opcional)</label>
              <input {...register('creaResponsavel')} className={inputClass} placeholder="CREA-XX 000000" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <h3 className="text-sm font-semibold text-slate-800">Etapas da Obra</h3>
          <p className="text-xs text-slate-500">Selecione as etapas que compoem esta obra</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {ETAPAS_OPTIONS.map((etapa) => {
              const checked = selectedEtapas.includes(etapa);
              return (
                <label
                  key={etapa}
                  className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                    checked ? 'border-amber-500 bg-amber-50' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleEtapa(etapa)}
                    className="w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                  />
                  <span className="text-sm text-slate-700">{etapa}</span>
                </label>
              );
            })}
          </div>
          {errors.etapas && <p className={errorClass}>{errors.etapas.message}</p>}
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={createObra.isPending}
            className="px-6 py-2 bg-amber-500 text-white text-sm font-medium rounded-lg hover:bg-amber-600 disabled:opacity-50 transition-colors"
          >
            {createObra.isPending ? 'Criando...' : 'Criar Obra'}
          </button>
        </div>
      </form>
    </div>
  );
}

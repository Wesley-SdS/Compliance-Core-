import { api } from '@/lib/api';

interface Documento {
  id: string;
  nome: string;
  categoria: string;
  clinica: string;
  validade: string;
  status: 'vencido' | 'valido' | 'vencendo';
}

const categorias = ['Todos', 'Alvara', 'Licenca', 'Certificado', 'POP', 'Outro'];
const statusFilters = ['Todos', 'Valido', 'Vencendo', 'Vencido'];

async function getDocumentos(): Promise<Documento[]> {
  try {
    return await api<Documento[]>('/documentos');
  } catch {
    return [];
  }
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    valido: 'bg-green-100 text-green-700',
    vencendo: 'bg-amber-100 text-amber-700',
    vencido: 'bg-red-100 text-red-700',
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] ?? 'bg-gray-100 text-gray-700'}`}
    >
      {status}
    </span>
  );
}

export default async function DocumentosPage() {
  const documentos = await getDocumentos();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documentos</h1>
          <p className="mt-1 text-sm text-gray-500">
            {documentos.length} documentos cadastrados
          </p>
        </div>
        <button
          type="button"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
        >
          Upload Documento
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Categoria</label>
          <div className="flex gap-2">
            {categorias.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  cat === 'Todos'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
          <div className="flex gap-2">
            {statusFilters.map((s) => (
              <button
                key={s}
                type="button"
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  s === 'Todos'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl bg-green-50 border border-green-200 p-4 text-center">
          <div className="text-2xl font-bold text-green-700">
            {documentos.filter((d) => d.status === 'valido').length}
          </div>
          <div className="text-xs text-green-600 font-medium">Validos</div>
        </div>
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-center">
          <div className="text-2xl font-bold text-amber-700">
            {documentos.filter((d) => d.status === 'vencendo').length}
          </div>
          <div className="text-xs text-amber-600 font-medium">Vencendo</div>
        </div>
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-center">
          <div className="text-2xl font-bold text-red-700">
            {documentos.filter((d) => d.status === 'vencido').length}
          </div>
          <div className="text-xs text-red-600 font-medium">Vencidos</div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                Nome
              </th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                Categoria
              </th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                Clinica
              </th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                Validade
              </th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {documentos.length > 0 ? (
              documentos.map((doc) => (
                <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {doc.nome}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {doc.categoria}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {doc.clinica}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {doc.validade}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={doc.status} />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-8 text-center text-sm text-gray-500"
                >
                  Nenhum documento encontrado. Verifique a conexao com a API ou
                  faca upload de um novo documento.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

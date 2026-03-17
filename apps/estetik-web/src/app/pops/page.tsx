'use client';

import { useState, useEffect } from 'react';
import { useGeneratePop, usePops, useApprovePop } from '@/hooks/use-pops';
import { useClinicas } from '@/hooks/use-clinicas';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  Wand2,
  Plus,
  FileText,
  CheckCircle2,
  Clock,
  Archive,
  ArrowLeft,
  Printer,
  Pencil,
  Save,
  Loader2,
  Sparkles,
  History,
  ThumbsUp,
} from 'lucide-react';

interface Pop {
  id: string;
  titulo: string;
  procedimentoTipo: string;
  versao: number;
  status: 'RASCUNHO' | 'APROVADO' | 'OBSOLETO';
  conteudo: string;
  criadoEm: string;
  atualizadoEm: string;
  clinicaId: string;
}

const PROCEDIMENTOS = [
  'Toxina Botulinica (Botox)',
  'Preenchimento com Acido Hialuronico',
  'Laser CO2 Fracionado',
  'Peeling Quimico',
  'Microagulhamento',
  'Criolipolise',
  'Radiofrequencia',
  'Limpeza de Pele Profunda',
  'Depilacao a Laser',
  'Bioestimulador de Colageno',
];

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  RASCUNHO: {
    label: 'Rascunho',
    color: 'bg-amber-100 text-amber-800 border-amber-200',
    icon: <Clock className="h-3 w-3" />,
  },
  APROVADO: {
    label: 'Aprovado',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  OBSOLETO: {
    label: 'Obsoleto',
    color: 'bg-gray-100 text-gray-600 border-gray-200',
    icon: <Archive className="h-3 w-3" />,
  },
};

function TypingEffect({ text }: { text: string }) {
  const [displayed, setDisplayed] = useState('');

  useEffect(() => {
    if (!text) return;
    setDisplayed('');
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(interval);
    }, 15);
    return () => clearInterval(interval);
  }, [text]);

  return <div className="whitespace-pre-wrap font-mono text-sm">{displayed}</div>;
}

function PopGenerationSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Sparkles className="h-5 w-5 animate-pulse text-indigo-500" />
        <p className="text-sm font-medium text-indigo-700">Gerando POP com IA...</p>
      </div>
      <div className="space-y-3 rounded-lg border border-indigo-100 bg-indigo-50/50 p-4">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-full" />
      </div>
    </div>
  );
}

function PopListSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function PopsPage() {
  const { data: popsData, isLoading: loadingPops } = usePops();
  const { data: clinicas } = useClinicas({ limit: 50 });
  const generatePop = useGeneratePop();
  const approvePop = useApprovePop();

  const [generatorOpen, setGeneratorOpen] = useState(false);
  const [selectedProcedimento, setSelectedProcedimento] = useState('');
  const [selectedClinicaId, setSelectedClinicaId] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [viewingPop, setViewingPop] = useState<Pop | null>(null);

  const { toast } = useToast();
  const pops: Pop[] = (popsData as Pop[]) ?? [];

  async function handleGenerate() {
    if (!selectedProcedimento) return;
    setIsGenerating(true);
    setGeneratedContent('');

    try {
      const result = await generatePop.mutateAsync({
        procedimentoTipo: selectedProcedimento,
        clinicaId: selectedClinicaId || clinicas?.data?.[0]?.id || '',
      });
      const content = result.conteudo || result.content || '';
      setGeneratedContent(content);
      setEditContent(content);
    } catch (error: any) {
      toast({ title: 'Erro ao gerar POP', description: error.message, variant: 'destructive' });
    } finally {
      setIsGenerating(false);
    }
  }

  function handleSaveAsDocument() {
    generatePop.mutate({
      procedimentoTipo: selectedProcedimento,
      clinicaId: selectedClinicaId || clinicas?.data?.[0]?.id || '',
    });
    setGeneratorOpen(false);
    setGeneratedContent('');
    setSelectedProcedimento('');
    setIsEditing(false);
  }

  function handleApprove(popId: string) {
    approvePop.mutate(popId);
  }

  // POP Detail view
  if (viewingPop) {
    const config = STATUS_CONFIG[viewingPop.status] ?? STATUS_CONFIG.RASCUNHO;
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1"
            onClick={() => setViewingPop(null)}
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">{viewingPop.titulo}</h1>
            <p className="text-sm text-gray-500">
              {viewingPop.procedimentoTipo} | Versao {viewingPop.versao}
            </p>
          </div>
          <Badge className={`flex items-center gap-1 ${config.color}`}>
            {config.icon}
            {config.label}
          </Badge>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="prose prose-sm max-w-none whitespace-pre-wrap text-gray-700">
              {viewingPop.conteudo || 'Conteudo nao disponivel.'}
            </div>
          </CardContent>
        </Card>

        {/* Version History */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <History className="h-4 w-4" />
              Historico de Versoes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Versao {viewingPop.versao}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(viewingPop.atualizadoEm || viewingPop.criadoEm).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <Badge variant="outline" className="text-xs">
                  Atual
                </Badge>
              </div>
              {viewingPop.versao > 1 && (
                <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Versao {viewingPop.versao - 1}
                    </p>
                    <p className="text-xs text-gray-500">Versao anterior</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3">
          {viewingPop.status === 'RASCUNHO' && (
            <Button
              onClick={() => handleApprove(viewingPop.id)}
              disabled={approvePop.isPending}
              className="gap-1"
            >
              {approvePop.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ThumbsUp className="h-4 w-4" />
              )}
              Aprovar POP
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => window.print()}
            className="gap-1"
          >
            <Printer className="h-4 w-4" />
            Imprimir
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gerador de POP</h1>
          <p className="mt-1 text-sm text-gray-500">
            Procedimentos Operacionais Padrao gerados com IA.
          </p>
        </div>

        <Button onClick={() => setGeneratorOpen(true)} className="gap-1">
          <Plus className="h-4 w-4" />
          Gerar Novo POP
        </Button>
      </div>

      {/* Generator Dialog */}
      <Dialog open={generatorOpen} onOpenChange={setGeneratorOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wand2 className="h-5 w-5 text-indigo-600" />
              Gerar Novo POP
            </DialogTitle>
            <DialogDescription>
              Selecione o procedimento e a clinica para gerar um POP com IA.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Tipo de Procedimento
              </label>
              <Select value={selectedProcedimento} onValueChange={setSelectedProcedimento}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o procedimento" />
                </SelectTrigger>
                <SelectContent>
                  {PROCEDIMENTOS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Clinica
              </label>
              <Select value={selectedClinicaId} onValueChange={setSelectedClinicaId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a clinica" />
                </SelectTrigger>
                <SelectContent>
                  {clinicas?.data?.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {!generatedContent && !isGenerating && (
              <Button
                onClick={handleGenerate}
                disabled={!selectedProcedimento}
                className="w-full gap-1"
              >
                <Sparkles className="h-4 w-4" />
                Gerar com IA
              </Button>
            )}

            {isGenerating && <PopGenerationSkeleton />}

            {generatedContent && !isGenerating && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900">POP Gerado</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsEditing(!isEditing);
                      if (!isEditing) setEditContent(generatedContent);
                    }}
                    className="gap-1"
                  >
                    <Pencil className="h-3 w-3" />
                    {isEditing ? 'Visualizar' : 'Editar'}
                  </Button>
                </div>

                {isEditing ? (
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={20}
                    className="font-mono text-sm"
                  />
                ) : (
                  <div className="max-h-[400px] overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <div className="prose prose-sm max-w-none whitespace-pre-wrap text-gray-700">
                      {generatedContent}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {generatedContent && !isGenerating && (
            <DialogFooter>
              <Button variant="outline" onClick={() => setGeneratorOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveAsDocument} className="gap-1">
                <Save className="h-4 w-4" />
                Salvar como Documento
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* POP List */}
      {loadingPops ? (
        <PopListSkeleton />
      ) : pops.length > 0 ? (
        <div className="space-y-3">
          {pops.map((pop) => {
            const config = STATUS_CONFIG[pop.status] ?? STATUS_CONFIG.RASCUNHO;
            return (
              <Card
                key={pop.id}
                className="cursor-pointer transition-shadow hover:shadow-md"
                onClick={() => setViewingPop(pop)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">
                        {pop.titulo}
                      </h3>
                      <p className="mt-1 text-xs text-gray-500">
                        {pop.procedimentoTipo} | Versao {pop.versao} |{' '}
                        {new Date(pop.criadoEm).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <Badge className={`flex items-center gap-1 ${config.color}`}>
                      {config.icon}
                      {config.label}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-3 text-sm text-gray-500">
              Nenhum POP gerado ainda.
            </p>
            <p className="mt-1 text-xs text-gray-400">
              Clique em &quot;Gerar Novo POP&quot; para criar seu primeiro procedimento.
            </p>
            <Button
              className="mt-4 gap-1"
              onClick={() => setGeneratorOpen(true)}
            >
              <Wand2 className="h-4 w-4" />
              Gerar Primeiro POP
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

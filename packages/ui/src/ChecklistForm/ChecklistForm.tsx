'use client';
import React, { useState, useMemo, useCallback } from 'react';
import type { Checklist, ChecklistResponse } from '@compliancecore/shared';

export interface ChecklistFormProps {
  checklist: Checklist;
  onSubmit: (responses: ChecklistResponse[]) => void;
  onSave?: (responses: ChecklistResponse[]) => void;
  readOnly?: boolean;
  className?: string;
}

type AnswerValue = 'SIM' | 'NAO' | 'NA' | 'PARCIAL';

const ANSWER_OPTIONS: { value: AnswerValue; label: string; color: string }[] = [
  { value: 'SIM', label: 'Sim', color: '#16A34A' },
  { value: 'NAO', label: 'Não', color: '#DC2626' },
  { value: 'PARCIAL', label: 'Parcial', color: '#D97706' },
  { value: 'NA', label: 'N/A', color: '#6B7280' },
];

export function ChecklistForm({
  checklist,
  onSubmit,
  onSave,
  readOnly = false,
  className,
}: ChecklistFormProps) {
  const [responses, setResponses] = useState<Map<string, { answer?: AnswerValue; notes: string }>>(
    () => {
      const initial = new Map<string, { answer?: AnswerValue; notes: string }>();
      for (const item of checklist.items) {
        initial.set(item.id, { answer: undefined, notes: '' });
      }
      return initial;
    }
  );

  const categories = useMemo(() => {
    const catMap = new Map<string, typeof checklist.items>();
    for (const item of checklist.items) {
      const existing = catMap.get(item.category) ?? [];
      existing.push(item);
      catMap.set(item.category, existing);
    }
    return catMap;
  }, [checklist.items]);

  const answeredCount = useMemo(() => {
    let count = 0;
    for (const resp of responses.values()) {
      if (resp.answer !== undefined) count++;
    }
    return count;
  }, [responses]);

  const totalItems = checklist.items.length;
  const progressPercent = totalItems > 0 ? Math.round((answeredCount / totalItems) * 100) : 0;

  const allRequiredAnswered = useMemo(() => {
    return checklist.items
      .filter((item) => item.required)
      .every((item) => responses.get(item.id)?.answer !== undefined);
  }, [checklist.items, responses]);

  const updateResponse = useCallback(
    (itemId: string, field: 'answer' | 'notes', value: string) => {
      setResponses((prev) => {
        const next = new Map(prev);
        const current = next.get(itemId) ?? { answer: undefined, notes: '' };
        if (field === 'answer') {
          next.set(itemId, { ...current, answer: value as AnswerValue });
        } else {
          next.set(itemId, { ...current, notes: value });
        }
        return next;
      });
    },
    []
  );

  function buildResponses(): ChecklistResponse[] {
    const result: ChecklistResponse[] = [];
    for (const [itemId, resp] of responses.entries()) {
      if (resp.answer) {
        result.push({
          itemId,
          answer: resp.answer,
          notes: resp.notes || undefined,
        });
      }
    }
    return result;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit(buildResponses());
  }

  function handleSave() {
    onSave?.(buildResponses());
  }

  return (
    <form
      className={className}
      onSubmit={handleSubmit}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
        maxWidth: 800,
      }}
    >
      {/* Progress bar */}
      <div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 6,
            fontSize: 13,
            color: '#6B7280',
          }}
        >
          <span>Progresso</span>
          <span>
            {answeredCount}/{totalItems} ({progressPercent}%)
          </span>
        </div>
        <div
          style={{
            height: 8,
            backgroundColor: '#E5E7EB',
            borderRadius: 4,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${progressPercent}%`,
              backgroundColor: progressPercent === 100 ? '#16A34A' : '#3B82F6',
              borderRadius: 4,
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      </div>

      {/* Categories */}
      {Array.from(categories.entries()).map(([category, items]) => (
        <div key={category}>
          <h3
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: '#111827',
              marginBottom: 12,
              paddingBottom: 8,
              borderBottom: '1px solid #E5E7EB',
            }}
          >
            {category}
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {items.map((item) => {
              const resp = responses.get(item.id);
              return (
                <div
                  key={item.id}
                  style={{
                    padding: 16,
                    backgroundColor: '#FAFAFA',
                    border: '1px solid #E5E7EB',
                    borderRadius: 8,
                  }}
                >
                  {/* Question */}
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 500,
                      color: '#111827',
                      marginBottom: 8,
                    }}
                  >
                    {item.question}
                    {item.required && (
                      <span style={{ color: '#DC2626', marginLeft: 4 }}>*</span>
                    )}
                  </div>

                  {item.helpText && (
                    <div
                      style={{
                        fontSize: 12,
                        color: '#9CA3AF',
                        marginBottom: 8,
                        fontStyle: 'italic',
                      }}
                    >
                      {item.helpText}
                    </div>
                  )}

                  {item.regulationRef && (
                    <div
                      style={{
                        fontSize: 11,
                        color: '#6B7280',
                        marginBottom: 10,
                        backgroundColor: '#F3F4F6',
                        padding: '2px 8px',
                        borderRadius: 4,
                        display: 'inline-block',
                      }}
                    >
                      Ref: {item.regulationRef}
                    </div>
                  )}

                  {/* Answer radio buttons */}
                  <div
                    style={{
                      display: 'flex',
                      gap: 8,
                      flexWrap: 'wrap',
                      marginBottom: 10,
                    }}
                  >
                    {ANSWER_OPTIONS.map((opt) => {
                      const isSelected = resp?.answer === opt.value;
                      return (
                        <label
                          key={opt.value}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '6px 12px',
                            borderRadius: 6,
                            border: `2px solid ${isSelected ? opt.color : '#D1D5DB'}`,
                            backgroundColor: isSelected ? `${opt.color}10` : '#FFFFFF',
                            cursor: readOnly ? 'default' : 'pointer',
                            fontSize: 13,
                            fontWeight: isSelected ? 600 : 400,
                            color: isSelected ? opt.color : '#374151',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <input
                            type="radio"
                            name={`item-${item.id}`}
                            value={opt.value}
                            checked={isSelected}
                            disabled={readOnly}
                            onChange={() => updateResponse(item.id, 'answer', opt.value)}
                            style={{ display: 'none' }}
                          />
                          <span
                            style={{
                              width: 16,
                              height: 16,
                              borderRadius: '50%',
                              border: `2px solid ${isSelected ? opt.color : '#D1D5DB'}`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {isSelected && (
                              <span
                                style={{
                                  width: 8,
                                  height: 8,
                                  borderRadius: '50%',
                                  backgroundColor: opt.color,
                                }}
                              />
                            )}
                          </span>
                          {opt.label}
                        </label>
                      );
                    })}
                  </div>

                  {/* Notes */}
                  <textarea
                    placeholder="Observações..."
                    value={resp?.notes ?? ''}
                    readOnly={readOnly}
                    onChange={(e) => updateResponse(item.id, 'notes', e.target.value)}
                    rows={2}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      fontSize: 13,
                      border: '1px solid #D1D5DB',
                      borderRadius: 6,
                      resize: 'vertical',
                      fontFamily: 'inherit',
                      boxSizing: 'border-box',
                      backgroundColor: readOnly ? '#F9FAFB' : '#FFFFFF',
                    }}
                  />

                  {/* Evidence upload button placeholder */}
                  {!readOnly && (
                    <button
                      type="button"
                      style={{
                        marginTop: 8,
                        padding: '6px 12px',
                        fontSize: 12,
                        color: '#3B82F6',
                        backgroundColor: 'transparent',
                        border: '1px dashed #93C5FD',
                        borderRadius: 4,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <span style={{ fontSize: 14 }}>{'\uD83D\uDCCE'}</span>
                      Anexar evidência
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Action buttons */}
      {!readOnly && (
        <div
          style={{
            display: 'flex',
            gap: 12,
            justifyContent: 'flex-end',
            paddingTop: 16,
            borderTop: '1px solid #E5E7EB',
          }}
        >
          {onSave && (
            <button
              type="button"
              onClick={handleSave}
              style={{
                padding: '10px 20px',
                fontSize: 14,
                fontWeight: 500,
                backgroundColor: '#FFFFFF',
                color: '#374151',
                border: '1px solid #D1D5DB',
                borderRadius: 6,
                cursor: 'pointer',
              }}
            >
              Salvar rascunho
            </button>
          )}
          <button
            type="submit"
            disabled={!allRequiredAnswered}
            style={{
              padding: '10px 20px',
              fontSize: 14,
              fontWeight: 600,
              backgroundColor: allRequiredAnswered ? '#3B82F6' : '#9CA3AF',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 6,
              cursor: allRequiredAnswered ? 'pointer' : 'not-allowed',
              opacity: allRequiredAnswered ? 1 : 0.7,
            }}
          >
            Enviar checklist
          </button>
        </div>
      )}
    </form>
  );
}

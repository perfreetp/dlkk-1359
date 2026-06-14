import { useState, useCallback } from 'react';
import type { SensitiveWord } from '../types';
import { detectSensitiveWords } from '../utils/sensitiveWords';

export function useSensitiveWord() {
  const [results, setResults] = useState<Map<string, SensitiveWord[]>>(new Map());

  const check = useCallback((content: string, id: string) => {
    const detected = detectSensitiveWords(content);
    setResults(prev => {
      const next = new Map(prev);
      next.set(id, detected);
      return next;
    });
    return detected;
  }, []);

  const checkAll = useCallback((contents: { id: string; content: string }[]) => {
    const newResults = new Map<string, SensitiveWord[]>();
    contents.forEach(({ id, content }) => {
      newResults.set(id, detectSensitiveWords(content));
    });
    setResults(newResults);
    return newResults;
  }, []);

  const getDangerCount = useCallback((id: string) => {
    const words = results.get(id) || [];
    return words.filter(w => w.level === 'danger').length;
  }, [results]);

  const getWarningCount = useCallback((id: string) => {
    const words = results.get(id) || [];
    return words.filter(w => w.level === 'warning').length;
  }, [results]);

  return { results, check, checkAll, getDangerCount, getWarningCount };
}

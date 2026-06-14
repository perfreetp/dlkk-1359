import { useState, useCallback } from 'react';
import { copyToClipboard } from '../utils/formatters';

export function useClipboard() {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copy = useCallback(async (text: string, id?: string) => {
    const success = await copyToClipboard(text);
    if (success && id) {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
    return success;
  }, []);

  const copied = copiedId !== null;

  return { copied, copiedId, copy };
}

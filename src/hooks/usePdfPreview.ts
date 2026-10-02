import { useEffect, useRef, useState } from 'react';
import { isDesktop, renderPdfPreview } from '../services/tauriBridge';
import type { ResumeProfile, ResumeTemplate } from '../types/resume';

interface PdfPreviewState {
  bytes: Uint8Array | null;
  error: string | null;
  isDesktop: boolean;
  isLoading: boolean;
}

const PREVIEW_DEBOUNCE_MS = 180;

export function usePdfPreview(
  profile: ResumeProfile,
  template: ResumeTemplate,
  enabled: boolean,
): PdfPreviewState {
  const desktop = isDesktop();
  const requestId = useRef(0);
  const [state, setState] = useState<Omit<PdfPreviewState, 'isDesktop'>>({
    bytes: null,
    error: null,
    isLoading: desktop && enabled,
  });

  useEffect(() => {
    if (!desktop || !enabled) {
      setState((current) => ({ ...current, error: null, isLoading: false }));
      return undefined;
    }

    const currentRequest = requestId.current + 1;
    requestId.current = currentRequest;
    setState((current) => ({ ...current, error: null, isLoading: true }));

    const timeout = window.setTimeout(() => {
      void renderPdfPreview(profile, template)
        .then((bytes) => {
          if (requestId.current !== currentRequest) return;
          setState({ bytes, error: null, isLoading: false });
        })
        .catch((error: unknown) => {
          if (requestId.current !== currentRequest) return;
          setState((current) => ({
            ...current,
            error: error instanceof Error ? error.message : String(error),
            isLoading: false,
          }));
        });
    }, PREVIEW_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeout);
      if (requestId.current === currentRequest) requestId.current += 1;
    };
  }, [desktop, enabled, profile, template]);

  return { ...state, isDesktop: desktop };
}

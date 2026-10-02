import {
  AnnotationMode,
  GlobalWorkerOptions,
  RenderingCancelledException,
  getDocument,
} from 'pdfjs-dist/legacy/build/pdf.mjs';
import pdfWorkerUrl from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url';
import type {
  PDFDocumentLoadingTask,
  PDFDocumentProxy,
  PDFPageProxy,
} from 'pdfjs-dist/types/src/display/api';
import { useEffect, useRef, useState } from 'react';
import { A4_PREVIEW_WIDTH } from '../../domain/previewScale';

GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

interface PdfDocumentPreviewProps {
  bytes: Uint8Array;
  onError: (message: string | null) => void;
  onPageCount: (count: number) => void;
}

export function PdfDocumentPreview({ bytes, onError, onPageCount }: PdfDocumentPreviewProps) {
  const activeTask = useRef<PDFDocumentLoadingTask | null>(null);
  const [document, setDocument] = useState<PDFDocumentProxy | null>(null);

  useEffect(() => {
    let cancelled = false;
    let resolved = false;
    const loadingTask = getDocument({ data: bytes.slice() });

    void loadingTask.promise
      .then((nextDocument) => {
        resolved = true;
        if (cancelled) {
          void loadingTask.destroy();
          return;
        }
        const previousTask = activeTask.current;
        activeTask.current = loadingTask;
        setDocument(nextDocument);
        onPageCount(nextDocument.numPages);
        onError(null);
        if (previousTask && previousTask !== loadingTask) void previousTask.destroy();
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        onError(error instanceof Error ? error.message : String(error));
      });

    return () => {
      cancelled = true;
      if (!resolved) void loadingTask.destroy();
    };
  }, [bytes, onError, onPageCount]);

  useEffect(() => () => {
    if (activeTask.current) void activeTask.current.destroy();
  }, []);

  if (!document) return <PdfProofSkeleton />;

  return (
    <div className="pdf-proof-document" aria-label={`Prova final do PDF, ${document.numPages} páginas`}>
      {Array.from({ length: document.numPages }, (_, index) => (
        <PdfPageCanvas document={document} pageNumber={index + 1} key={`${document.fingerprints[0]}-${index + 1}`} />
      ))}
    </div>
  );
}

function PdfPageCanvas({ document, pageNumber }: { document: PDFDocumentProxy; pageNumber: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let page: PDFPageProxy | null = null;
    let renderTask: ReturnType<PDFPageProxy['render']> | null = null;

    void document.getPage(pageNumber)
      .then((loadedPage) => {
        page = loadedPage;
        if (cancelled) return;
        const canvas = canvasRef.current;
        const context = canvas?.getContext('2d', { alpha: false });
        if (!canvas || !context) throw new Error('Canvas indisponível para renderizar o PDF.');

        const baseViewport = loadedPage.getViewport({ scale: 1 });
        const scale = A4_PREVIEW_WIDTH / baseViewport.width;
        const viewport = loadedPage.getViewport({ scale });
        const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.floor(viewport.width * pixelRatio);
        canvas.height = Math.floor(viewport.height * pixelRatio);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        renderTask = loadedPage.render({
          annotationMode: AnnotationMode.DISABLE,
          background: '#ffffff',
          canvas,
          canvasContext: context,
          transform: pixelRatio === 1 ? undefined : [pixelRatio, 0, 0, pixelRatio, 0, 0],
          viewport,
        });
        return renderTask.promise;
      })
      .then(() => {
        if (!cancelled) setError(null);
      })
      .catch((renderError: unknown) => {
        if (cancelled || renderError instanceof RenderingCancelledException) return;
        setError(renderError instanceof Error ? renderError.message : String(renderError));
      });

    return () => {
      cancelled = true;
      renderTask?.cancel();
      page?.cleanup();
    };
  }, [document, pageNumber]);

  return (
    <figure className="pdf-proof-page" aria-label={`Página ${pageNumber}`}>
      <canvas ref={canvasRef} />
      {error ? <figcaption>Falha ao renderizar a página {pageNumber}: {error}</figcaption> : null}
    </figure>
  );
}

function PdfProofSkeleton() {
  return (
    <div className="pdf-proof-skeleton" role="status">
      <span />
      <span />
      <span />
      <small>Preparando PDF final…</small>
    </div>
  );
}

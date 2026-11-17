// SlideMaker Public: 履歴詳細 — 選択した生成の画像を署名付きURLで表示・ダウンロード
// docs/REQUIREMENTS.md §11「選択で getSignedUrlForGeneratedImage による画像表示・ダウンロード」

import { useEffect, useState } from 'react';
import { getSignedUrlForGeneratedImage } from '../../lib/storage/generatedImages';
import type { GeneratedImageMeta } from '../../lib/storage/generatedImages';
import { generateImagesPdf } from '../../lib/pdf/generate';
import { Notice } from '../common/Notice';

interface GenerationImageGridProps {
  generationId: string;
  images: GeneratedImageMeta[];
}

// 署名付きURLの画像を取得して、data: プレフィックスなしの base64 にする（PDF 生成用）。
const fetchImageAsBase64 = async (url: string): Promise<string> => {
  const response = await fetch(url);
  if (!response.ok) throw new Error('画像の取得に失敗しました');
  const blob = await response.blob();
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result);
      resolve(result.slice(result.indexOf(',') + 1));
    };
    reader.onerror = () => reject(new Error('画像の読み込みに失敗しました'));
    reader.readAsDataURL(blob);
  });
};

interface ResolvedImage {
  meta: GeneratedImageMeta;
  url: string;
}

export function GenerationImageGrid({ generationId, images }: GenerationImageGridProps) {
  const [resolved, setResolved] = useState<ResolvedImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const handlePdf = async (targets: ResolvedImage[]) => {
    setPdfBusy(true);
    setPdfError(null);
    try {
      const base64s = await Promise.all(targets.map(({ url }) => fetchImageAsBase64(url)));
      await generateImagesPdf(base64s);
    } catch (err) {
      setPdfError(err instanceof Error ? err.message : 'PDFの生成に失敗しました');
    } finally {
      setPdfBusy(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all(
      images.map(async (meta) => ({ meta, url: await getSignedUrlForGeneratedImage(meta.storage_path) }))
    )
      .then((results) => {
        if (!cancelled) setResolved(results);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : '画像の取得に失敗しました');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [generationId, images]);

  if (loading) return <div className="loading">画像を読み込み中...</div>;
  if (error) return <Notice kind="error" message={error} />;

  return (
    <>
      {pdfError && <Notice kind="error" message={pdfError} />}
      {resolved.length > 1 && (
        <div className="btn-row">
          <button type="button" className="btn-sm" disabled={pdfBusy} onClick={() => void handlePdf(resolved)}>
            {pdfBusy ? 'PDF生成中...' : `全${resolved.length}枚をまとめてPDFダウンロード`}
          </button>
        </div>
      )}
      <div className="image-grid">
        {resolved.map((item, index) => (
          <div className="image-card" key={item.meta.storage_path}>
            <img src={item.url} alt={`生成画像 ${index + 1}`} />
            <div className="btn-row">
              <a className="btn btn-sm" href={item.url} download={`${generationId}_${index + 1}.png`}>
                ダウンロード
              </a>
              <button type="button" className="btn-sm" disabled={pdfBusy} onClick={() => void handlePdf([item])}>
                PDFダウンロード
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

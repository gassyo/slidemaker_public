// SlideMaker Public: F2 生成結果1枚分 — PNG / 単スライドPPT / PDF ダウンロード

import { useState } from 'react';
import { generateSlideImagePowerPoint } from '../../lib/ppt/generate';
import { generateImagesPdf } from '../../lib/pdf/generate';
import type { GeneratedImage } from '../../types';
import { Notice } from '../common/Notice';

interface ImageResultCardProps {
  image: GeneratedImage;
  index: number;
  cropTopPx: number;
  cropBottomPx: number;
}

export function ImageResultCard({ image, index, cropTopPx, cropBottomPx }: ImageResultCardProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePptDownload = async () => {
    setBusy(true);
    setError(null);
    try {
      await generateSlideImagePowerPoint(
        [{ title: '', base64Image: image.base64Data }],
        cropTopPx,
        cropBottomPx,
        image.fullPrompt,
        image.bottomLeftUrl
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'PPTの生成に失敗しました');
    } finally {
      setBusy(false);
    }
  };

  const handlePdfDownload = async () => {
    setBusy(true);
    setError(null);
    try {
      await generateImagesPdf([image.base64Data], image.fullPrompt);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'PDFの生成に失敗しました');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="image-card">
      <img src={image.url} alt={`生成画像 ${index + 1}`} />
      <div className="btn-row">
        <a className="btn btn-sm" href={image.url} download={`slidemakerpublic_free_${index + 1}.png`}>
          PNGダウンロード
        </a>
        <button type="button" className="btn-sm" onClick={() => void handlePptDownload()} disabled={busy}>
          {busy ? '生成中...' : '単スライドPPTダウンロード'}
        </button>
        <button type="button" className="btn-sm" onClick={() => void handlePdfDownload()} disabled={busy}>
          PDFダウンロード
        </button>
      </div>
      {error && <Notice kind="error" message={error} />}
    </div>
  );
}

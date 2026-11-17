// SlideMaker Public: PDF 生成（F1 全ページ / F2 単画像 / 履歴）
// 各画像を1ページとして書き出す。ページサイズは画像そのものの縦横比に合わせ、クロップはしない
// （PPT のような 16:9 固定・上下カットは行わない。見たままの画像を PDF にする）。
// jsPDF は PDF 出力時にだけ動的 import し、初期表示のバンドルを増やさない。

import { buildDownloadFileName } from '../ppt/generate';

// CSS px（96dpi）→ pt（72dpi）
const PX_TO_PT = 0.75;

const loadImageSize = (dataUrl: string): Promise<{ width: number; height: number }> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error('画像の読み込みに失敗しました'));
    img.src = dataUrl;
  });

/**
 * base64 の PNG 画像群から、1枚1ページの PDF を生成してダウンロードする。
 * @param base64Images PNG の base64（data:... プレフィックスなし）
 * @param prompt ファイル名の元にする文字列（任意）
 */
export const generateImagesPdf = async (base64Images: string[], prompt?: string): Promise<void> => {
  if (base64Images.length === 0) {
    throw new Error('画像が指定されていません');
  }

  const { jsPDF } = await import('jspdf');

  let doc: InstanceType<typeof jsPDF> | null = null;

  for (const base64 of base64Images) {
    const dataUrl = `data:image/png;base64,${base64}`;
    const { width, height } = await loadImageSize(dataUrl);
    const pageW = width * PX_TO_PT;
    const pageH = height * PX_TO_PT;
    const orientation = pageW >= pageH ? 'landscape' : 'portrait';

    if (!doc) {
      doc = new jsPDF({ orientation, unit: 'pt', format: [pageW, pageH], compress: true });
    } else {
      doc.addPage([pageW, pageH], orientation);
    }
    doc.addImage(dataUrl, 'PNG', 0, 0, pageW, pageH, undefined, 'FAST');
  }

  doc?.save(buildDownloadFileName('slides', prompt, 'pdf'));
};

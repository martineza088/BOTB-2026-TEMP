import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
GlobalWorkerOptions.workerSrc = workerUrl;

export async function readPdf(file, onProgress = () => {}) {
  if (!file || !/\.pdf$/i.test(file.name)) throw new Error('Choose a PDF file.');
  if (file.size > 20 * 1024 * 1024) throw new Error('Choose a PDF smaller than 20 MB.');
  const task = getDocument({ data: new Uint8Array(await file.arrayBuffer()), isEvalSupported: false });
  let document;
  try {
    document = await task.promise;
    if (document.numPages > 100) throw new Error('Use a packet with 100 pages or fewer.');
    const pages = [];
    for (let number = 1; number <= document.numPages; number++) {
      const page = await document.getPage(number);
      const content = await page.getTextContent();
      pages.push({ number, text: content.items.map(item => item.str ?? '').join(' ').replace(/\s+/g, ' ').trim() });
      page.cleanup();
      onProgress(number, document.numPages);
    }
    if (pages.every(page => page.text.length < 20)) throw new Error('This PDF has little readable text. Export a text-based PDF or add OCR before uploading.');
    return pages;
  } catch (error) {
    if (error.name === 'PasswordException') throw new Error('This PDF is password protected. Upload an unlocked copy.');
    if (error.name === 'InvalidPDFException') throw new Error('This file could not be read as a PDF. Try exporting it again.');
    throw error;
  } finally {
    await task.destroy();
  }
}

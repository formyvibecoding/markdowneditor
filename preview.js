export function exportMultipagePDF(contentArea, html2pdfLib = html2pdf) {
  const opt = {
    margin: [10, 0],
    filename: 'markdown-preview.pdf',
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };
  return html2pdfLib().from(contentArea).set(opt).save();
}

export function exportSinglePagePDF(contentArea, html2canvasLib = html2canvas, jsPDFLib = window.jspdf.jsPDF) {
  const A4_WIDTH_MM = 210;
  const A4_CONTENT_WIDTH_PX = 794;
  const originalStyle = contentArea.getAttribute('style') || '';
  contentArea.style.width = A4_CONTENT_WIDTH_PX + 'px';
  contentArea.style.margin = '0 auto';
  contentArea.style.padding = '10mm';
  contentArea.style.overflow = 'visible';
  contentArea.style.boxShadow = 'none';

  return html2canvasLib(contentArea, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    width: A4_CONTENT_WIDTH_PX,
    windowWidth: A4_CONTENT_WIDTH_PX
  })
    .then(canvas => {
      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      const pdf = new jsPDFLib({
        orientation: 'portrait',
        unit: 'mm',
        format: [A4_WIDTH_MM, (canvas.height * A4_WIDTH_MM) / canvas.width]
      });
      pdf.addImage(imgData, 'JPEG', 0, 0, A4_WIDTH_MM, (canvas.height * A4_WIDTH_MM) / canvas.width);
      pdf.save('markdown-preview-single-page.pdf');
    })
    .finally(() => {
      contentArea.setAttribute('style', originalStyle);
    });
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    const contentArea = document.getElementById('content');
    const defaultDownloadBtn = document.getElementById('download-pdf-btn');
    const singlePageDownloadBtn = document.getElementById('download-single-page-pdf-btn');

    defaultDownloadBtn.addEventListener('click', () => {
      exportMultipagePDF(contentArea);
    });

    singlePageDownloadBtn.addEventListener('click', () => {
      exportSinglePagePDF(contentArea);
    });
  });
}

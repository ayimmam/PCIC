import html2canvas from "html2canvas";
import jsPDF from "jspdf";

/**
 * Export a DOM element to a multi-page A4 PDF.
 * @param {HTMLElement} element  The DOM element to capture
 * @param {string} filename     Name for the downloaded file
 */
export async function exportReportToPDF(element, filename = "PCIC-Report.pdf") {
  if (!element) return;

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: "#ffffff",
    windowWidth: 900,
  });

  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF("p", "mm", "a4");

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  const margin = 10;
  const contentWidth = pdfWidth - margin * 2;

  const imgWidth = canvas.width;
  const imgHeight = canvas.height;
  const ratio = contentWidth / imgWidth;
  const scaledHeight = imgHeight * ratio;
  const pageContentHeight = pdfHeight - margin * 2;

  let heightLeft = scaledHeight;
  let position = 0;
  let page = 0;

  while (heightLeft > 0) {
    if (page > 0) {
      pdf.addPage();
    }

    pdf.addImage(
      imgData,
      "PNG",
      margin,
      margin - position,
      contentWidth,
      scaledHeight
    );

    heightLeft -= pageContentHeight;
    position += pageContentHeight;
    page++;
  }

  pdf.save(filename);
}

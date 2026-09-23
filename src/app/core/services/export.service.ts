import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Injectable({ providedIn: 'root' })
export class ExportService {

  // ── Excel genérico ──────────────────────────────────────────────────────────
  toExcel(rows: Record<string, any>[], fileName: string, sheetName = 'Hoja1') {
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `${fileName}.xlsx`);
  }

  // ── PDF genérico con logo ───────────────────────────────────────────────────
  toPDF(
    title: string,
    subtitle: string,
    columns: string[],
    rows: (string | number)[][],
    fileName: string
  ) {
    const doc = new jsPDF({ orientation: 'landscape' });

    // cabecera
    doc.setFillColor(31, 36, 40);
    doc.rect(0, 0, 297, 18, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('INVENTIO — Sistema de gestión de inventario', 10, 12);

    // título
    doc.setTextColor(255, 90, 0);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 10, 28);

    doc.setTextColor(120, 120, 120);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(subtitle, 10, 34);

    // tabla
    autoTable(doc, {
      startY: 40,
      head: [columns],
      body: rows,
      headStyles: {
        fillColor: [255, 90, 0],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 8,
      },
      bodyStyles: { fontSize: 8 },
      alternateRowStyles: { fillColor: [248, 248, 248] },
      styles: { cellPadding: 3 },
    });

    // pie de página
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setTextColor(160, 160, 160);
      doc.text(
        `INVENTIO · Generado el ${new Date().toLocaleDateString('es-PE')} · Página ${i} de ${pageCount}`,
        10,
        doc.internal.pageSize.height - 5
      );
    }

    doc.save(`${fileName}.pdf`);
  }

  // ── Imprimir ────────────────────────────────────────────────────────────────
  print() {
    window.print();
  }
}

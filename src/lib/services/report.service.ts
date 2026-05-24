// ============================================================
// FormuLab — Report Service (PDF Generation & Storage)
// ============================================================

import { databases, storage, ID, DATABASE_ID, Query } from '../appwrite';
import { COLLECTIONS, STORAGE_BUCKETS, FORMULATION_TYPE_LABELS } from '../constants';
import type { Report, Formulation, ActiveIngredient, ReportType, GeneratedRecipe } from '../types';
import { safeJsonParse, formatDate } from '../utils';

/**
 * List all reports for an organization
 */
export async function listReports(
  orgId: string,
  limit = 25,
  offset = 0
): Promise<{ items: Report[]; total: number }> {
  const response = await databases.listDocuments(
    DATABASE_ID,
    COLLECTIONS.REPORTS,
    [
      Query.equal('org_id', orgId),
      Query.orderDesc('generated_at'),
      Query.limit(limit),
      Query.offset(offset),
    ]
  );
  return {
    items: response.documents as unknown as Report[],
    total: response.total,
  };
}

/**
 * Create a report record (after PDF upload)
 */
export async function createReport(
  orgId: string,
  formulationId: string,
  title: string,
  reportType: ReportType,
  fileId: string,
  userId: string
): Promise<Report> {
  const doc = await databases.createDocument(
    DATABASE_ID,
    COLLECTIONS.REPORTS,
    ID.unique(),
    {
      org_id: orgId,
      formulation_id: formulationId,
      title,
      report_type: reportType,
      file_id: fileId,
      generated_by: userId,
      generated_at: new Date().toISOString(),
    }
  );
  return doc as unknown as Report;
}

/**
 * Upload a PDF file to Appwrite Storage
 */
export async function uploadReportFile(file: File): Promise<string> {
  const result = await storage.createFile(
    STORAGE_BUCKETS.REPORTS,
    ID.unique(),
    file
  );
  return result.$id;
}

/**
 * Get a download URL for a report file
 */
export function getReportDownloadUrl(fileId: string): string {
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || '';
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '';
  return `${endpoint}/storage/buckets/${STORAGE_BUCKETS.REPORTS}/files/${fileId}/download?project=${projectId}`;
}

/**
 * Delete a report and its file
 */
export async function deleteReport(reportId: string, fileId: string): Promise<void> {
  await Promise.all([
    databases.deleteDocument(DATABASE_ID, COLLECTIONS.REPORTS, reportId),
    storage.deleteFile(STORAGE_BUCKETS.REPORTS, fileId),
  ]);
}

/**
 * Generate a PDF report for a formulation (client-side)
 * Uses jsPDF + html2canvas
 */
export async function generateFormulationPDF(
  formulation: Formulation,
  ingredient: ActiveIngredient
): Promise<Blob> {
  // Dynamic imports for client-side only libraries
  const { default: jsPDF } = await import('jspdf');

  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  // ---- Header ----
  doc.setFillColor(15, 23, 42); // Dark navy
  doc.rect(0, 0, pageWidth, 40, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.text('FormuLab', 15, 18);
  doc.setFontSize(10);
  doc.text('Agrochemical Formulation Report', 15, 28);
  doc.text(`Generated: ${formatDate(new Date().toISOString())}`, 15, 35);

  y = 55;
  doc.setTextColor(15, 23, 42);

  // ---- Formulation Info ----
  doc.setFontSize(16);
  doc.text(formulation.name, 15, y);
  y += 10;
  doc.setFontSize(10);
  doc.text(`Type: ${FORMULATION_TYPE_LABELS[formulation.formulation_type] || formulation.formulation_type}`, 15, y);
  y += 6;
  doc.text(`Status: ${formulation.status}`, 15, y);
  y += 6;
  doc.text(`Version: ${formulation.version}`, 15, y);
  y += 6;
  doc.text(`Target AI Loading: ${formulation.target_ai_loading}% w/w`, 15, y);
  y += 12;

  // ---- Active Ingredient ----
  doc.setFontSize(14);
  doc.text('Active Ingredient', 15, y);
  y += 8;
  doc.setFontSize(10);

  const aiProps = [
    ['Name', ingredient.name],
    ['CAS Number', ingredient.cas_number],
    ['Molecular Weight', `${ingredient.molecular_weight} g/mol`],
    ['Melting Point', `${ingredient.melting_point}°C`],
    ['Water Solubility', `${ingredient.solubility_water} mg/L`],
    ['Log P', `${ingredient.log_p}`],
    ['Physical Form', ingredient.physical_form],
    ['Technical Purity', `${ingredient.technical_purity}%`],
  ];

  aiProps.forEach(([label, value]) => {
    doc.text(`${label}: ${value}`, 20, y);
    y += 5;
  });
  y += 8;

  // ---- Recipe ----
  const recipe = safeJsonParse<GeneratedRecipe | null>(formulation.recipe_json, null);
  if (recipe && recipe.ingredients) {
    doc.setFontSize(14);
    doc.text('Development Recipe', 15, y);
    y += 8;
    doc.setFontSize(9);

    // Table header
    doc.setFillColor(241, 245, 249);
    doc.rect(15, y - 4, pageWidth - 30, 7, 'F');
    doc.text('Ingredient', 17, y);
    doc.text('Role', 80, y);
    doc.text('Qty', 130, y);
    doc.text('Unit', 155, y);
    y += 7;

    recipe.ingredients.forEach((ing: { name: string; role: string; quantity: number; unit: string }) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.text(ing.name || '', 17, y);
      doc.text(ing.role || '', 80, y);
      doc.text(String(ing.quantity || ''), 130, y);
      doc.text(ing.unit || '', 155, y);
      y += 5;
    });
  }

  // ---- Footer ----
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `FormuLab — Confidential — Page ${i} of ${totalPages}`,
      pageWidth / 2,
      290,
      { align: 'center' }
    );
  }

  return doc.output('blob');
}

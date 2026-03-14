import type { ProjectData } from '@/types/project';

/**
 * Generates a shareable link for a project
 * The project data is encoded in base64 and included in the URL
 */
export function generateShareableLink(project: ProjectData): string {
  try {
    // Create a compact version of the project data
    const shareData = {
      n: project.name,
      ii: project.initialInvestment,
      dr: project.discountRate,
      pd: project.projectDuration,
      yr: project.yearlyRevenue,
      rg: project.revenueGrowth,
      oc: project.operatingCosts,
      mc: project.maintenanceCosts,
      bcm: project.bestCaseMultiplier,
      wcm: project.worstCaseMultiplier,
      r: project.results,
    };

    // Encode to base64
    const jsonString = JSON.stringify(shareData);
    const base64 = btoa(encodeURIComponent(jsonString));

    // Generate shareable URL
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    return `${baseUrl}/shared/${base64}`;
  } catch (error) {
    console.error('Error generating shareable link:', error);
    throw new Error('Failed to generate shareable link');
  }
}

/**
 * Decodes a shared project from a share ID (base64 encoded data)
 */
export function decodeSharedProject(shareId: string): ProjectData | null {
  try {
    // Decode from base64
    const jsonString = decodeURIComponent(atob(shareId));
    const shareData = JSON.parse(jsonString);

    // Reconstruct full project data
    const project: ProjectData = {
      id: `shared-${Date.now()}`, // Temporary ID for shared projects
      name: shareData.n,
      initialInvestment: shareData.ii,
      discountRate: shareData.dr,
      projectDuration: shareData.pd,
      yearlyRevenue: shareData.yr,
      revenueGrowth: shareData.rg,
      operatingCosts: shareData.oc,
      maintenanceCosts: shareData.mc,
      bestCaseMultiplier: shareData.bcm || 1.2,
      worstCaseMultiplier: shareData.wcm || 0.8,
      results: shareData.r,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      scenarios: [],
    };

    return project;
  } catch (error) {
    console.error('Error decoding shared project:', error);
    return null;
  }
}

export function isValidShareId(shareId: string): boolean {
  try {
    const project = decodeSharedProject(shareId);
    return project !== null && !!project.name;
  } catch {
    return false;
  }
}

/**
 * Gets a shareable text message for a project
 */
export function getShareMessage(project: ProjectData, link: string, language: 'es' | 'en'): string {
  const roi = project.results?.roi || 0;
  const npv = project.results?.npv || 0;

  if (language === 'es') {
    return `📊 *${project.name}*\n\nTe comparto este análisis financiero realizado con Business Case Analyzer Pro.\n\n💰 Inversión Inicial: $${project.initialInvestment.toLocaleString()}\n📈 ROI: ${roi.toFixed(1)}%\n💵 NPV: $${npv.toLocaleString()}\n\n🔗 Ver análisis completo:\n${link}`;
  } else {
    return `📊 *${project.name}*\n\nI'm sharing this financial analysis created with Business Case Analyzer Pro.\n\n💰 Initial Investment: $${project.initialInvestment.toLocaleString()}\n📈 ROI: ${roi.toFixed(1)}%\n💵 NPV: $${npv.toLocaleString()}\n\n🔗 View full analysis:\n${link}`;
  }
}

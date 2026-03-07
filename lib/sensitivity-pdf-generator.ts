import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { downloadWebFile } from './platform-utils';
import type { ProjectData } from '@/types/project';
import {
  calculateMultiVariableSensitivity,
  generateTornadoChartData,
  formatSensitivityValue,
  getVariableNameES,
  type SensitivityVariable,
  type TornadoChartData,
} from './sensitivity-calculator';
import { formatCurrency, formatPercentage } from './utils';

interface SensitivityPDFOptions {
  project: ProjectData;
  metric: 'npv' | 'roi';
  language: 'es' | 'en';
}

interface SensitivityRecommendation {
  variable: SensitivityVariable;
  variableName: string;
  impact: 'high' | 'medium' | 'low';
  risk: 'high' | 'medium' | 'low';
  recommendation: string;
}

/**
 * Generate sensitivity analysis recommendations
 */
function generateRecommendations(
  project: ProjectData,
  tornadoData: TornadoChartData[],
  language: 'es' | 'en'
): SensitivityRecommendation[] {
  const recommendations: SensitivityRecommendation[] = [];

  // Sort by impact (already sorted in tornadoData)
  const maxRange = tornadoData[0]?.range || 1;

  for (const item of tornadoData) {
    const impactRatio = item.range / maxRange;
    const impact = impactRatio > 0.7 ? 'high' : impactRatio > 0.4 ? 'medium' : 'low';

    // Determine risk based on negative impact
    const negativeImpactRatio = Math.abs(item.negativeImpact) / Math.abs(project.results?.npv || 1);
    const risk = negativeImpactRatio > 0.5 ? 'high' : negativeImpactRatio > 0.25 ? 'medium' : 'low';

    let recommendation = '';

    if (language === 'es') {
      if (item.variable === 'yearlyRevenue') {
        if (impact === 'high') {
          recommendation = 'Validar proyecciones de ingresos con datos de mercado. Considerar escenarios conservadores. Implementar estrategias de diversificación de ingresos.';
        } else {
          recommendation = 'Monitorear ingresos periódicamente. Mantener proyecciones realistas basadas en tendencias históricas.';
        }
      } else if (item.variable === 'operatingCosts') {
        if (impact === 'high') {
          recommendation = 'Establecer controles de costos operativos estrictos. Negociar contratos a largo plazo con proveedores. Implementar sistema de monitoreo de gastos.';
        } else {
          recommendation = 'Revisar costos operativos trimestralmente. Buscar oportunidades de optimización sin comprometer calidad.';
        }
      } else if (item.variable === 'initialInvestment') {
        if (impact === 'high') {
          recommendation = 'Solicitar cotizaciones detalladas. Incluir contingencia del 15-20%. Evaluar opciones de financiamiento para reducir impacto inicial.';
        } else {
          recommendation = 'Mantener presupuesto de inversión con margen de contingencia del 10%. Documentar todos los costos iniciales.';
        }
      } else if (item.variable === 'maintenanceCosts') {
        if (impact === 'high') {
          recommendation = 'Establecer contratos de mantenimiento preventivo. Crear fondo de reserva para mantenimiento. Evaluar opciones de garantías extendidas.';
        } else {
          recommendation = 'Programar mantenimiento preventivo regular. Monitorear costos de mantenimiento vs. proyecciones.';
        }
      }
    } else {
      // English recommendations
      if (item.variable === 'yearlyRevenue') {
        if (impact === 'high') {
          recommendation = 'Validate revenue projections with market data. Consider conservative scenarios. Implement revenue diversification strategies.';
        } else {
          recommendation = 'Monitor revenue periodically. Maintain realistic projections based on historical trends.';
        }
      } else if (item.variable === 'operatingCosts') {
        if (impact === 'high') {
          recommendation = 'Establish strict operating cost controls. Negotiate long-term contracts with suppliers. Implement expense monitoring system.';
        } else {
          recommendation = 'Review operating costs quarterly. Seek optimization opportunities without compromising quality.';
        }
      } else if (item.variable === 'initialInvestment') {
        if (impact === 'high') {
          recommendation = 'Request detailed quotes. Include 15-20% contingency. Evaluate financing options to reduce initial impact.';
        } else {
          recommendation = 'Maintain investment budget with 10% contingency margin. Document all initial costs.';
        }
      } else if (item.variable === 'maintenanceCosts') {
        if (impact === 'high') {
          recommendation = 'Establish preventive maintenance contracts. Create maintenance reserve fund. Evaluate extended warranty options.';
        } else {
          recommendation = 'Schedule regular preventive maintenance. Monitor maintenance costs vs. projections.';
        }
      }
    }

    recommendations.push({
      variable: item.variable,
      variableName: language === 'es' ? getVariableNameES(item.variable) : item.variableName,
      impact,
      risk,
      recommendation,
    });
  }

  return recommendations;
}

/**
 * Generate HTML for sensitivity analysis PDF
 */
function generateSensitivityHTML(
  project: ProjectData,
  metric: 'npv' | 'roi',
  language: 'es' | 'en'
): string {
  const variations = [-30, -20, -10, 0, 10, 20, 30];
  const results = calculateMultiVariableSensitivity(project, variations);
  const tornadoData = generateTornadoChartData(project);
  const recommendations = generateRecommendations(project, tornadoData, language);

  const variables: SensitivityVariable[] = [
    'initialInvestment',
    'yearlyRevenue',
    'operatingCosts',
    'maintenanceCosts',
  ];

  const getVariableLabel = (variable: SensitivityVariable): string => {
    return language === 'es' ? getVariableNameES(variable) : variable.replace(/([A-Z])/g, ' $1').trim();
  };

  const getValue = (variable: SensitivityVariable, variation: number): number => {
    const result = results[variable].find((r) => r.variation === variation);
    return result ? (metric === 'npv' ? result.npv : result.roi) : 0;
  };

  const baseValue = getValue('initialInvestment', 0);

  const getCellColor = (value: number): string => {
    return 'transparent';
  };

  const getCellTextColor = (value: number): string => {
    return '#000000';
  };

  const t = (key: string): string => {
    const translations: Record<string, Record<string, string>> = {
      es: {
        title: 'Análisis de Sensibilidad',
        subtitle: `Proyecto: ${project.name}`,
        date: `Fecha: ${new Date().toLocaleDateString('es-ES')}`,
        description: 'Este análisis muestra cómo las variaciones en variables clave afectan las métricas financieras del proyecto.',
        matrix_title: `Matriz de Sensibilidad - ${metric === 'npv' ? 'NPV' : 'ROI'}`,
        tornado_title: 'Gráfico de Impacto (Tornado Chart)',
        recommendations_title: 'Recomendaciones de Gestión de Riesgos',
        variable: 'Variable',
        impact: 'Impacto',
        risk: 'Riesgo',
        recommendation: 'Recomendación',
        high: 'Alto',
        medium: 'Medio',
        low: 'Bajo',
        legend: 'Leyenda',
        positive: 'Positivo (>10%)',
        neutral: 'Neutral (±10%)',
        negative: 'Negativo (<-10%)',
        base_case: 'Caso Base',
        footer: 'Generado por Business Case Analyzer Pro',
      },
      en: {
        title: 'Sensitivity Analysis',
        subtitle: `Project: ${project.name}`,
        date: `Date: ${new Date().toLocaleDateString('en-US')}`,
        description: 'This analysis shows how variations in key variables affect the project\'s financial metrics.',
        matrix_title: `Sensitivity Matrix - ${metric === 'npv' ? 'NPV' : 'ROI'}`,
        tornado_title: 'Impact Chart (Tornado Chart)',
        recommendations_title: 'Risk Management Recommendations',
        variable: 'Variable',
        impact: 'Impact',
        risk: 'Risk',
        recommendation: 'Recommendation',
        high: 'High',
        medium: 'Medium',
        low: 'Low',
        legend: 'Legend',
        positive: 'Positive (>10%)',
        neutral: 'Neutral (±10%)',
        negative: 'Negative (<-10%)',
        base_case: 'Base Case',
        footer: 'Generated by Business Case Analyzer Pro',
      },
    };
    return translations[language][key] || key;
  };

  // Generate matrix table HTML
  let matrixHTML = `
    <table class="matrix-table">
      <thead>
        <tr>
          <th>${t('variable')}</th>
          ${variations.map(v => `<th class="${v === 0 ? 'base-case' : ''}">${v > 0 ? '+' : ''}${v}%</th>`).join('')}
        </tr>
      </thead>
      <tbody>
  `;

  for (const variable of variables) {
    matrixHTML += '<tr>';
    matrixHTML += `<td class="variable-name">${getVariableLabel(variable)}</td>`;

    for (const variation of variations) {
      const value = getValue(variable, variation);
      const bgColor = getCellColor(value);
      const textColor = getCellTextColor(value);
      const isBase = variation === 0;

      matrixHTML += `
        <td class="${isBase ? 'base-case' : ''}" style="background-color: ${bgColor}; color: ${textColor};">
          ${formatSensitivityValue(value, metric === 'npv' ? 'currency' : 'percentage')}
        </td>
      `;
    }

    matrixHTML += '</tr>';
  }

  matrixHTML += `
      </tbody>
    </table>
  `;

  // Generate tornado chart HTML (simplified bar chart)
  let tornadoHTML = '<div class="tornado-chart">';

  for (const item of tornadoData) {
    const maxAbs = Math.max(...tornadoData.map(d => Math.max(Math.abs(d.negativeImpact), Math.abs(d.positiveImpact))));
    const negativeWidth = (Math.abs(item.negativeImpact) / maxAbs) * 100;
    const positiveWidth = (Math.abs(item.positiveImpact) / maxAbs) * 100;

    tornadoHTML += `
      <div class="tornado-row">
        <div class="tornado-label">${getVariableLabel(item.variable)}</div>
        <div class="tornado-bars">
          <div class="tornado-negative" style="width: ${negativeWidth}%;">
            <span>${formatCurrency(item.negativeImpact)}</span>
          </div>
          <div class="tornado-center"></div>
          <div class="tornado-positive" style="width: ${positiveWidth}%;">
            <span>${formatCurrency(item.positiveImpact)}</span>
          </div>
        </div>
      </div>
    `;
  }

  tornadoHTML += '</div>';

  // Generate recommendations HTML
  let recommendationsHTML = '<div class="recommendations">';

  for (const rec of recommendations) {
    const impactBadge = `<span class="badge badge-${rec.impact}">${t(rec.impact)}</span>`;
    const riskBadge = `<span class="badge badge-${rec.risk}">${t(rec.risk)}</span>`;

    recommendationsHTML += `
      <div class="recommendation-card">
        <h4>${rec.variableName}</h4>
        <div class="badges">
          <div><strong>${t('impact')}:</strong> ${impactBadge}</div>
          <div><strong>${t('risk')}:</strong> ${riskBadge}</div>
        </div>
        <p>${rec.recommendation}</p>
      </div>
    `;
  }

  recommendationsHTML += '</div>';

  // Complete HTML document
  return `
<!DOCTYPE html>
<html lang="${language}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${t('title')} - ${project.name}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Latin Modern Roman', 'Computer Modern Roman', 'Computer Modern', Georgia, 'Times New Roman', Times, serif;
      font-size: 11pt;
      line-height: 1.6;
      color: #000;
      padding: 0;
      max-width: 800px;
      margin: 0 auto;
      background: #fff;
    }
    
    .header {
      text-align: center;
      margin-bottom: 40px;
      padding-top: 20px;
    }
    
    h1 {
      font-size: 20pt;
      font-weight: bold;
      color: #000;
      margin-bottom: 15px;
    }
    
    h2 {
      font-size: 14pt;
      font-weight: bold;
      color: #000;
      margin: 30px 0 15px;
    }
    
    h3 {
      font-size: 12pt;
      color: #000;
      margin: 20px 0 10px;
      font-weight: bold;
    }
    
    .subtitle {
      font-size: 12pt;
      color: #333;
      margin-bottom: 5px;
    }
    
    .date {
      font-size: 11pt;
      color: #000;
      font-style: italic;
    }
    
    .description {
      padding: 10px 0;
      margin-bottom: 30px;
      font-style: italic;
    }
    
    .matrix-table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      border-top: 2px solid #000;
      border-bottom: 2px solid #000;
    }
    
    .matrix-table th,
    .matrix-table td {
      border: none;
      padding: 8px 4px;
      text-align: center;
    }
    
    .matrix-table th {
      border-bottom: 1px solid #000;
      color: #000;
      font-weight: bold;
    }
    
    .matrix-table th.base-case {
      font-weight: bold;
    }
    
    .matrix-table td.base-case {
      font-weight: bold;
      background: #f5f5f5;
    }
    
    .matrix-table .variable-name {
      text-align: left;
      font-weight: bold;
    }
    
    .legend {
      display: flex;
      justify-content: center;
      gap: 30px;
      margin: 20px 0;
      font-size: 12px;
    }
    
    .legend-item {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .legend-box {
      width: 20px;
      height: 20px;
      border-radius: 4px;
      border: 1px solid #ddd;
    }
    
    .tornado-chart {
      margin: 20px 0;
      border: 1px solid #000;
      padding: 20px;
    }
    
    .tornado-row {
      margin-bottom: 15px;
    }
    
    .tornado-label {
      font-weight: bold;
      margin-bottom: 5px;
      font-size: 10pt;
    }
    
    .tornado-bars {
      display: flex;
      align-items: center;
      height: 30px;
    }
    
    .tornado-negative,
    .tornado-positive {
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 9pt;
      color: #000;
      font-weight: bold;
    }
    
    .tornado-negative {
      background: #e5e5e5;
      border-right: 1px solid #000;
      justify-content: flex-end;
      padding-right: 10px;
    }
    
    .tornado-positive {
      background: #d4d4d4;
      justify-content: flex-start;
      padding-left: 10px;
    }
    
    .tornado-center {
      width: 2px;
      height: 100%;
      background: #000;
    }
    
    .recommendations {
      margin: 20px 0;
    }
    
    .recommendation-card {
      background: #fff;
      border: 1px solid #000;
      padding: 15px;
      margin-bottom: 15px;
    }
    
    .recommendation-card h4 {
      color: #000;
      margin-bottom: 8px;
      font-size: 12pt;
      border-bottom: 1px solid #e5e5e5;
      padding-bottom: 5px;
    }
    
    .badges {
      display: flex;
      gap: 15px;
      margin-bottom: 10px;
      font-size: 10pt;
    }
    
    .badge {
      display: inline-block;
      padding: 2px 6px;
      font-weight: bold;
      border: 1px solid #000;
      color: #000;
      background: #fff;
    }
    
    .recommendation-card p {
      font-size: 10pt;
      line-height: 1.6;
      color: #000;
    }
    
    .footer {
      text-align: center;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #000;
      font-size: 9pt;
      color: #000;
      font-style: italic;
    }
    
    @media print {
      body {
        padding: 20px;
      }
      
      .recommendation-card {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${t('title')}</h1>
    <div class="subtitle">${t('subtitle')}</div>
    <div class="date">${t('date')}</div>
  </div>
  
  <div class="description">
    ${t('description')}
  </div>
  
  <h2>${t('matrix_title')}</h2>
  ${matrixHTML}
  
  <h2>${t('tornado_title')}</h2>
  ${tornadoHTML}
  
  <h2>${t('recommendations_title')}</h2>
  ${recommendationsHTML}
  
  <div class="footer">
    ${t('footer')}
  </div>
</body>
</html>
  `;
}

/**
 * Generate sensitivity analysis PDF report
 */
export async function generateSensitivityPDF(
  options: SensitivityPDFOptions
): Promise<string> {
  const { project, metric, language } = options;

  if (Platform.OS === 'web') {
    return '';
  }

  const html = generateSensitivityHTML(project, metric, language);

  const fileName = `sensitivity-analysis-${project.name.replace(/\s+/g, '-')}-${Date.now()}.html`;
  const filePath = `${FileSystem.documentDirectory ?? ''}${fileName}`;

  await FileSystem.writeAsStringAsync(filePath, html);

  return filePath;
}

/**
 * Share sensitivity analysis PDF
 */
export async function shareSensitivityPDF(
  filePath: string,
  project: ProjectData,
  metric: 'npv' | 'roi',
  language: 'es' | 'en'
): Promise<void> {
  if (Platform.OS === 'web') {
    const html = generateSensitivityHTML(project, metric, language);
    const fileName = `sensitivity-analysis-${project.name.replace(/\s+/g, '-')}`;

    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const element = document.createElement('div');
      element.innerHTML = html;

      const opt = {
        margin: [20, 20, 20, 20],
        filename: `${fileName}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, windowWidth: 800 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: 'avoid-all' }
      };

      html2pdf().from(element).set(opt).save();
    } catch (error) {
      console.error('Error generating PDF on web:', error);
      // Fallback
      downloadWebFile(html, `${fileName}.html`);
    }
    return;
  }

  const isAvailable = await Sharing.isAvailableAsync();

  if (isAvailable) {
    await Sharing.shareAsync(filePath, {
      mimeType: 'text/html',
      dialogTitle: 'Share Sensitivity Analysis',
    });
  } else {
    throw new Error('Sharing is not available on this platform');
  }
}

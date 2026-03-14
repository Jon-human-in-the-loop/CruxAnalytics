import { Platform } from 'react-native';

export function generateBreakEvenPDF(data: {
    inputs: {
        fixedCosts: number;
        pricePerUnit: number;
        variableCostPerUnit: number;
        currentSalesUnits?: number;
    };
    results: {
        breakEvenUnits: number;
        breakEvenRevenue: number;
        contributionMarginPerUnit: number;
        marginOfSafety?: number;
        isAboveBreakEven?: boolean;
    };
    recommendations: string[];
}): string {
    const { inputs, results, recommendations } = data;

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Análisis de Punto de Equilibrio - CruxAnalytics</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
      color: white;
      padding: 40px;
      min-height: 100vh;
    }
    .container { max-width: 800px; margin: 0 auto; }

    .header {
      text-align: center;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }
    .logo { font-size: 28px; font-weight: bold; }
    .logo span { color: #818cf8; }
    .date { color: #9ca3af; font-size: 14px; margin-top: 8px; }

    .title {
      font-size: 32px;
      margin: 30px 0;
      text-align: center;
    }

    .card {
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 20px;
    }
    .card-title {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 16px;
      color: #a5b4fc;
    }

    .metric-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }
    .metric {
      background: rgba(255,255,255,0.03);
      padding: 16px;
      border-radius: 12px;
    }
    .metric-label { color: #9ca3af; font-size: 14px; }
    .metric-value { font-size: 28px; font-weight: bold; margin-top: 4px; }
    .metric-value.primary { color: #6366f1; }
    .metric-value.success { color: #10b981; }
    .metric-value.warning { color: #f59e0b; }
    .metric-value.danger { color: #ef4444; }

    .highlight-box {
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.2));
      border: 1px solid rgba(99, 102, 241, 0.3);
      border-radius: 16px;
      padding: 32px;
      text-align: center;
      margin: 30px 0;
    }
    .highlight-label { color: #a5b4fc; font-size: 16px; }
    .highlight-value { font-size: 48px; font-weight: bold; margin-top: 8px; }

    .status-box {
      padding: 20px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      gap: 16px;
      margin: 20px 0;
    }
    .status-box.success { background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); }
    .status-box.danger { background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); }
    .status-icon { font-size: 32px; }
    .status-text { flex: 1; }
    .status-title { font-weight: 600; }
    .status-subtitle { color: #9ca3af; font-size: 14px; }

    .recommendations { list-style: none; }
    .recommendations li {
      padding: 12px 0;
      border-bottom: 1px solid rgba(255,255,255,0.05);
      display: flex;
      gap: 12px;
    }
    .recommendations li:last-child { border-bottom: none; }
    .rec-number {
      width: 24px;
      height: 24px;
      background: rgba(99, 102, 241, 0.2);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      color: #a5b4fc;
    }

    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid rgba(255,255,255,0.1);
      text-align: center;
      color: #6b7280;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">Crux<span>Analytics</span></div>
      <div class="date">Generado el ${new Date().toLocaleDateString('es-ES', {
        year: 'numeric', month: 'long', day: 'numeric'
    })}</div>
    </div>

    <h1 class="title">📈 Análisis de Punto de Equilibrio</h1>

    <!-- Main Results -->
    <div class="highlight-box">
      <div class="highlight-label">Para no perder dinero, necesitas vender</div>
      <div class="highlight-value">${results.breakEvenUnits.toLocaleString()} unidades</div>
      <div class="highlight-label" style="margin-top: 8px;">
        equivalente a $${results.breakEvenRevenue.toLocaleString()} en ingresos
      </div>
    </div>

    ${results.marginOfSafety !== undefined ? `
    <div class="status-box ${results.isAboveBreakEven ? 'success' : 'danger'}">
      <div class="status-icon">${results.isAboveBreakEven ? '✅' : '⚠️'}</div>
      <div class="status-text">
        <div class="status-title">
          ${results.isAboveBreakEven ? 'Por encima del punto de equilibrio' : 'Por debajo del punto de equilibrio'}
        </div>
        <div class="status-subtitle">
          Margen de seguridad: ${results.marginOfSafety.toFixed(1)}%
        </div>
      </div>
    </div>
    ` : ''}

    <!-- Input Data -->
    <div class="card">
      <div class="card-title">📊 Datos de Entrada</div>
      <div class="metric-grid">
        <div class="metric">
          <div class="metric-label">Costos Fijos Mensuales</div>
          <div class="metric-value">$${inputs.fixedCosts.toLocaleString()}</div>
        </div>
        <div class="metric">
          <div class="metric-label">Precio por Unidad</div>
          <div class="metric-value">$${inputs.pricePerUnit.toLocaleString()}</div>
        </div>
        <div class="metric">
          <div class="metric-label">Costo Variable por Unidad</div>
          <div class="metric-value">$${inputs.variableCostPerUnit.toLocaleString()}</div>
        </div>
        <div class="metric">
          <div class="metric-label">Contribución por Unidad</div>
          <div class="metric-value success">$${results.contributionMarginPerUnit.toFixed(2)}</div>
        </div>
      </div>
    </div>

    <!-- Recommendations -->
    <div class="card">
      <div class="card-title">💡 Recomendaciones</div>
      <ul class="recommendations">
        ${recommendations.map((rec, i) => `
          <li>
            <div class="rec-number">${i + 1}</div>
            <span>${rec}</span>
          </li>
        `).join('')}
      </ul>
    </div>

    <div class="footer">
      <p>CruxAnalytics - Análisis financiero para emprendedores</p>
      <p>Este reporte es solo informativo y no constituye asesoría financiera profesional.</p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Opens a print dialog with the generated HTML (works on web)
 */
export async function printPDF(html: string): Promise<void> {
    if (Platform.OS === 'web') {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(html);
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => {
                printWindow.print();
            }, 250);
        }
    } else {
        // For native, you would use react-native-html-to-pdf
        console.log('PDF generation on native requires react-native-html-to-pdf');
    }
}

/**
 * Downloads the HTML as a file
 */
export function downloadHTML(html: string, filename: string): void {
    if (Platform.OS === 'web') {
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

/**
 * Generates HTML for Cash Flow calculator PDF
 */
export function generateCashFlowPDF(data: {
    inputs: { startingCash: number; monthlyRevenue: number; monthlyExpenses: number; expectedGrowthRate: number };
    results: { endingCash: number; monthsUntilDeficit: number | null; isHealthy: boolean; minimumCashReserve: number };
    recommendations: string[];
}): string {
    const { inputs, results, recommendations } = data;

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Análisis de Flujo de Caja - CruxAnalytics</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
      color: white;
      padding: 40px;
      min-height: 100vh;
    }
    .container { max-width: 800px; margin: 0 auto; }
    .header {
      text-align: center;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }
    .logo { font-size: 28px; font-weight: bold; }
    .logo span { color: #818cf8; }
    .title { font-size: 32px; margin: 30px 0; text-align: center; }
    .card {
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 20px;
    }
    .card-title { font-size: 18px; font-weight: 600; margin-bottom: 16px; color: #a5b4fc; }
    .metric-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
    .metric { background: rgba(255,255,255,0.03); padding: 16px; border-radius: 12px; }
    .metric-label { color: #9ca3af; font-size: 14px; }
    .metric-value { font-size: 28px; font-weight: bold; margin-top: 4px; }
    .metric-value.success { color: #10b981; }
    .metric-value.danger { color: #ef4444; }
    .recommendations { list-style: none; }
    .recommendations li { padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); text-align: center; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">Crux<span>Analytics</span></div>
      <div class="date">Generado el ${new Date().toLocaleDateString('es-ES')}</div>
    </div>

    <h1 class="title">💰 Análisis de Flujo de Caja</h1>

    <div class="card">
      <div class="card-title">📊 Resultados</div>
      <div class="metric-grid">
        <div class="metric">
          <div class="metric-label">Balance Final (12 meses)</div>
          <div class="metric-value ${results.endingCash >= 0 ? 'success' : 'danger'}">$${results.endingCash.toLocaleString()}</div>
        </div>
        <div class="metric">
          <div class="metric-label">Estado del Flujo</div>
          <div class="metric-value ${results.isHealthy ? 'success' : 'danger'}">${results.isHealthy ? 'Saludable' : 'En Riesgo'}</div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-title">💡 Recomendaciones</div>
      <ul class="recommendations">
        ${recommendations.map(rec => `<li>${rec}</li>`).join('')}
      </ul>
    </div>

    <div class="footer">
      <p>CruxAnalytics - Análisis financiero para emprendedores</p>
      <p>Este reporte es solo informativo y no constituye asesoría financiera profesional.</p>
    </div>
  </div>
</body>
</html>
    `;
}

/**
 * Generates HTML for Pricing calculator PDF
 */
export function generatePricingPDF(data: {
    inputs: { costPerUnit: number; desiredMargin: number; competitorPrice?: number };
    results: { recommendedPrice: number; grossProfitPerUnit: number; markup: number };
    recommendations: string[];
}): string {
    const { inputs, results, recommendations } = data;

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Análisis de Precios - CruxAnalytics</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
      color: white;
      padding: 40px;
    }
    .container { max-width: 800px; margin: 0 auto; }
    .header { text-align: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 1px solid rgba(255,255,255,0.1); }
    .logo { font-size: 28px; font-weight: bold; }
    .logo span { color: #818cf8; }
    .title { font-size: 32px; margin: 30px 0; text-align: center; }
    .card { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 24px; margin-bottom: 20px; }
    .card-title { font-size: 18px; font-weight: 600; margin-bottom: 16px; color: #a5b4fc; }
    .metric { margin-bottom: 16px; }
    .metric-label { color: #9ca3af; font-size: 14px; }
    .metric-value { font-size: 28px; font-weight: bold; margin-top: 4px; color: #10b981; }
    .recommendations { list-style: none; }
    .recommendations li { padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); text-align: center; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">Crux<span>Analytics</span></div>
      <div class="date">Generado el ${new Date().toLocaleDateString('es-ES')}</div>
    </div>
    <h1 class="title">🏷️ Análisis de Precios</h1>
    <div class="card">
      <div class="card-title">📊 Precio Recomendado</div>
      <div class="metric">
        <div class="metric-value">$${results.recommendedPrice.toFixed(2)}</div>
      </div>
      <div class="metric">
        <div class="metric-label">Ganancia por Unidad</div>
        <div class="metric-value">$${results.grossProfitPerUnit.toFixed(2)}</div>
      </div>
    </div>
    <div class="card">
      <div class="card-title">💡 Recomendaciones</div>
      <ul class="recommendations">
        ${recommendations.map(rec => `<li>${rec}</li>`).join('')}
      </ul>
    </div>
    <div class="footer">
      <p>CruxAnalytics - Análisis financiero para emprendedores</p>
    </div>
  </div>
</body>
</html>
    `;
}

/**
 * Generates HTML for Loan calculator PDF
 */
export function generateLoanPDF(data: {
    inputs: { principal: number; annualInterestRate: number; termMonths: number };
    results: { monthlyPayment: number; totalPayment: number; totalInterest: number };
    recommendations: string[];
}): string {
    const { inputs, results, recommendations } = data;

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Evaluación de Préstamo - CruxAnalytics</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
      color: white;
      padding: 40px;
    }
    .container { max-width: 800px; margin: 0 auto; }
    .header { text-align: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 1px solid rgba(255,255,255,0.1); }
    .logo { font-size: 28px; font-weight: bold; }
    .logo span { color: #818cf8; }
    .title { font-size: 32px; margin: 30px 0; text-align: center; }
    .card { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 24px; margin-bottom: 20px; }
    .card-title { font-size: 18px; font-weight: 600; margin-bottom: 16px; color: #a5b4fc; }
    .metric { margin-bottom: 16px; }
    .metric-label { color: #9ca3af; font-size: 14px; }
    .metric-value { font-size: 28px; font-weight: bold; margin-top: 4px; color: #10b981; }
    .recommendations { list-style: none; }
    .recommendations li { padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); text-align: center; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">Crux<span>Analytics</span></div>
      <div class="date">Generado el ${new Date().toLocaleDateString('es-ES')}</div>
    </div>
    <h1 class="title">💳 Evaluación de Préstamo</h1>
    <div class="card">
      <div class="card-title">📊 Resumen del Préstamo</div>
      <div class="metric">
        <div class="metric-label">Pago Mensual</div>
        <div class="metric-value">$${results.monthlyPayment.toLocaleString()}</div>
      </div>
      <div class="metric">
        <div class="metric-label">Total a Pagar</div>
        <div class="metric-value">$${results.totalPayment.toLocaleString()}</div>
      </div>
    </div>
    <div class="card">
      <div class="card-title">💡 Recomendaciones</div>
      <ul class="recommendations">
        ${recommendations.map(rec => `<li>${rec}</li>`).join('')}
      </ul>
    </div>
    <div class="footer">
      <p>CruxAnalytics - Análisis financiero para emprendedores</p>
    </div>
  </div>
</body>
</html>
    `;
}

/**
 * Generates HTML for Employee ROI calculator PDF
 */
export function generateEmployeeROIPDF(data: {
    inputs: { annualSalary: number; annualBenefits: number; onboardingCosts: number; revenueGenerated: number };
    results: { totalCost: number; roiPercentage: number; paybackMonths: number | null };
    recommendations: string[];
}): string {
    const { inputs, results, recommendations } = data;

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>ROI de Empleado - CruxAnalytics</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
      color: white;
      padding: 40px;
    }
    .container { max-width: 800px; margin: 0 auto; }
    .header { text-align: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 1px solid rgba(255,255,255,0.1); }
    .logo { font-size: 28px; font-weight: bold; }
    .logo span { color: #818cf8; }
    .title { font-size: 32px; margin: 30px 0; text-align: center; }
    .card { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 24px; margin-bottom: 20px; }
    .card-title { font-size: 18px; font-weight: 600; margin-bottom: 16px; color: #a5b4fc; }
    .metric { margin-bottom: 16px; }
    .metric-label { color: #9ca3af; font-size: 14px; }
    .metric-value { font-size: 28px; font-weight: bold; margin-top: 4px; color: ${results.roiPercentage >= 0 ? '#10b981' : '#ef4444'}; }
    .recommendations { list-style: none; }
    .recommendations li { padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); text-align: center; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">Crux<span>Analytics</span></div>
      <div class="date">Generado el ${new Date().toLocaleDateString('es-ES')}</div>
    </div>
    <h1 class="title">👥 ROI de Empleado</h1>
    <div class="card">
      <div class="card-title">📊 Análisis ROI</div>
      <div class="metric">
        <div class="metric-label">ROI</div>
        <div class="metric-value">${results.roiPercentage.toFixed(0)}%</div>
      </div>
      ${results.paybackMonths ? `<div class="metric">
        <div class="metric-label">Recuperación</div>
        <div class="metric-value">${results.paybackMonths} meses</div>
      </div>` : ''}
    </div>
    <div class="card">
      <div class="card-title">💡 Recomendaciones</div>
      <ul class="recommendations">
        ${recommendations.map(rec => `<li>${rec}</li>`).join('')}
      </ul>
    </div>
    <div class="footer">
      <p>CruxAnalytics - Análisis financiero para emprendedores</p>
    </div>
  </div>
</body>
</html>
    `;
}

/**
 * Generates HTML for Marketing ROI calculator PDF
 */
export function generateMarketingROIPDF(data: {
    inputs: { totalSpend: number; conversions: number; revenuePerConversion: number };
    results: { roiPercentage: number; costPerAcquisition: number; totalRevenue: number };
    recommendations: string[];
}): string {
    const { inputs, results, recommendations } = data;

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>ROI de Marketing - CruxAnalytics</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
      color: white;
      padding: 40px;
    }
    .container { max-width: 800px; margin: 0 auto; }
    .header { text-align: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 1px solid rgba(255,255,255,0.1); }
    .logo { font-size: 28px; font-weight: bold; }
    .logo span { color: #818cf8; }
    .title { font-size: 32px; margin: 30px 0; text-align: center; }
    .card { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 24px; margin-bottom: 20px; }
    .card-title { font-size: 18px; font-weight: 600; margin-bottom: 16px; color: #a5b4fc; }
    .metric { margin-bottom: 16px; }
    .metric-label { color: #9ca3af; font-size: 14px; }
    .metric-value { font-size: 28px; font-weight: bold; margin-top: 4px; color: ${results.roiPercentage >= 100 ? '#10b981' : '#ef4444'}; }
    .recommendations { list-style: none; }
    .recommendations li { padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); text-align: center; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">Crux<span>Analytics</span></div>
      <div class="date">Generado el ${new Date().toLocaleDateString('es-ES')}</div>
    </div>
    <h1 class="title">📢 ROI de Marketing</h1>
    <div class="card">
      <div class="card-title">📊 Resultados de Campaña</div>
      <div class="metric">
        <div class="metric-label">ROI</div>
        <div class="metric-value">${results.roiPercentage.toFixed(0)}%</div>
      </div>
      <div class="metric">
        <div class="metric-label">Costo por Adquisición</div>
        <div class="metric-value">$${results.costPerAcquisition.toFixed(2)}</div>
      </div>
    </div>
    <div class="card">
      <div class="card-title">💡 Recomendaciones</div>
      <ul class="recommendations">
        ${recommendations.map(rec => `<li>${rec}</li>`).join('')}
      </ul>
    </div>
    <div class="footer">
      <p>CruxAnalytics - Análisis financiero para emprendedores</p>
    </div>
  </div>
</body>
</html>
    `;
}

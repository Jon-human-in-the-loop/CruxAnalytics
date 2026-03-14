import type { BusinessTemplate, BreakEvenInput, PricingInput } from '@/types/project';

/**
 * Pre-configured business templates by industry
 */
export const BUSINESS_TEMPLATES: BusinessTemplate[] = [
        // RESTAURANT TEMPLATE
        {
        id: 'restaurant',
        name: 'Restaurante / Café',
        industry: 'restaurant',
        description: 'Plantilla para restaurantes, cafeterías, y negocios de comida. Incluye benchmarks de food cost y labor cost.',
        defaultInputs: {
            fixedCosts: 15000,        // Rent, utilities, insurance
            pricePerUnit: 15,          // Average ticket
            variableCostPerUnit: 5.25, // ~35% food cost
            desiredMargin: 65,
        },
        benchmarks: {
            grossMargin: { min: 55, max: 75, optimal: 65 },
            netMargin: { min: 3, max: 15, optimal: 8 },
            laborCostRatio: { min: 20, max: 35, optimal: 28 },
        },
    },

        // E-COMMERCE TEMPLATE
        {
        id: 'ecommerce',
        name: 'E-commerce / Tienda Online',
        industry: 'ecommerce',
        description: 'Plantilla para tiendas online. Incluye consideraciones de envío, CAC, y márgenes típicos.',
        defaultInputs: {
            fixedCosts: 5000,          // Hosting, tools, marketing base
            pricePerUnit: 50,          // Average order value
            variableCostPerUnit: 25,   // COGS + shipping
            desiredMargin: 40,
        },
        benchmarks: {
            grossMargin: { min: 30, max: 60, optimal: 45 },
            netMargin: { min: 5, max: 20, optimal: 12 },
            laborCostRatio: { min: 5, max: 20, optimal: 12 },
        },
    },

        // PROFESSIONAL SERVICES TEMPLATE
        {
        id: 'services',
        name: 'Servicios Profesionales',
        industry: 'services',
        description: 'Plantilla para consultores, agencias, freelancers. Alta proporción de labor, bajos costos variables.',
        defaultInputs: {
            fixedCosts: 8000,          // Office, tools, insurance
            pricePerUnit: 150,         // Hourly rate
            variableCostPerUnit: 15,   // Minimal direct costs
            desiredMargin: 70,
        },
        benchmarks: {
            grossMargin: { min: 50, max: 80, optimal: 70 },
            netMargin: { min: 15, max: 40, optimal: 25 },
            laborCostRatio: { min: 40, max: 60, optimal: 50 },
        },
    },

        // RETAIL STORE TEMPLATE
        {
        id: 'retail',
        name: 'Tienda Minorista',
        industry: 'retail',
        description: 'Plantilla para tiendas físicas. Incluye consideraciones de inventario y espacio.',
        defaultInputs: {
            fixedCosts: 12000,         // Rent, utilities, staff
            pricePerUnit: 30,          // Average sale
            variableCostPerUnit: 18,   // ~60% COGS
            desiredMargin: 40,
        },
        benchmarks: {
            grossMargin: { min: 30, max: 50, optimal: 40 },
            netMargin: { min: 2, max: 10, optimal: 5 },
            laborCostRatio: { min: 15, max: 25, optimal: 18 },
        },
    },

        // MANUFACTURING TEMPLATE
        {
        id: 'manufacturing',
        name: 'Manufactura / Producción',
        industry: 'manufacturing',
        description: 'Plantilla para negocios de manufactura. Altos costos fijos, economías de escala.',
        defaultInputs: {
            fixedCosts: 50000,         // Equipment, facility, utilities
            pricePerUnit: 100,         // Per unit price
            variableCostPerUnit: 55,   // Materials, direct labor
            desiredMargin: 35,
        },
        benchmarks: {
            grossMargin: { min: 25, max: 45, optimal: 35 },
            netMargin: { min: 5, max: 15, optimal: 10 },
            laborCostRatio: { min: 15, max: 30, optimal: 22 },
        },
    },
];

/**
 * Get a business template by ID
 * 
 * @param id - Template ID (e.g., 'restaurant', 'ecommerce')
 * @returns Business template or undefined if not found
 */
export function getBusinessTemplate(id: string): BusinessTemplate | undefined {
    return BUSINESS_TEMPLATES.find(t => t.id === id);
}

/**
 * Get all templates for a specific industry
 * 
 * @param industry - Industry type
 * @returns Array of matching templates
 */
export function getTemplatesByIndustry(
    industry: BusinessTemplate['industry']
): BusinessTemplate[] {
    return BUSINESS_TEMPLATES.filter(t => t.industry === industry);
}

/**
 * Apply a template to create break-even input
 * 
 * @param templateId - Template ID to apply
 * @param overrides - Custom values to override template defaults
 * @returns Complete BreakEvenInput
 */
export function applyBreakEvenTemplate(
    templateId: string,
    overrides?: Partial<BreakEvenInput>
): BreakEvenInput {
    const template = getBusinessTemplate(templateId);

    if (!template) {
        throw new Error(`Template not found: ${templateId}`);
    }

    return {
        fixedCosts: template.defaultInputs.fixedCosts || 10000,
        pricePerUnit: template.defaultInputs.pricePerUnit || 50,
        variableCostPerUnit: template.defaultInputs.variableCostPerUnit || 25,
        ...overrides,
    };
}

/**
 * Apply a template to create pricing input
 * 
 * @param templateId - Template ID to apply
 * @param overrides - Custom values to override template defaults
 * @returns Complete PricingInput
 */
export function applyPricingTemplate(
    templateId: string,
    overrides?: Partial<PricingInput>
): PricingInput {
    const template = getBusinessTemplate(templateId);

    if (!template) {
        throw new Error(`Template not found: ${templateId}`);
    }

    const costPerUnit = template.defaultInputs.variableCostPerUnit || 25;

    return {
        costPerUnit,
        desiredMargin: template.defaultInputs.desiredMargin || 40,
        ...overrides,
    };
}

/**
 * Check if a metric is within healthy range for the industry
 * 
 * @param templateId - Template ID
 * @param metric - Metric name ('grossMargin', 'netMargin', 'laborCostRatio')
 * @param value - Actual value to check
 * @returns Assessment of the value
 */
export function assessMetricHealth(
    templateId: string,
    metric: 'grossMargin' | 'netMargin' | 'laborCostRatio',
    value: number
): {
    status: 'healthy' | 'warning' | 'critical';
    message: string;
    benchmark: { min: number; max: number; optimal: number };
} {
    const template = getBusinessTemplate(templateId);

    if (!template) {
        throw new Error(`Template not found: ${templateId}`);
    }

    const benchmark = template.benchmarks[metric];
    let status: 'healthy' | 'warning' | 'critical';
    let message: string;

    // For laborCostRatio, lower is better (inverted)
    if (metric === 'laborCostRatio') {
        if (value <= benchmark.optimal) {
            status = 'healthy';
            message = `Labor cost of ${value}% is at or below optimal (${benchmark.optimal}%)`;
        } else if (value <= benchmark.max) {
            status = 'warning';
            message = `Labor cost of ${value}% is above optimal but within range`;
        } else {
            status = 'critical';
            message = `Labor cost of ${value}% exceeds industry maximum (${benchmark.max}%)`;
        }
    } else {
        // For margins, higher is better
        if (value >= benchmark.optimal) {
            status = 'healthy';
            message = `${metric} of ${value}% meets or exceeds optimal (${benchmark.optimal}%)`;
        } else if (value >= benchmark.min) {
            status = 'warning';
            message = `${metric} of ${value}% is below optimal but acceptable`;
        } else {
            status = 'critical';
            message = `${metric} of ${value}% is below industry minimum (${benchmark.min}%)`;
        }
    }

    return { status, message, benchmark };
}

/**
 * Get all available template IDs
 */
export function getAvailableTemplateIds(): string[] {
    return BUSINESS_TEMPLATES.map(t => t.id);
}

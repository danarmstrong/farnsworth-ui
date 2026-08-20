const UTC_TIMEZONE_PATTERN = /[zZ]|[+-]\d{2}:?\d{2}$/;

function normalizeUtcIso(value: string): string {
    const trimmed = value.trim();
    if (!trimmed) {
        return '';
    }

    if (UTC_TIMEZONE_PATTERN.test(trimmed)) {
        return trimmed;
    }

    return `${trimmed}Z`;
}

export function parseUtcDate(value: string | null | undefined): Date | null {
    if (!value) {
        return null;
    }

    const normalized = normalizeUtcIso(value);
    if (!normalized) {
        return null;
    }

    const millis = Date.parse(normalized);
    if (Number.isNaN(millis)) {
        return null;
    }

    return new Date(millis);
}

export function parseUtcDateMillis(value: string | null | undefined): number {
    const parsed = parseUtcDate(value);
    return parsed ? parsed.getTime() : Number.NEGATIVE_INFINITY;
}

export function formatUtcLocal(value: string | null | undefined, locale?: string | string[]): string {
    const parsed = parseUtcDate(value);
    if (!parsed) {
        return '';
    }

    return parsed.toLocaleString(locale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
    });
}



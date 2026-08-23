import type { GithubPullRequestState } from '@/features/jack-henry/repositories/types/GithubPullRequest';

export type RepositoryStatusTone = 'error' | 'warning' | 'info' | 'success' | 'default';

function normalizeText(value: string | null | undefined): string {
    return String(value ?? '').trim();
}

function toWords(value: string): string {
    return value
        .replace(/[_-]+/g, ' ')
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/\s+/g, ' ')
        .trim();
}

export function pullRequestStateLabel(state: GithubPullRequestState): string {
    if (typeof state === 'number') {
        if (state === 0) {
            return 'Open';
        }
        if (state === 1) {
            return 'Closed';
        }
        if (state === 2) {
            return 'Merged';
        }
    }

    const normalized = normalizeText(typeof state === 'string' ? state : String(state));
    if (!normalized) {
        return 'Unknown';
    }

    return toWords(normalized);
}

export function pullRequestStateTone(state: GithubPullRequestState): RepositoryStatusTone {
    if (typeof state === 'number') {
        if (state === 0) {
            return 'info';
        }
        if (state === 1) {
            return 'warning';
        }
        if (state === 2) {
            return 'success';
        }
    }

    const normalized = normalizeText(typeof state === 'string' ? state : String(state)).toLowerCase();
    if (!normalized) {
        return 'default';
    }
    if (normalized.includes('open')) {
        return 'info';
    }
    if (normalized.includes('close')) {
        return 'warning';
    }
    if (normalized.includes('merge')) {
        return 'success';
    }

    return 'default';
}

export function securityAlertStateTone(state: string | null | undefined): RepositoryStatusTone {
    const normalized = normalizeText(state).toLowerCase();
    if (!normalized) {
        return 'default';
    }
    if (normalized.includes('open')) {
        return 'error';
    }
    if (normalized.includes('dismiss')) {
        return 'warning';
    }
    if (normalized.includes('fix') || normalized.includes('resolve') || normalized.includes('patch')) {
        return 'success';
    }

    return 'default';
}

export function securityAlertStateLabel(state: string | null | undefined): string {
    const normalized = normalizeText(state);
    return normalized ? toWords(normalized) : 'Unknown';
}

export function alertSeverityTone(severity: string | null | undefined): RepositoryStatusTone {
    const normalized = normalizeText(severity).toLowerCase();
    if (!normalized) {
        return 'default';
    }
    if (normalized.includes('critical') || normalized.includes('high')) {
        return 'error';
    }
    if (normalized.includes('moderate') || normalized.includes('medium')) {
        return 'warning';
    }
    if (normalized.includes('low')) {
        return 'info';
    }
    if (normalized.includes('none')) {
        return 'success';
    }

    return 'default';
}

export function alertSeverityLabel(severity: string | null | undefined): string {
    const normalized = normalizeText(severity);
    return normalized ? toWords(normalized) : 'Unknown';
}


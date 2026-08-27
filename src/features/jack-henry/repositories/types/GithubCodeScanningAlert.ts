export interface GithubRepoSlimDto {
    id: string;
    name: string;
    url: string;
}

export interface GithubCodeScanningAlertSecurityReviewDto {
    isReviewed: boolean;
    isAffected: boolean | null;
    affectedProbability: number | null;
    confidence: number | null;
    message: string | null;
    provider: string | null;
    model: string | null;
    stage: string | null;
    confidenceThreshold: number | null;
    reviewedAtUtc: string | null;
    lastAttemptedAtUtc: string | null;
    lastError: string | null;
}

export interface GithubCodeScanningAlert {
    id: string;
    githubRepo: GithubRepoSlimDto;
    githubRepoId?: string;
    externalId: string;
    repositoryOwner: string;
    repositoryName: string;
    state: string;
    ruleId: string | null;
    ruleName: string | null;
    ruleDescription: string;
    ruleSeverity: string | null;
    securitySeverityLevel: string | null;
    toolName: string | null;
    toolGuid: string | null;
    toolVersion: string | null;
    mostRecentInstanceRef: string | null;
    mostRecentInstanceCategory: string | null;
    mostRecentInstanceState: string | null;
    mostRecentInstancePath: string | null;
    mostRecentInstanceStartLine: number | null;
    mostRecentInstanceEndLine: number | null;
    mostRecentInstanceMessage: string | null;
    dismissReason: string | null;
    dismissComment: string | null;
    dismissedBy: string | null;
    createdAtUtc: string | null;
    dismissedAtUtc: string | null;
    fixedAtUtc: string | null;
    securityReview: GithubCodeScanningAlertSecurityReviewDto;
    syncedAtUtc: string;
}

export interface GithubCodeScanningAlertPageResponse {
    items: GithubCodeScanningAlert[];
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
}


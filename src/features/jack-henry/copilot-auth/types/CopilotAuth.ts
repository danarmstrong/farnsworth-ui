export interface CopilotDeviceStartResponse {
    deviceCode: string;
    userCode: string;
    verificationUri: string;
    verificationUriComplete?: string | null;
    expiresInSeconds: number;
    pollIntervalSeconds: number;
}

export interface CopilotCompleteLinkRequest {
    deviceCode: string;
}

export interface CopilotLinkStatusDto {
    isLinked: boolean;
    linkedAtUtc?: string | null;
    linkedByUserId?: string | null;
    lastProbeAtUtc?: string | null;
    lastProbeSucceeded?: boolean | null;
    lastProbeMessage?: string | null;
}

export interface CopilotProbeResultDto {
    isReady: boolean;
    message: string;
    checkedAtUtc: string;
    modelCount?: number | null;
}


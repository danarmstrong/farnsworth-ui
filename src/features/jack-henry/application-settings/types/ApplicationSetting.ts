export type ApplicationSettingValueType = string | number;

export interface ApplicationSetting {
    key: string;
    label: string;
    description: string;
    type: ApplicationSettingValueType;
    value: string | null;
    effectiveValue: string;
    isConfigured: boolean;
}

export interface ApplicationSettingsResponse {
    items: ApplicationSetting[];
}

export interface ApplicationSettingUpsertItemRequest {
    key: string;
    value: string | null;
}

export interface ApplicationSettingsUpsertRequest {
    items: ApplicationSettingUpsertItemRequest[];
}


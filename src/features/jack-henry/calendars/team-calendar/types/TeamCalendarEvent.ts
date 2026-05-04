export type TeamCalendarEventCategory =
    | 'PTO'
    | 'SickDay'
    | 'HobbesRotation'
    | 'OnCall'
    | 'OnCallBackup'
    | 'Holiday'
    | 'FiscalStart'
    | 'FiscalEnd';

export interface TeamCalendarEventDto {
    id: string;
    staffMemberId: string | null;
    title: string | null;
    category: TeamCalendarEventCategory;
    startTime: string;
    endTime: string | null;
    halfDay: boolean;
}

export interface TeamCalendarEventCreateRequest {
    staffMemberId?: string | null;
    title?: string | null;
    category: TeamCalendarEventCategory;
    startTime: string;
    endTime?: string | null;
    halfDay: boolean;
}

/** Matches API upsert body (same shape as create). */
export type TeamCalendarEventUpsertRequest = TeamCalendarEventCreateRequest;

export const TEAM_CALENDAR_CATEGORIES: TeamCalendarEventCategory[] = [
    'PTO',
    'SickDay',
    'HobbesRotation',
    'OnCall',
    'OnCallBackup',
    'Holiday',
    'FiscalStart',
    'FiscalEnd'
];

export const STAFF_CATEGORIES: TeamCalendarEventCategory[] = [
    'PTO',
    'SickDay',
    'HobbesRotation',
    'OnCall',
    'OnCallBackup'
];

export const TITLE_ONLY_CATEGORIES: TeamCalendarEventCategory[] = ['Holiday', 'FiscalStart', 'FiscalEnd'];

import type { EventInput } from '@fullcalendar/core';
import { parseISO } from 'date-fns';
import type { StaffMember } from '@/features/jack-henry/staff-members/types/StaffMember';
import type { TeamCalendarEventCategory, TeamCalendarEventDto } from '@/features/jack-henry/calendars/team-calendar/types/TeamCalendarEvent';

function twoDigit(n: number): string {
    return n < 10 ? `0${n}` : String(n);
}

/** Calendar Y-M-D in UTC — matches how we send all-day bounds (`…T00:00:00.000Z` / EOD UTC) and avoids local-TZ day shifts. */
function calendarDateUtcFromIso(iso: string): string {
    const d = parseISO(iso);
    if (Number.isNaN(d.getTime())) {
        return iso.slice(0, 10);
    }
    const y = d.getUTCFullYear();
    const m = twoDigit(d.getUTCMonth() + 1);
    const day = twoDigit(d.getUTCDate());
    return `${y}-${m}-${day}`;
}

/** Add calendar days to a UTC Y-M-D string, return UTC Y-M-D. */
function addCalendarDaysUtc(ymd: string, deltaDays: number): string {
    const [y, mo, da] = ymd.split('-').map((n) => parseInt(n, 10));
    const d = new Date(Date.UTC(y, mo - 1, da + deltaDays));
    const yy = d.getUTCFullYear();
    const mm = twoDigit(d.getUTCMonth() + 1);
    const dd = twoDigit(d.getUTCDate());
    return `${yy}-${mm}-${dd}`;
}

/** FullCalendar background/border colors per category */
export const CATEGORY_COLORS: Record<TeamCalendarEventCategory, string> = {
    PTO: '#0d9488',
    SickDay: '#e11d48',
    HobbesRotation: '#4f46e5',
    OnCall: '#d97706',
    OnCallBackup: '#c2410c',
    Holiday: '#15803d',
    FiscalStart: '#475569',
    FiscalEnd: '#334155'
};

function staffDisplayName(m: StaffMember): string {
    const n = `${m.firstName} ${m.lastName}`.trim();
    return n || m.email || 'Unknown';
}

function titleForStaffEvent(dto: TeamCalendarEventDto, staff: StaffMember): string {
    const name = staffDisplayName(staff);
    const { category, halfDay } = dto;

    switch (category) {
        case 'PTO':
            return halfDay ? `${name} - PTO (Half Day)` : `${name} - PTO (Full Day)`;
        case 'SickDay':
            return halfDay ? `${name} - Sick (Half Day)` : `${name} - Sick (Full Day)`;
        case 'HobbesRotation':
            return `${name} - Hobbes`;
        case 'OnCall':
            return `${name} - On Call`;
        case 'OnCallBackup':
            return `${name} - On Call (Backup)`;
        case 'Holiday':
        case 'FiscalStart':
        case 'FiscalEnd':
            return dto.title?.trim() || `${name} - ${category}`;
    }
}

/** Inclusive end date for the form (`yyyy-MM-dd`), or empty when single-day / no end on DTO. */
export function formDatesFromTeamEventDto(dto: TeamCalendarEventDto): { startDate: string; endDate: string } {
    const startDate = calendarDateUtcFromIso(dto.startTime);
    let endDate = '';
    if (dto.endTime) {
        const inclusiveEnd = calendarDateUtcFromIso(dto.endTime);
        if (inclusiveEnd > startDate) {
            endDate = inclusiveEnd;
        }
    }
    return { startDate, endDate };
}

export function mapTeamEventToFullCalendar(dto: TeamCalendarEventDto, staffMembers: StaffMember[]): EventInput {
    const color = CATEGORY_COLORS[dto.category] ?? '#64748b';

    let title: string;
    if (!dto.staffMemberId) {
        title = dto.title?.trim() ?? '';
    } else {
        const staff = staffMembers.find((s) => s.id === dto.staffMemberId);
        title = staff ? titleForStaffEvent(dto, staff) : dto.title?.trim() || 'Unknown';
    }

    const start = calendarDateUtcFromIso(dto.startTime);
    let end: string | undefined;
    if (dto.endTime) {
        const inclusiveEnd = calendarDateUtcFromIso(dto.endTime);
        // FullCalendar all-day `end` is exclusive; omit when same as start (single calendar day).
        if (inclusiveEnd > start) {
            end = addCalendarDaysUtc(inclusiveEnd, 1);
        }
    }

    const input: EventInput = {
        id: dto.id,
        title,
        allDay: true,
        start,
        backgroundColor: color,
        borderColor: color,
        extendedProps: { dto }
    };
    if (end) {
        input.end = end;
    }
    return input;
}

export function toStartOfDayIso(dateYmd: string): string {
    return `${dateYmd}T00:00:00.000Z`;
}

export function toEndOfDayIso(dateYmd: string): string {
    return `${dateYmd}T23:59:59.999Z`;
}

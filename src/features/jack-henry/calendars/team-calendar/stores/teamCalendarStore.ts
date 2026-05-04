import { defineStore } from 'pinia';
import axios from '@/utils/axios';
import type {
    TeamCalendarEventCreateRequest,
    TeamCalendarEventDto,
    TeamCalendarEventUpsertRequest
} from '@/features/jack-henry/calendars/team-calendar/types/TeamCalendarEvent';
import { ref } from 'vue';
import { isAxiosError } from 'axios';

const teamCalendarPath = '/team-calendar';

export type FetchTeamCalendarEventsParams = {
    startFromUtc: string;
    startToUtc: string;
    staffMemberId?: string;
};

export type FetchEventsResult = 'applied' | 'skipped-dedupe' | 'stale';

function rangeKey(p: FetchTeamCalendarEventsParams): string {
    return `${p.startFromUtc}\0${p.startToUtc}\0${p.staffMemberId ?? ''}`;
}

/** Widen the list window so UTC calendar-midnight events align with FullCalendar local `datesSet` bounds. */
const RANGE_PAD_MS = 2 * 24 * 60 * 60 * 1000;

function padRangeForUtcAllDayOverlap(range: FetchTeamCalendarEventsParams): FetchTeamCalendarEventsParams {
    const startMs = new Date(range.startFromUtc).getTime() - RANGE_PAD_MS;
    const endMs = new Date(range.startToUtc).getTime() + RANGE_PAD_MS;
    return {
        ...range,
        startFromUtc: new Date(startMs).toISOString(),
        startToUtc: new Date(endMs).toISOString()
    };
}

export const useTeamCalendarStore = defineStore('teamCalendar', () => {
    const events = ref<TeamCalendarEventDto[]>([]);
    const loading = ref(false);
    const error = ref<string | null>(null);

    /** Visible window from FullCalendar (unpadded); used for dedupe and no-arg refetch. */
    const lastVisibleRange = ref<FetchTeamCalendarEventsParams | null>(null);
    /** Dedupe identical `datesSet` / option churn without blocking explicit refetch. */
    let lastFetchedVisibleKey: string | null = null;
    /** Ignore stale axios responses when `datesSet` or `events` updates overlap requests. */
    let fetchGeneration = 0;

    function setErrorMessage(err: unknown, fallback: string): string {
        if (isAxiosError(err)) {
            return err.response?.data?.message || err.message || fallback;
        }
        return fallback;
    }

    /**
     * @param explicitRange - From FullCalendar `events` / `datesSet`; identical consecutive visible ranges skip the HTTP call.
     * @param explicitRange omitted - Refetch the last visible window (refresh); always hits the network.
     * @returns `stale` when a newer fetch was started — caller must not treat `events` as belonging to this request.
     */
    async function fetchEvents(explicitRange?: FetchTeamCalendarEventsParams): Promise<FetchEventsResult> {
        const visibleRange = explicitRange ?? lastVisibleRange.value ?? null;

        if (!visibleRange) {
            return 'skipped-dedupe';
        }

        if (explicitRange && lastFetchedVisibleKey === rangeKey(explicitRange)) {
            return 'skipped-dedupe';
        }

        const queryRange = padRangeForUtcAllDayOverlap(visibleRange);
        const seq = ++fetchGeneration;

        error.value = null;
        loading.value = true;
        try {
            const params: Record<string, string> = {
                startFromUtc: queryRange.startFromUtc,
                startToUtc: queryRange.startToUtc
            };
            if (queryRange.staffMemberId) {
                params.staffMemberId = queryRange.staffMemberId;
            }
            const { data } = await axios.get<TeamCalendarEventDto[]>(teamCalendarPath, { params });
            if (seq !== fetchGeneration) {
                return 'stale';
            }
            events.value = data;
            lastVisibleRange.value = visibleRange;
            lastFetchedVisibleKey = rangeKey(visibleRange);
            return 'applied';
        } catch (err) {
            if (seq !== fetchGeneration) {
                return 'stale';
            }
            error.value = setErrorMessage(err, 'Failed to fetch team calendar events');
            throw err;
        } finally {
            if (seq === fetchGeneration) {
                loading.value = false;
            }
        }
    }

    async function createEvent(payload: TeamCalendarEventCreateRequest): Promise<TeamCalendarEventDto | null> {
        error.value = null;
        loading.value = true;
        try {
            const { data } = await axios.post<TeamCalendarEventDto>(teamCalendarPath, payload);
            return data;
        } catch (err) {
            error.value = setErrorMessage(err, 'Failed to create team calendar event');
            return null;
        } finally {
            loading.value = false;
        }
    }

    async function updateEvent(id: string, payload: TeamCalendarEventUpsertRequest): Promise<TeamCalendarEventDto | null> {
        error.value = null;
        loading.value = true;
        try {
            const { data } = await axios.put<TeamCalendarEventDto>(`${teamCalendarPath}/${id}`, payload);
            return data;
        } catch (err) {
            error.value = setErrorMessage(err, 'Failed to update team calendar event');
            return null;
        } finally {
            loading.value = false;
        }
    }

    async function deleteEvent(id: string): Promise<boolean> {
        error.value = null;
        loading.value = true;
        try {
            await axios.delete(`${teamCalendarPath}/${id}`);
            return true;
        } catch (err) {
            error.value = setErrorMessage(err, 'Failed to delete team calendar event');
            return false;
        } finally {
            loading.value = false;
        }
    }

    function clearError() {
        error.value = null;
    }

    return {
        events,
        loading,
        error,
        fetchEvents,
        createEvent,
        updateEvent,
        deleteEvent,
        clearError
    };
});

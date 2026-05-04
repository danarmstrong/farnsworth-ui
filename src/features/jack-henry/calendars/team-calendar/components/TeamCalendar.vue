<script setup lang="ts">
import { computed, markRaw, nextTick, onMounted, ref, watch } from 'vue';
import FullCalendar from '@fullcalendar/vue3';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { CalendarOptions, DateSelectArg, EventClickArg, EventInput } from '@fullcalendar/core';
import { format, parseISO, subDays } from 'date-fns';
import { useTeamCalendarStore } from '@/features/jack-henry/calendars/team-calendar/stores/teamCalendarStore';
import { useStaffMemberStore } from '@/features/jack-henry/staff-members/stores/staffMemberStore';
import {
    STAFF_CATEGORIES,
    TEAM_CALENDAR_CATEGORIES,
    type TeamCalendarEventCategory,
    type TeamCalendarEventDto,
    type TeamCalendarEventUpsertRequest
} from '@/features/jack-henry/calendars/team-calendar/types/TeamCalendarEvent';
import {
    formDatesFromTeamEventDto,
    mapTeamEventToFullCalendar,
    toEndOfDayIso,
    toStartOfDayIso
} from '@/features/jack-henry/calendars/team-calendar/utils/mapTeamCalendarEvent';
import type { SelectOption } from '@/types/SelectOption';
import { useConfirm } from '@/utils/helpers/useConfirm';

const teamCalendarStore = useTeamCalendarStore();
const staffMemberStore = useStaffMemberStore();
const confirm = useConfirm();
const fullCalendarRef = ref<InstanceType<typeof FullCalendar> | null>(null);

const eventDialogOpen = ref(false);
const eventDialogMode = ref<'create' | 'edit'>('create');
const editingEventId = ref<string | null>(null);

const saving = ref(false);
const deleting = ref(false);
const formValidationError = ref<string | null>(null);

const formCategory = ref<TeamCalendarEventCategory>('PTO');
const formStaffMemberId = ref<string>('');
const formTitle = ref('');
const formStartDate = ref('');
const formEndDate = ref('');
const formHalfDay = ref(false);

const staffOptions = computed<SelectOption<string>[]>(() =>
    staffMemberStore.staffMembers.map((m) => ({
        label: `${m.firstName} ${m.lastName}`.trim() || m.email,
        value: m.id
    }))
);

const CATEGORY_LABELS: Record<TeamCalendarEventCategory, string> = {
    PTO: 'PTO',
    SickDay: 'Sick day',
    HobbesRotation: 'Hobbes rotation',
    OnCall: 'On call',
    OnCallBackup: 'On call (backup)',
    Holiday: 'Holiday',
    FiscalStart: 'Fiscal start',
    FiscalEnd: 'Fiscal end'
};

const categoryItems = computed(() =>
    TEAM_CALENDAR_CATEGORIES.map((c) => ({
        title: CATEGORY_LABELS[c],
        value: c
    }))
);

const dialogTitle = computed(() =>
    eventDialogMode.value === 'edit' ? 'Edit team calendar event' : 'New team calendar event'
);

const showStaffField = computed(() => STAFF_CATEGORIES.includes(formCategory.value));
const showTitleField = computed(() => formCategory.value === 'Holiday');
const showHalfDay = computed(() => formCategory.value === 'PTO' || formCategory.value === 'SickDay');

watch(formCategory, (cat) => {
    if (cat !== 'PTO' && cat !== 'SickDay') {
        formHalfDay.value = false;
    }
});

/** Cancels stale FullCalendar `events` callback completions when the visible range changes quickly. */
let teamCalendarEventsLoadSeq = 0;

function loadTeamCalendarEvents(
    fetchInfo: { start: Date; end: Date },
    successCallback: (events: EventInput[]) => void,
    failureCallback: (error: Error) => void
): void {
    const mySeq = ++teamCalendarEventsLoadSeq;
    void (async () => {
        try {
            const result = await teamCalendarStore.fetchEvents({
                startFromUtc: fetchInfo.start.toISOString(),
                startToUtc: fetchInfo.end.toISOString()
            });
            if (mySeq !== teamCalendarEventsLoadSeq || result === 'stale') {
                return;
            }
            // `skipped-dedupe` still has the correct `events` for this range; `applied` refreshed them.
            successCallback(
                teamCalendarStore.events.map((e) => mapTeamEventToFullCalendar(e, staffMemberStore.staffMembers))
            );
        } catch (err) {
            if (mySeq !== teamCalendarEventsLoadSeq) {
                return;
            }
            failureCallback(err instanceof Error ? err : new Error(String(err)));
        }
    })();
}

function refetchCalendarEvents() {
    void nextTick(() => {
        fullCalendarRef.value?.getApi().refetchEvents();
    });
}

async function refreshTeamCalendar() {
    await teamCalendarStore.fetchEvents();
    refetchCalendarEvents();
}

function handleDateSelect(selectInfo: DateSelectArg) {
    clearFormFields();
    teamCalendarStore.clearError();
    eventDialogMode.value = 'create';
    editingEventId.value = null;
    const start = selectInfo.startStr.slice(0, 10);
    const endExclusive = selectInfo.endStr.slice(0, 10);
    const endInclusive = format(subDays(parseISO(`${endExclusive}T12:00:00`), 1), 'yyyy-MM-dd');
    formStartDate.value = start;
    formEndDate.value = endInclusive >= start ? endInclusive : start;
    eventDialogOpen.value = true;
    const api = fullCalendarRef.value?.getApi();
    api?.unselect();
}

function handleEventClick(clickInfo: EventClickArg) {
    const raw = clickInfo.event.extendedProps?.dto as TeamCalendarEventDto | undefined;
    if (!raw?.id) {
        return;
    }
    clearFormFields();
    teamCalendarStore.clearError();
    eventDialogMode.value = 'edit';
    editingEventId.value = raw.id;
    formCategory.value = raw.category;
    formStaffMemberId.value = raw.staffMemberId ?? '';
    formTitle.value = raw.title ?? '';
    const { startDate, endDate } = formDatesFromTeamEventDto(raw);
    formStartDate.value = startDate;
    formEndDate.value = endDate;
    formHalfDay.value = raw.halfDay;
    eventDialogOpen.value = true;
}

/** Stable reference — avoids `resetOptions` on every store update (fixes timeGridDay flash / empty). */
const calendarPlugins = [dayGridPlugin, timeGridPlugin, interactionPlugin];

const calendarOptions = markRaw<CalendarOptions>({
    plugins: calendarPlugins,
    headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,timeGridDay'
    },
    initialView: 'dayGridMonth',
    editable: false,
    selectable: true,
    selectMirror: true,
    dayMaxEvents: true,
    weekends: true,
    allDaySlot: true,
    events: loadTeamCalendarEvents,
    select: handleDateSelect,
    eventClick: handleEventClick
});

function clearFormFields() {
    formCategory.value = 'PTO';
    formStaffMemberId.value = '';
    formTitle.value = '';
    formStartDate.value = '';
    formEndDate.value = '';
    formHalfDay.value = false;
    formValidationError.value = null;
}

function resetDialogAfterLeave() {
    clearFormFields();
    teamCalendarStore.clearError();
    editingEventId.value = null;
    eventDialogMode.value = 'create';
}

function openAddDialog() {
    clearFormFields();
    teamCalendarStore.clearError();
    eventDialogMode.value = 'create';
    editingEventId.value = null;
    const today = format(new Date(), 'yyyy-MM-dd');
    formStartDate.value = today;
    formEndDate.value = '';
    eventDialogOpen.value = true;
}

function trimStr(v: string | null | undefined): string {
    return (v ?? '').trim();
}

function fiscalAutoTitle(category: TeamCalendarEventCategory): string | null {
    const y = new Date().getFullYear();
    if (category === 'FiscalStart') {
        return `Start of fiscal year ${y + 1}`;
    }
    if (category === 'FiscalEnd') {
        return `End of fiscal year ${y}`;
    }
    return null;
}

function buildEventPayload(): TeamCalendarEventUpsertRequest | null {
    const startDate = trimStr(formStartDate.value);
    if (!startDate) {
        return null;
    }

    const startTime = toStartOfDayIso(startDate);
    const endDate = trimStr(formEndDate.value);
    const endTime =
        endDate && endDate !== startDate ? toEndOfDayIso(endDate) : null;

    if (showStaffField.value) {
        const staffId = trimStr(formStaffMemberId.value as string | null | undefined);
        if (!staffId) {
            return null;
        }
        return {
            staffMemberId: staffId,
            category: formCategory.value,
            startTime,
            endTime,
            halfDay: showHalfDay.value ? formHalfDay.value : false
        };
    }

    const fiscalTitle = fiscalAutoTitle(formCategory.value);
    if (fiscalTitle) {
        return {
            staffMemberId: null,
            title: fiscalTitle,
            category: formCategory.value,
            startTime,
            endTime,
            halfDay: false
        };
    }

    const title = trimStr(formTitle.value);
    if (!title) {
        return null;
    }
    return {
        staffMemberId: null,
        title,
        category: formCategory.value,
        startTime,
        endTime,
        halfDay: false
    };
}

async function submitSave() {
    teamCalendarStore.clearError();
    formValidationError.value = null;
    const payload = buildEventPayload();
    if (!payload) {
        formValidationError.value = 'Please fill in all required fields.';
        return;
    }

    saving.value = true;
    try {
        if (eventDialogMode.value === 'edit' && editingEventId.value) {
            const updated = await teamCalendarStore.updateEvent(editingEventId.value, payload);
            if (updated) {
                eventDialogOpen.value = false;
                await refreshTeamCalendar();
            }
        } else {
            const created = await teamCalendarStore.createEvent(payload);
            if (created) {
                eventDialogOpen.value = false;
                await refreshTeamCalendar();
            }
        }
    } finally {
        saving.value = false;
    }
}

async function submitDelete() {
    if (!editingEventId.value) {
        return;
    }
    const confirmed = await confirm('Delete this calendar event? This cannot be undone.');
    if (!confirmed) {
        return;
    }

    deleting.value = true;
    try {
        const ok = await teamCalendarStore.deleteEvent(editingEventId.value);
        if (ok) {
            eventDialogOpen.value = false;
            await refreshTeamCalendar();
        }
    } finally {
        deleting.value = false;
    }
}

watch(
    () => staffMemberStore.staffMembers.length,
    (len, prev) => {
        if (len > 0 && prev === 0) {
            refetchCalendarEvents();
        }
    }
);

onMounted(async () => {
    if (!staffMemberStore.staffMembers.length) {
        await staffMemberStore.fetchStaffMembers();
    }
    refetchCalendarEvents();
});
</script>

<template>
    <div class="demo-app">
        <div class="demo-app-main d-flex flex-column ga-3">
            <div class="d-flex flex-wrap justify-end align-center ga-2">
                <v-btn
                    variant="outlined"
                    rounded="pill"
                    prepend-icon="mdi-refresh"
                    aria-label="Reload"
                    :loading="teamCalendarStore.loading"
                    @click="refreshTeamCalendar()"
                >
                    Reload
                </v-btn>
                <v-btn color="primary" rounded="pill" prepend-icon="mdi-plus" @click="openAddDialog">Add event</v-btn>
            </div>

            <v-alert v-if="teamCalendarStore.error && !eventDialogOpen" type="error" variant="tonal" density="compact" class="mb-0">
                {{ teamCalendarStore.error }}
            </v-alert>

            <FullCalendar ref="fullCalendarRef" class="demo-app-calendar rounded-md" :options="calendarOptions" />

            <v-dialog v-model="eventDialogOpen" max-width="560px" @after-leave="resetDialogAfterLeave">
                <v-card>
                    <v-card-title class="d-flex justify-space-between align-center">
                        <span class="text-h5">{{ dialogTitle }}</span>
                        <v-btn icon="mdi-close" variant="text" @click="eventDialogOpen = false" />
                    </v-card-title>
                    <v-card-text>
                        <v-alert v-if="formValidationError" type="warning" variant="tonal" density="compact" class="mb-4">
                            {{ formValidationError }}
                        </v-alert>
                        <v-alert v-if="teamCalendarStore.error" type="error" variant="tonal" density="compact" class="mb-4">
                            {{ teamCalendarStore.error }}
                        </v-alert>

                        <v-select
                            v-model="formCategory"
                            :items="categoryItems"
                            item-title="title"
                            item-value="value"
                            label="Category"
                            variant="outlined"
                            hide-details="auto"
                            class="mb-4"
                        />

                        <v-combobox
                            v-if="showStaffField"
                            v-model="formStaffMemberId"
                            :items="staffOptions"
                            item-title="label"
                            item-value="value"
                            :return-object="false"
                            label="Staff member"
                            variant="outlined"
                            hide-details="auto"
                            class="mb-4"
                        />

                        <v-text-field
                            v-if="showTitleField"
                            v-model="formTitle"
                            label="Title"
                            variant="outlined"
                            hide-details="auto"
                            class="mb-4"
                        />

                        <v-text-field
                            v-model="formStartDate"
                            label="Start date"
                            type="date"
                            variant="outlined"
                            hide-details="auto"
                            class="mb-4"
                            required
                        />

                        <v-text-field
                            v-model="formEndDate"
                            label="End date (optional)"
                            type="date"
                            variant="outlined"
                            hide-details="auto"
                            class="mb-4"
                            clearable
                        />

                        <v-switch
                            v-if="showHalfDay"
                            v-model="formHalfDay"
                            label="Half day"
                            color="primary"
                            hide-details
                            class="mb-2"
                        />
                    </v-card-text>
                    <v-card-actions class="px-6 pb-4">
                        <v-btn
                            v-if="eventDialogMode === 'edit'"
                            color="error"
                            variant="text"
                            :loading="deleting"
                            :disabled="saving || teamCalendarStore.loading"
                            @click="submitDelete"
                        >
                            Delete
                        </v-btn>
                        <v-spacer />
                        <v-btn variant="text" @click="eventDialogOpen = false">Cancel</v-btn>
                        <v-btn
                            color="primary"
                            rounded="pill"
                            :loading="saving || teamCalendarStore.loading"
                            :disabled="deleting"
                            @click="submitSave"
                        >
                            {{ eventDialogMode === 'edit' ? 'Save' : 'Create' }}
                        </v-btn>
                    </v-card-actions>
                </v-card>
            </v-dialog>
        </div>
    </div>
</template>

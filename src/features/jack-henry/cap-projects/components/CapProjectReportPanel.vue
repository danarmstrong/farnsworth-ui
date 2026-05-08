<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { ChevronLeftIcon, ChevronRightIcon } from 'vue-tabler-icons';
import { IconClipboardCopy} from '@tabler/icons-vue';
import { useCapProjectStore } from '@/features/jack-henry/cap-projects/stores/capProjectStore';

const props = defineProps<{
    projectId: string;
}>();

const store = useCapProjectStore();

function startOfCurrentMonth(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
}

const targetMonth = ref<Date>(startOfCurrentMonth());
const projectTitle = ref('');
const projectName = ref('');

const targetMonthParam = computed(() => {
    const d = targetMonth.value;
    const y = d.getFullYear();
    const mo = d.getMonth() + 1;
    const m = mo < 10 ? `0${mo}` : String(mo);
    return `${y}-${m}-01`;
});

const monthLabel = computed(() => targetMonth.value.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }));

const moneyFmt = new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });
const rateFmt = new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });

function formatReportHeading(dateStr: string): string {
    const [y, mo, day] = dateStr.split('-').map(Number);
    if (!y || !mo) {
        return dateStr;
    }
    return new Date(y, mo - 1, day || 1).toLocaleDateString(undefined, {
        month: 'long',
        year: 'numeric'
    });
}

function formatCostCenterLabel(cc: { departmentNumber: string; name: string }): string {
    const num = cc.departmentNumber?.trim();
    const name = cc.name?.trim();
    if (num && name) {
        return `${name} (${num})`;
    }
    return name || num || '—';
}

function formatMoney(n: number): string {
    return moneyFmt.format(n);
}

const copySnackbar = ref(false);
const copySnackbarText = ref('');
const copySnackbarColor = ref<'success' | 'error'>('success');

async function copyMoneyToClipboard(amount: number): Promise<void> {
    const text = formatMoney(amount);
    if (typeof navigator === 'undefined' || !navigator.clipboard) {
        copySnackbarText.value = 'Could not copy';
        copySnackbarColor.value = 'error';
        copySnackbar.value = true;
        return;
    }
    try {
        await navigator.clipboard.writeText(text);
        copySnackbarText.value = 'Copied';
        copySnackbarColor.value = 'success';
        copySnackbar.value = true;
    } catch {
        copySnackbarText.value = 'Could not copy';
        copySnackbarColor.value = 'error';
        copySnackbar.value = true;
    }
}

function formatRate(n: number): string {
    return rateFmt.format(n);
}

function shiftMonth(delta: number): void {
    const d = new Date(targetMonth.value);
    d.setMonth(d.getMonth() + delta);
    targetMonth.value = new Date(d.getFullYear(), d.getMonth(), 1);
}

function exportPlaceholder(): void {}

async function loadProjectLabel(): Promise<void> {
    const p = await store.getCapProject(props.projectId);
    if (p) {
        projectTitle.value = p.title;
        projectName.value = p.projectName;
    }
}

async function loadReport(): Promise<void> {
    await store.fetchCapProjectReport(props.projectId, targetMonthParam.value);
}

watch(
    () => [props.projectId, targetMonthParam.value] as const,
    () => {
        void loadReport();
    },
    { immediate: true }
);

watch(
    () => props.projectId,
    () => {
        void loadProjectLabel();
    },
    { immediate: true }
);
</script>

<template>
    <div>
        <v-row class="align-center mb-4" dense>
            <v-col cols="12" md="auto" class="d-flex align-center ga-2 flex-wrap">
                <v-btn variant="tonal" size="small" icon aria-label="Previous month" @click="shiftMonth(-1)">
                    <ChevronLeftIcon stroke-width="1.5" size="20" />
                </v-btn>
                <span class="text-subtitle-1 font-weight-medium">{{ monthLabel }}</span>
                <v-btn variant="tonal" size="small" icon aria-label="Next month" @click="shiftMonth(1)">
                    <ChevronRightIcon stroke-width="1.5" size="20" />
                </v-btn>
            </v-col>
            <v-col cols="12" md="auto" class="ms-md-auto">
                <v-btn variant="flat" color="primary" @click="exportPlaceholder">Export</v-btn>
            </v-col>
        </v-row>

        <p v-if="projectTitle || projectName" class="text-body-1 text-medium-emphasis mb-6">
            <template v-if="projectTitle">{{ projectTitle }}</template>
            <template v-if="projectTitle && projectName"> — </template>
            <template v-if="projectName">{{ projectName }}</template>
        </p>

        <v-alert
            v-if="store.reportError"
            type="error"
            variant="tonal"
            density="compact"
            class="mb-4"
            closable
            @click:close="store.clearReportError"
        >
            {{ store.reportError }}
        </v-alert>

        <div v-if="store.reportLoading" class="text-subtitle-1 text-center py-8">Loading report…</div>

        <template v-else-if="!store.reportError">
            <p v-if="!store.capReports.length" class="text-subtitle-1 text-center py-8 text-medium-emphasis">
                No report data for this month.
            </p>

            <div v-for="(report, idx) in store.capReports" :key="`${report.date}-${report.costCenter.id}-${idx}`" class="mb-10">
                <h6 class="text-h6 font-weight-semibold mb-1">{{ formatCostCenterLabel(report.costCenter) }}</h6>
                <p class="text-body-2 text-medium-emphasis mb-3"></p>
                <div class="border-table">
                    <v-table class="cap-project-report-table">
                        <thead>
                            <tr>
                                <th class="text-subtitle-1 font-weight-semibold">Last name</th>
                                <th class="text-subtitle-1 font-weight-semibold">First name</th>
                                <th class="text-subtitle-1 font-weight-semibold text-end">Hourly rate</th>
                                <th class="text-subtitle-1 font-weight-semibold text-end">Available hours</th>
                                <th class="text-subtitle-1 font-weight-semibold text-end">PTO hours</th>
                                <th class="text-subtitle-1 font-weight-semibold text-end">Non CAP hours</th>
                                <th class="text-subtitle-1 font-weight-semibold text-end">Net hours</th>
                                <th class="text-subtitle-1 font-weight-semibold text-end">CAP %</th>
                                <th class="text-subtitle-1 font-weight-semibold text-end">CAP hours</th>
                                <th class="text-subtitle-1 font-weight-semibold text-end">CAP dollars</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="(row, ri) in report.staffMembers" :key="`${row.lastName}-${row.firstName}-${ri}`">
                                <td class="text-subtitle-1">{{ row.lastName }}</td>
                                <td class="text-subtitle-1">{{ row.firstName }}</td>
                                <td class="text-subtitle-1 text-end text-no-wrap">{{ formatRate(row.hourlyRate) }}</td>
                                <td class="text-subtitle-1 text-end">{{ report.availableHours }}</td>
                                <td class="text-subtitle-1 text-end">{{ row.ptoHours }}</td>
                                <td class="text-subtitle-1 text-end">{{ row.nonCapHours }}</td>
                                <td class="text-subtitle-1 text-end">{{ row.netHours }}</td>
                                <td class="text-subtitle-1 text-end">{{ report.capPercent }}%</td>
                                <td class="text-subtitle-1 text-end">{{ row.capHours }}</td>
                                <td class="text-subtitle-1 text-end text-no-wrap">{{ formatMoney(row.capDollars) }}</td>
                            </tr>
                        </tbody>
                        <tfoot>
                            <tr class="cap-project-report-foot">
                                <td colspan="8" class="text-end text-medium-emphasis text-body-2">Totals</td>
                                <td class="text-subtitle-1 font-weight-semibold text-end">{{ report.totalCapHours }}</td>
                                <td class="text-subtitle-1 font-weight-semibold text-end text-no-wrap">
                                    <button
                                        type="button"
                                        class="cap-project-report-copy-money"
                                        :aria-label="`Copy ${formatMoney(report.totalCapDollars)} to clipboard`"
                                        @click="copyMoneyToClipboard(report.totalCapDollars)"
                                    >
                                        <IconClipboardCopy class="cap-project-report-copy-money__icon" stroke-width="1.5" :size="18" aria-hidden="true" />
                                        <span>{{ formatMoney(report.totalCapDollars) }}</span>
                                    </button>
                                </td>
                            </tr>
                        </tfoot>
                    </v-table>
                </div>
            </div>
        </template>

        <v-snackbar
            v-model="copySnackbar"
            :color="copySnackbarColor"
            location="bottom right"
            :timeout="2000"
        >
            {{ copySnackbarText }}
        </v-snackbar>
    </div>
</template>

<style lang="scss">
.cap-project-report-copy-money {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font: inherit;
    font-weight: inherit;
    color: rgb(var(--v-theme-primary));
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    text-align: inherit;
    white-space: nowrap;
    text-decoration: none;

    > span {
        text-decoration: underline;
        text-underline-offset: 2px;
    }

    &:hover {
        opacity: 0.85;
    }
}

.cap-project-report-copy-money__icon {
    flex-shrink: 0;
    opacity: 0.9;
}

.cap-project-report-table {
    .v-table__wrapper > table {
        width: 100%;
    }

    tfoot td {
        border-top: thin solid rgba(var(--v-theme-on-surface), 0.12);
    }
}
</style>

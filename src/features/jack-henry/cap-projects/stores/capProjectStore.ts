import { defineStore } from 'pinia';
import axios from '@/utils/axios';
import type { AddStaffMembersDto, CapProject, CapProjectCreateDto, CapProjectUpsertDto } from '@/features/jack-henry/cap-projects/types/CapProject';
import type { CapReportDto } from '@/features/jack-henry/cap-projects/types/CapReport';
import { ref } from 'vue';
import { isAxiosError } from 'axios';

const capProjectsPath = '/cap-projects';

function normalizeCapProject(raw: CapProject): CapProject {
    return {
        ...raw,
        title: raw.title ?? '',
        projectName: raw.projectName ?? '',
        capPercentage: typeof raw.capPercentage === 'number' ? raw.capPercentage : 80,
        staffMemberIds: raw.staffMemberIds ?? []
    };
}

function parseFilenameFromContentDisposition(header: string | undefined): string | null {
    if (!header) {
        return null;
    }
    const star = /filename\*=(?:UTF-8''|)([^;]+)/i.exec(header);
    if (star?.[1]) {
        return decodeURIComponent(star[1].trim().replace(/^["']|["']$/g, ''));
    }
    const plain = /filename="([^"]+)"/i.exec(header) || /filename=([^;]+)/i.exec(header);
    if (plain?.[1]) {
        return plain[1].trim().replace(/^["']|["']$/g, '');
    }
    return null;
}

function triggerBlobDownload(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}

async function messageFromRejectedApiData(data: unknown, fallback: string): Promise<string> {
    if (typeof data === 'string') {
        return data || fallback;
    }
    if (data instanceof Blob) {
        const text = await data.text();
        try {
            const j = JSON.parse(text) as { message?: string; title?: string };
            return j.message || j.title || text || fallback;
        } catch {
            return text || fallback;
        }
    }
    if (data && typeof data === 'object' && 'message' in data && typeof (data as { message: unknown }).message === 'string') {
        return (data as { message: string }).message;
    }
    return fallback;
}

function normalizeCapReport(raw: CapReportDto): CapReportDto {
    const cc = raw.costCenter;
    return {
        ...raw,
        costCenter: cc
            ? {
                  id: cc.id ?? '',
                  departmentNumber: cc.departmentNumber ?? '',
                  name: cc.name ?? ''
              }
            : { id: '', departmentNumber: '', name: '' },
        staffMembers: raw.staffMembers ?? []
    };
}

export const useCapProjectStore = defineStore('capProjects', () => {
    const capProjects = ref<CapProject[]>([]);
    const loading = ref(false);
    const error = ref<string | null>(null);

    const capReports = ref<CapReportDto[]>([]);
    const reportLoading = ref(false);
    const reportError = ref<string | null>(null);
    const reportExportLoading = ref(false);
    const reportExportError = ref<string | null>(null);

    function mergeCapProjectIntoList(project: CapProject): void {
        const normalized = normalizeCapProject(project);
        const index = capProjects.value.findIndex((p) => p.id === normalized.id);
        if (index !== -1) {
            capProjects.value[index] = normalized;
        } else {
            capProjects.value.push(normalized);
        }
    }

    async function fetchCapProjects(): Promise<void> {
        error.value = null;
        loading.value = true;
        try {
            const { data } = await axios.get<CapProject[]>(capProjectsPath);
            capProjects.value = data.map(normalizeCapProject);
        } catch (err) {
            error.value = setErrorMessage(err, 'Failed to fetch CAP projects');
        } finally {
            loading.value = false;
        }
    }

    async function getCapProject(id: string): Promise<CapProject | null> {
        error.value = null;

        const existing = capProjects.value.find((p) => p.id === id);
        if (existing) {
            return normalizeCapProject(existing);
        }

        loading.value = true;
        try {
            const { data } = await axios.get<CapProject>(`${capProjectsPath}/${id}`);
            mergeCapProjectIntoList(data);
            return normalizeCapProject(data);
        } catch (err) {
            error.value = setErrorMessage(err, 'Failed to get CAP project');
        } finally {
            loading.value = false;
        }

        return null;
    }

    async function refreshCapProject(id: string): Promise<void> {
        error.value = null;
        try {
            const { data } = await axios.get<CapProject>(`${capProjectsPath}/${id}`);
            mergeCapProjectIntoList(data);
        } catch (err) {
            error.value = setErrorMessage(err, 'Failed to refresh CAP project');
        }
    }

    async function createCapProject(dto: CapProjectCreateDto): Promise<void> {
        error.value = null;
        loading.value = true;
        try {
            const { data } = await axios.post<CapProject>(capProjectsPath, dto);
            if (data?.id) {
                mergeCapProjectIntoList(data);
            } else {
                await fetchCapProjects();
            }
        } catch (err) {
            error.value = setErrorMessage(err, 'Failed to create CAP project');
        } finally {
            loading.value = false;
        }
    }

    async function updateCapProject(id: string, dto: CapProjectUpsertDto): Promise<void> {
        error.value = null;
        loading.value = true;
        try {
            const { data } = await axios.put<CapProject>(`${capProjectsPath}/${id}`, dto);
            if (data?.id) {
                mergeCapProjectIntoList(data);
            } else {
                await refreshCapProject(id);
            }
        } catch (err) {
            error.value = setErrorMessage(err, 'Failed to update CAP project');
        } finally {
            loading.value = false;
        }
    }

    async function deleteCapProject(id: string): Promise<void> {
        error.value = null;
        loading.value = true;
        try {
            await axios.delete(`${capProjectsPath}/${id}`);
            capProjects.value = capProjects.value.filter((p) => p.id !== id);
        } catch (err) {
            error.value = setErrorMessage(err, 'Failed to delete CAP project');
        } finally {
            loading.value = false;
        }
    }

    async function addStaffMembers(capProjectId: string, dto: AddStaffMembersDto): Promise<void> {
        error.value = null;
        loading.value = true;
        try {
            await axios.post(`${capProjectsPath}/${capProjectId}/staff-members`, dto);
            await refreshCapProject(capProjectId);
        } catch (err) {
            error.value = setErrorMessage(err, 'Failed to add staff members');
        } finally {
            loading.value = false;
        }
    }

    async function removeStaffMemberFromCapProject(capProjectId: string, staffMemberId: string): Promise<void> {
        error.value = null;
        loading.value = true;
        try {
            await axios.delete(`${capProjectsPath}/${capProjectId}/staff-members/${staffMemberId}`);
            await refreshCapProject(capProjectId);
        } catch (err) {
            error.value = setErrorMessage(err, 'Failed to remove staff member');
        } finally {
            loading.value = false;
        }
    }

    async function fetchCapProjectReport(projectId: string, targetMonthIsoDate: string): Promise<void> {
        reportError.value = null;
        reportLoading.value = true;
        try {
            const { data } = await axios.get<CapReportDto[]>(`${capProjectsPath}/${projectId}/report`, {
                params: { targetMonth: targetMonthIsoDate }
            });
            capReports.value = Array.isArray(data) ? data.map(normalizeCapReport) : [];
        } catch (err) {
            reportError.value = setErrorMessage(err, 'Failed to load CAP project report');
            capReports.value = [];
        } finally {
            reportLoading.value = false;
        }
    }

    async function exportCapProjectReport(projectId: string, targetMonthIsoDate: string): Promise<void> {
        reportExportError.value = null;
        reportExportLoading.value = true;
        try {
            const response = await axios.get<Blob>(`${capProjectsPath}/${projectId}/export`, {
                params: { targetMonth: targetMonthIsoDate },
                responseType: 'blob'
            });
            const blob = response.data instanceof Blob ? response.data : new Blob([response.data]);
            const cd = response.headers['content-disposition'];
            const filename = parseFilenameFromContentDisposition(
                typeof cd === 'string' ? cd : Array.isArray(cd) ? cd[0] : undefined
            );
            triggerBlobDownload(blob, filename ?? 'cap-report.xlsx');
        } catch (err) {
            reportExportError.value = await messageFromRejectedApiData(err, 'Failed to export CAP project report');
        } finally {
            reportExportLoading.value = false;
        }
    }

    function clearError() {
        error.value = null;
    }

    function clearReportError() {
        reportError.value = null;
    }

    function clearReportExportError() {
        reportExportError.value = null;
    }

    function setErrorMessage(err: unknown, fallback: string): string {
        if (isAxiosError(err)) {
            return err.response?.data?.message || err.message || fallback;
        }
        return fallback;
    }

    return {
        capProjects,
        loading,
        error,
        capReports,
        reportLoading,
        reportError,
        reportExportLoading,
        reportExportError,
        fetchCapProjects,
        fetchCapProjectReport,
        exportCapProjectReport,
        getCapProject,
        createCapProject,
        updateCapProject,
        deleteCapProject,
        addStaffMembers,
        removeStaffMemberFromCapProject,
        clearError,
        clearReportError,
        clearReportExportError
    };
});

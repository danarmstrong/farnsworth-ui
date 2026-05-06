import type { StaffMember } from '@/features/jack-henry/staff-members/types/StaffMember';

/** Staff must have a salary set before they can be assigned to a CAP project. */
export function isStaffEligibleForCapProject(member: StaffMember): boolean {
    return member.salary != null;
}

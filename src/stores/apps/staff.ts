import { defineStore } from 'pinia';
// project imports
import axios from '@/utils/axios';

export const useStaffStore = defineStore('Staff', {
    state: () => ({
        staffMembers: []
    }),
    getters: {},
    actions: {
        // Fetch followers from action
        async fetchContacts() {
            try {
                const response = await axios.get('/api/staff');
                this.staffMembers = response.data.staffMembers;
            } catch (error) {
                alert(error);
                console.log(error);
            }
        }
    }
});

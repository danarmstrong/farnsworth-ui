import AxiosMockAdapter from 'axios-mock-adapter';
import axios from '@/utils/axios';

const enableMocks = import.meta.env.VITE_ENABLE_MOCKS === 'true';

const mock = new AxiosMockAdapter(axios, {
    delayResponse: 0,
    // Empty object means mocks are active; passthrough means use real endpoints
    ...(enableMocks ? {} : { onNoMatch: 'passthrough' as const })
});

export default mock;

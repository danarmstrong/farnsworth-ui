/** Base path for configuration shell routes (see MainRoutes). */
export const CONFIGURATION_BASE = '/configuration';

export interface ConfigurationNavLink {
    title: string;
    to: string;
}

/** Static sections shown in the configuration left rail (order matches former Admin menu). */
export const configurationSectionLinks: ConfigurationNavLink[] = [
    { title: 'Salary Plans', to: `${CONFIGURATION_BASE}/salary-plans` },
    { title: 'Pay Grades', to: `${CONFIGURATION_BASE}/pay-grades` },
    { title: 'Job Families', to: `${CONFIGURATION_BASE}/job-families` },
    { title: 'Job Titles', to: `${CONFIGURATION_BASE}/job-titles` },
    { title: 'Cost Centers', to: `${CONFIGURATION_BASE}/cost-centers` },
    { title: 'CAP Projects', to: `${CONFIGURATION_BASE}/cap-projects` },
    { title: 'Teams', to: `${CONFIGURATION_BASE}/teams` },
    { title: 'Jira Projects', to: `${CONFIGURATION_BASE}/jira-projects` },
    { title: 'Jira Board Watchers', to: `${CONFIGURATION_BASE}/jira-board-watchers` }
];

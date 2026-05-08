export type ConfigProps = {
    Sidebar_drawer: boolean | null;
    mini_sidebar: boolean;
    actTheme: string;
    boxed: boolean;
    setBorderCard: boolean;
};

const config: ConfigProps = {
    Sidebar_drawer: null,
    mini_sidebar: false,
    actTheme: 'DARK_BLUE_THEME',
    boxed: true,
    setBorderCard: false
};

export default config;

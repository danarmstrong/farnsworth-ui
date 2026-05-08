<script setup lang="ts">
import { computed } from 'vue';
import { Marked } from 'marked';
import hljs from 'highlight.js';
import 'highlight.js/styles/github-dark.css';

const props = defineProps<{
    content: string;
}>();

const marked = new Marked({
    breaks: true,
    gfm: true
});

marked.use({
    renderer: {
        code({ text, lang }: { text: string; lang?: string }) {
            const language = lang && hljs.getLanguage(lang) ? lang : 'plaintext';
            const highlighted = hljs.highlight(text, { language, ignoreIllegals: true }).value;
            return `<pre class="markdown-code"><code class="hljs language-${language}">${highlighted}</code></pre>`;
        }
    }
});

const html = computed(() => {
    if (!props.content) {
        return '';
    }
    return marked.parse(props.content) as string;
});
</script>

<template>
    <div class="markdown-content" v-html="html" />
</template>

<style lang="scss">
.markdown-content {
    color: inherit;
    font-size: 0.9375rem;
    line-height: 1.6;
    word-break: break-word;

    > *:first-child {
        margin-top: 0;
    }
    > *:last-child {
        margin-bottom: 0;
    }

    p,
    ul,
    ol,
    blockquote,
    table {
        margin: 0 0 0.75rem 0;
    }

    h1,
    h2,
    h3,
    h4,
    h5,
    h6 {
        margin: 1rem 0 0.5rem 0;
        font-weight: 600;
        line-height: 1.3;
    }
    h1 { font-size: 1.5rem; }
    h2 { font-size: 1.3rem; }
    h3 { font-size: 1.15rem; }
    h4, h5, h6 { font-size: 1rem; }

    ul,
    ol {
        padding-left: 1.5rem;
    }

    a {
        color: rgb(var(--v-theme-primary));
        text-decoration: underline;
    }

    blockquote {
        margin-left: 0;
        padding: 0.25rem 0.75rem;
        border-left: 3px solid rgb(var(--v-theme-borderColor));
        color: rgb(var(--v-theme-on-surface), 0.75);
    }

    code:not(.hljs) {
        padding: 0.125rem 0.35rem;
        border-radius: 4px;
        background: rgba(127, 127, 127, 0.18);
        font-family: 'Fira Code', Menlo, Consolas, monospace;
        font-size: 0.85em;
    }

    pre.markdown-code {
        margin: 0 0 0.75rem 0;
        padding: 0;
        border-radius: 8px;
        overflow: hidden;
        background: #0d1117;

        code.hljs {
            display: block;
            padding: 0.875rem 1rem;
            font-family: 'Fira Code', Menlo, Consolas, monospace;
            font-size: 0.85rem;
            line-height: 1.5;
            overflow-x: auto;
        }
    }

    table {
        border-collapse: collapse;
        width: 100%;

        th,
        td {
            padding: 0.4rem 0.6rem;
            border: 1px solid rgb(var(--v-theme-borderColor));
            text-align: left;
        }

        th {
            background: rgba(127, 127, 127, 0.08);
            font-weight: 600;
        }
    }

    hr {
        border: none;
        border-top: 1px solid rgb(var(--v-theme-borderColor));
        margin: 1rem 0;
    }
}
</style>

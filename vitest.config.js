import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        environment: 'jsdom',
        include: [
            'tests/utils/**/*.{test,spec}.{js,ts}',
            'tests/**/*.{test,spec}.{js,ts}'
        ]
    }
});
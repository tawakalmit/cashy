import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export type Theme = 'light' | 'dark' | 'system';

const getInitialTheme = (): Theme => {
	if (!browser) return 'light';
	return (localStorage.getItem('theme') as Theme) || 'light';
};

export const theme = writable<Theme>(getInitialTheme());

export const applyTheme = (value: Theme) => {
	if (!browser) return;

	localStorage.setItem('theme', value);

	const root = document.documentElement;

	if (value === 'system') {
		const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
		root.classList.toggle('dark', prefersDark);
	} else {
		root.classList.toggle('dark', value === 'dark');
	}
};

export const initTheme = () => {
	if (!browser) return;

	const saved = (localStorage.getItem('theme') as Theme) || 'light';
	theme.set(saved);
	applyTheme(saved);

	// Listen for system theme changes
	window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
		const current = localStorage.getItem('theme') as Theme;
		if (current === 'system') {
			document.documentElement.classList.toggle('dark', e.matches);
		}
	});
};

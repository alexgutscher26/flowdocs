import type { ReactNode } from 'react';
import {
	ConsentManagerDialog,
	ConsentManagerProvider,
	CookieBanner,
} from '@c15t/nextjs';
// For client-only apps (non-SSR), you can use:
// import { ConsentManagerProvider } from '@c15t/nextjs/client';
import { ConsentManagerClient } from './consent-manager.client';

/**
 * Renders the consent manager with server-side configuration and client-side functionality.
 *
 * @param props - Component properties
 * @param props.children - Child components to render within the consent manager context
 */
export function ConsentManager({ children }: { children: ReactNode }) {
	return (
		<ConsentManagerProvider
			options={{
					mode: 'c15t',
					backendURL: '/api/c15t',
					consentCategories: ['necessary', 'marketing'], // Optional: Specify which consent categories to show in the banner. 
					ignoreGeoLocation: true, // Useful for development to always view the banner.
				}}
		>
			<CookieBanner />
			<ConsentManagerDialog />
			<ConsentManagerClient>{children}</ConsentManagerClient>
		</ConsentManagerProvider>
	);
}

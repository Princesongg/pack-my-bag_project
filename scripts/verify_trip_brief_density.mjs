import { verifyTripBriefLayout } from './helpers/verifyTripBriefLayout.mjs';

await verifyTripBriefLayout({ name: 'trip-brief-density', port: 9284, profile: 'trip-brief-density', shrinkDesktop: true, scalePlugs: true });

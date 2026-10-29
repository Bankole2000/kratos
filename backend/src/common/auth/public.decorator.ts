import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

// Marks a route as exempt from ApiKeyGuard. The guard is registered globally
// and fails closed by default — routes must opt out explicitly rather than
// opt in, so a new controller added later is protected unless someone
// deliberately decides otherwise.
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

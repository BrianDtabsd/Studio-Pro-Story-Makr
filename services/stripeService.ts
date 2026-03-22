import { getStoryMakrStripeCheckoutCallable } from '../appConfig.ts';
import { makeCallable } from './firebaseFunctions.ts';

interface CreateCheckoutSessionRequest {
  priceId: string;
  returnUrl: string;
}

interface CreateCheckoutSessionResponse {
  clientSecret: string;
}

const readCheckoutCallableName = (): string => getStoryMakrStripeCheckoutCallable();

export const createCheckoutSession = async (
  priceId: string
): Promise<{ clientSecret: string }> => {
  const fn = makeCallable<CreateCheckoutSessionRequest, CreateCheckoutSessionResponse>(
    readCheckoutCallableName()
  );
  const returnUrl = `${window.location.origin}/?payment=complete&session_id={CHECKOUT_SESSION_ID}`;
  const response = await fn({ priceId, returnUrl });
  if (typeof response.data?.clientSecret !== 'string' || response.data.clientSecret.length === 0) {
    throw new Error('Checkout session callable returned an invalid clientSecret.');
  }
  return response.data;
};

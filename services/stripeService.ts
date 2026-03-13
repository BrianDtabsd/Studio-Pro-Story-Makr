import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';

export const createCheckoutSession = async (
  priceId: string
): Promise<{ clientSecret: string }> => {
  const fn = httpsCallable<{ priceId: string; returnUrl: string }, { clientSecret: string }>(
    functions,
    'createCheckoutSession'
  );
  const returnUrl = `${window.location.origin}/?payment=complete&session_id={CHECKOUT_SESSION_ID}`;
  const response = await fn({ priceId, returnUrl });
  return response.data;
};

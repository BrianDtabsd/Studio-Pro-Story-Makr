import React, { createContext, useContext, useEffect, useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { auth, db, functions, signInWithPopup, googleProvider, onAuthStateChanged, doc, getDoc, setDoc, collection, query, onSnapshot, deleteDoc, User } from './firebase';
import { getAppConfig, getChronosStripeMode } from './appConfig';
import { UserProfile, Project } from './types';

interface FirebaseContextType {
  user: User | null;
  profile: UserProfile | null;
  projects: Project[];
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  saveProject: (project: Project) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  upgradeToPro: () => Promise<void>;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

const pickFirstString = (...values: unknown[]): string | null => {
  for (const value of values) {
    if (typeof value === 'string' && value.trim().length > 0) return value;
  }
  return null;
};

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;
    let unsubscribeProjects: (() => void) | null = null;
    let authEventId = 0;

    const clearUserListeners = () => {
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }
      if (unsubscribeProjects) {
        unsubscribeProjects();
        unsubscribeProjects = null;
      }
    };

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      authEventId += 1;
      const eventId = authEventId;
      clearUserListeners();
      setUser(firebaseUser);
      setLoading(true);
      if (firebaseUser) {
        try {
          const profileRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(profileRef);
          if (eventId !== authEventId) return;

          if (!userDoc.exists()) {
            const newProfile: UserProfile = {
              username: firebaseUser.displayName || 'Anonymous',
              avatarSeed: Math.random().toString(36).substring(7),
              joinedDate: Date.now(),
              isPro: false
            };
            await setDoc(profileRef, newProfile);
          }
          if (eventId !== authEventId) return;

          // Live profile sync prevents stale state after checkout/webhook updates.
          unsubscribeProfile = onSnapshot(profileRef, (snapshot) => {
            setProfile(snapshot.exists() ? (snapshot.data() as UserProfile) : null);
          }, (error) => {
            console.error("Firestore Error (LIST profile):", error);
          });

          const q = query(collection(db, 'users', firebaseUser.uid, 'projects'));
          unsubscribeProjects = onSnapshot(q, (snapshot) => {
            const projectList = snapshot.docs.map(doc => doc.data() as Project);
            setProjects(projectList.sort((a, b) => b.lastModified - a.lastModified));
          }, (error) => {
            console.error("Firestore Error (LIST projects):", error);
          });
        } catch (error) {
          console.error("Auth bootstrap error:", error);
          if (eventId === authEventId) {
            setProfile(null);
            setProjects([]);
          }
        } finally {
          if (eventId === authEventId) setLoading(false);
        }
      } else {
        setProfile(null);
        setProjects([]);
        setLoading(false);
      }
    });

    return () => {
      authEventId += 1;
      clearUserListeners();
      unsubscribe();
    };
  }, []);

  const signIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Sign in error:", error);
      throw error instanceof Error ? error : new Error(String(error));
    }
  };

  const signOutUser = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error("Sign out error:", error);
      throw error instanceof Error ? error : new Error(String(error));
    }
  };

  const saveProject = async (project: Project) => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'users', user.uid, 'projects', project.id), project);
    } catch (error) {
      console.error("Firestore Error (SAVE project):", error);
    }
  };

  const deleteProject = async (projectId: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'projects', projectId));
    } catch (error) {
      console.error("Firestore Error (DELETE project):", error);
    }
  };

  const upgradeToPro = async () => {
    if (!user || !profile) {
      throw new Error("You must be signed in to upgrade.");
    }

    const stripeMode = getChronosStripeMode();
    if (stripeMode === 'off') {
      throw new Error("Upgrade is disabled. Enable CHRONOS_STRIPE_MODE.");
    }
    const appConfig = getAppConfig();
    const priceId = appConfig.CHRONOS_STRIPE_PRICE_ID as string | undefined;
    const checkoutCallableName = (appConfig.CHRONOS_STRIPE_CHECKOUT_CALLABLE as string | undefined) || 'createCheckoutSession';
    const successUrl = (appConfig.CHRONOS_STRIPE_SUCCESS_URL as string | undefined) || window.location.href;
    const cancelUrl = (appConfig.CHRONOS_STRIPE_CANCEL_URL as string | undefined) || window.location.href;
    if (!priceId || priceId.trim().length === 0) {
      throw new Error("Stripe price ID is missing. Set CHRONOS_STRIPE_PRICE_ID.");
    }

    try {
      const createCheckoutSession = httpsCallable(functions, checkoutCallableName, { timeout: 120000 });
      const result = await createCheckoutSession({
        priceId,
        successUrl,
        cancelUrl,
        returnUrl: successUrl
      });
      const data = result.data as any;
      const checkoutUrl = pickFirstString(
        data?.url,
        data?.checkoutUrl,
        data?.checkoutSessionUrl,
        data?.sessionUrl,
        data?.data?.url
      );
      if (!checkoutUrl) {
        throw new Error("Checkout session created without redirect URL.");
      }
      window.location.assign(checkoutUrl);
    } catch (error) {
      console.error("[Billing] Stripe checkout failed:", error);
      throw error instanceof Error ? error : new Error(String(error));
    }
  };

  return (
    <FirebaseContext.Provider value={{ 
      user, profile, projects, loading, 
      signIn, signOut: signOutUser, saveProject, deleteProject, upgradeToPro 
    }}>
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
};

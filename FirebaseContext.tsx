import React, { createContext, useContext, useEffect, useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { auth, db, functions, signInWithPopup, googleProvider, onAuthStateChanged, doc, getDoc, setDoc, collection, query, onSnapshot, deleteDoc, User } from './firebase';
import { getAppConfig, getChronosStripeMode, isLocalProUpgradeAllowed } from './appConfig';
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
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        // Fetch or create profile
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          setProfile(userDoc.data() as UserProfile);
        } else {
          const newProfile: UserProfile = {
            username: firebaseUser.displayName || 'Anonymous',
            avatarSeed: Math.random().toString(36).substring(7),
            joinedDate: Date.now(),
            isPro: localStorage.getItem('story_makr_force_pro') === 'true'
          };
          await setDoc(doc(db, 'users', firebaseUser.uid), newProfile);
          setProfile(newProfile);
        }

        // Listen for projects
        const q = query(collection(db, 'users', firebaseUser.uid, 'projects'));
        const unsubscribeProjects = onSnapshot(q, (snapshot) => {
          const projectList = snapshot.docs.map(doc => doc.data() as Project);
          setProjects(projectList.sort((a, b) => b.lastModified - a.lastModified));
        }, (error) => {
          console.error("Firestore Error (LIST projects):", error);
        });

        return () => unsubscribeProjects();
      } else {
        setProfile(null);
        setProjects([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
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
      localStorage.removeItem('story_makr_force_pro');
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
    const appConfig = getAppConfig();
    const allowLocalProUpgrade = isLocalProUpgradeAllowed();
    const priceId = appConfig.CHRONOS_STRIPE_PRICE_ID as string | undefined;
    const checkoutCallableName = (appConfig.CHRONOS_STRIPE_CHECKOUT_CALLABLE as string | undefined) || 'createCheckoutSession';
    const successUrl = (appConfig.CHRONOS_STRIPE_SUCCESS_URL as string | undefined) || window.location.href;
    const cancelUrl = (appConfig.CHRONOS_STRIPE_CANCEL_URL as string | undefined) || window.location.href;
    let canApplyLocalPro = allowLocalProUpgrade;

    if (stripeMode !== 'off') {
      if (!priceId || priceId.trim().length === 0) {
        if (stripeMode === 'strict' || !allowLocalProUpgrade) {
          throw new Error("Stripe price ID is missing. Set APP_CONFIG.CHRONOS_STRIPE_PRICE_ID.");
        }
        console.warn("[Billing] CHRONOS_STRIPE_PRICE_ID missing; falling back to local Pro toggle.");
      } else {
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

          if (checkoutUrl) {
            window.location.assign(checkoutUrl);
            return;
          }

          if (stripeMode === 'strict') {
            throw new Error("Checkout session created without redirect URL.");
          }
          if (!allowLocalProUpgrade) {
            throw new Error("Checkout response missing redirect URL.");
          }
          console.warn("[Billing] Stripe checkout returned no URL; falling back to local Pro toggle.");
        } catch (error) {
          console.error("[Billing] Stripe checkout failed:", error);
          if (stripeMode === 'strict' || !allowLocalProUpgrade) {
            throw error instanceof Error ? error : new Error(String(error));
          }
        }
      }
    } else {
      canApplyLocalPro = allowLocalProUpgrade;
    }

    if (!canApplyLocalPro) {
      throw new Error("Stripe checkout is required for Pro upgrades. Local Pro fallback is disabled.");
    }

    try {
      const updatedProfile = { ...profile, isPro: true };
      await setDoc(doc(db, 'users', user.uid), updatedProfile);
      setProfile(updatedProfile);
      localStorage.setItem('story_makr_force_pro', 'true');
    } catch (error) {
      console.error("Firestore Error (UPGRADE profile):", error);
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

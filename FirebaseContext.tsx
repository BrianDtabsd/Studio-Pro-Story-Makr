import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, signInWithPopup, googleProvider, onAuthStateChanged, getDoc, setDoc, query, onSnapshot, deleteDoc, User } from './firebase';
import { UserProfile, Project } from './types';
import { deleteProjectAssets } from './services/storageService';
import {
  toUserProfile,
  toUserProfileDoc,
  toUserProfileUpdate,
  userProfileDocRef,
  userProjectDocRef,
  userProjectsCollectionRef,
} from './services/firebaseCollections.ts';

interface FirebaseContextType {
  user: User | null;
  profile: UserProfile | null;
  projects: Project[];
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  saveProject: (project: Project) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  upgradeToPro: () => Promise<void>;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;
    let unsubscribeProjects: (() => void) | null = null;
    let authEventId = 0;
    let warnedProjectsPermission = false;

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

      if (!firebaseUser) {
        setProfile(null);
        setProjects([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const profileRef = userProfileDocRef(firebaseUser.uid);
        const userDoc = await getDoc(profileRef);
        if (eventId !== authEventId) return;

        if (userDoc.exists()) {
          setProfile(toUserProfile(userDoc.data()));
        } else {
          const newProfile: UserProfile = {
            username: firebaseUser.displayName || 'Anonymous',
            avatarSeed: Math.random().toString(36).substring(7),
            joinedDate: Date.now(),
            isPro: false
          };
          await setDoc(profileRef, toUserProfileDoc(newProfile));
          if (eventId !== authEventId) return;
          setProfile(newProfile);
        }

        // Real-time listener on user doc — updates profile instantly when
        // the Stripe webhook writes plan: 'pro' to Firestore.
        unsubscribeProfile = onSnapshot(profileRef, (snap) => {
          if (snap.exists()) {
            setProfile(toUserProfile(snap.data()));
          } else {
            setProfile(null);
          }
        });

        // Listen for projects
        const q = query(userProjectsCollectionRef(firebaseUser.uid));
        unsubscribeProjects = onSnapshot(q, (snapshot) => {
          const projectList = snapshot.docs.map(projectDoc => projectDoc.data());
          setProjects(projectList.sort((a, b) => b.lastModified - a.lastModified));
        }, (error) => {
          console.error("Firestore Error (LIST projects):", error);
          const code = typeof (error as { code?: unknown })?.code === 'string'
            ? String((error as { code?: string }).code).toLowerCase()
            : '';
          if (code.includes('permission-denied') && !warnedProjectsPermission) {
            warnedProjectsPermission = true;
            console.error(
              "Projects read denied by Firestore rules. Confirm this signed-in UID can read users/{uid}/projects in the deployed ruleset/database."
            );
          }
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
    }
  };

  const signOutUser = async () => {
    try {
      await auth.signOut();

    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  const saveProject = async (project: Project) => {
    if (!user) throw new Error('You must be signed in to save projects.');
    try {
      await setDoc(userProjectDocRef(user.uid, project.id), project);
    } catch (error) {
      console.error("Firestore Error (SAVE project):", error);
      throw error;
    }
  };

  const deleteProject = async (projectId: string) => {
    if (!user) return;
    try {
      // Best-effort Storage cleanup — never blocks project deletion if it fails
      await deleteProjectAssets(user.uid, projectId).catch(() => {});
      await deleteDoc(userProjectDocRef(user.uid, projectId));
    } catch (error) {
      console.error("Firestore Error (DELETE project):", error);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    try {
      await setDoc(userProfileDocRef(user.uid), toUserProfileUpdate(updates), { merge: true });
      // onSnapshot listener on the user doc will pick up the change automatically.
    } catch (error) {
      console.error("Firestore Error (UPDATE profile):", error);
    }
  };

  // Upgrade is handled via Stripe checkout — see CheckoutModal in App.tsx.
  // This stub keeps the context interface stable.
  const upgradeToPro = async () => {};

  return (
    <FirebaseContext.Provider value={{ 
      user, profile, projects, loading, 
      signIn, signOut: signOutUser, saveProject, deleteProject, updateProfile, upgradeToPro
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

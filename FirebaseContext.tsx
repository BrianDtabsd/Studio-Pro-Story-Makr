import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db, signInWithPopup, googleProvider, onAuthStateChanged, doc, getDoc, setDoc, collection, query, onSnapshot, deleteDoc, User } from './firebase';
import { UserProfile, Project } from './types';
import { deleteProjectAssets } from './services/storageService';

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
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        // Fetch or create profile
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setProfile({ ...data, isPro: data.plan === 'pro' } as UserProfile);
        } else {
          const newProfile: UserProfile = {
            username: firebaseUser.displayName || 'Anonymous',
            avatarSeed: Math.random().toString(36).substring(7),
            joinedDate: Date.now(),
            isPro: false
          };
          await setDoc(doc(db, 'users', firebaseUser.uid), newProfile);
          setProfile(newProfile);
        }

        // Real-time listener on user doc — updates profile instantly when
        // the Stripe webhook writes plan: 'pro' to Firestore.
        const unsubscribeProfile = onSnapshot(doc(db, 'users', firebaseUser.uid), (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            setProfile({ ...data, isPro: data.plan === 'pro' } as UserProfile);
          }
        });

        // Listen for projects
        const q = query(collection(db, 'users', firebaseUser.uid, 'projects'));
        const unsubscribeProjects = onSnapshot(q, (snapshot) => {
          const projectList = snapshot.docs.map(doc => doc.data() as Project);
          setProjects(projectList.sort((a, b) => b.lastModified - a.lastModified));
        }, (error) => {
          console.error("Firestore Error (LIST projects):", error);
        });

        setLoading(false);
        return () => { unsubscribeProfile(); unsubscribeProjects(); };
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
      // Best-effort Storage cleanup — never blocks project deletion if it fails
      await deleteProjectAssets(user.uid, projectId).catch(() => {});
      await deleteDoc(doc(db, 'users', user.uid, 'projects', projectId));
    } catch (error) {
      console.error("Firestore Error (DELETE project):", error);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'users', user.uid), updates, { merge: true });
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

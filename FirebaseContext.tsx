import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db, signInWithPopup, googleProvider, onAuthStateChanged, doc, getDoc, setDoc, collection, query, onSnapshot, deleteDoc, User } from './firebase';
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
    }
  };

  const signOutUser = async () => {
    try {
      await auth.signOut();
      localStorage.removeItem('story_makr_force_pro');
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
      await deleteDoc(doc(db, 'users', user.uid, 'projects', projectId));
    } catch (error) {
      console.error("Firestore Error (DELETE project):", error);
    }
  };

  const upgradeToPro = async () => {
    if (!user || !profile) return;
    try {
      const updatedProfile = { ...profile, isPro: true };
      await setDoc(doc(db, 'users', user.uid), updatedProfile);
      setProfile(updatedProfile);
      localStorage.setItem('story_makr_force_pro', 'true');
    } catch (error) {
      console.error("Firestore Error (UPGRADE profile):", error);
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

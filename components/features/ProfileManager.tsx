
import React, { useState } from 'react';
import { Project, UserProfile, ActiveView } from '../../types.ts';
import { SectionCard } from '../SectionCard.tsx';
import { ActionButton } from '../common/ActionButton.tsx';

interface ProfileManagerProps {
  currentUser: UserProfile | null;
  projects: Project[];
  onSignIn: (username: string) => void;
  onSignOut: () => void;
  onCreateProject: () => void;
  onLoadProject: (project: Project) => void;
  onDeleteProject: (id: string) => void;
}

export const ProfileManager: React.FC<ProfileManagerProps> = ({
  currentUser, projects, onSignIn, onSignOut, onCreateProject, onLoadProject, onDeleteProject
}) => {
  const [tempUsername, setTempUsername] = useState('');

  if (!currentUser) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="neu-flat p-12 rounded-3xl w-full max-w-md animate-in fade-in zoom-in duration-500">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-neu-text-dark uppercase tracking-tighter mb-2">Login</h2>
            <p className="text-xs text-neu-text uppercase tracking-widest font-bold">Access your Studio Project</p>
          </div>
          <div className="space-y-6">
            <input 
              type="text" 
              placeholder="Username" 
              value={tempUsername}
              onChange={(e) => setTempUsername(e.target.value)}
              className="w-full neu-pressed p-4 rounded-xl text-neu-text-dark outline-none focus:ring-0 transition-all"
            />
            <ActionButton onClick={() => tempUsername && onSignIn(tempUsername)} className="w-full py-5">
                CONTINUE
            </ActionButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row items-center justify-between gap-8 neu-flat p-8 rounded-3xl relative overflow-hidden">
          <div className="flex items-center gap-6 relative z-10">
              <div className="w-20 h-20 rounded-full neu-pressed flex items-center justify-center text-3xl font-black text-accent-orange">
                {currentUser.username[0].toUpperCase()}
              </div>
              <div>
                <h2 className="text-2xl font-black text-neu-text-dark uppercase tracking-tighter">{currentUser.username}</h2>
                <p className="text-xs text-neu-text font-bold uppercase tracking-widest">Active User • Joined {new Date(currentUser.joinedDate).toLocaleDateString()}</p>
              </div>
          </div>
          <div className="flex gap-4 relative z-10">
            <button onClick={onSignOut} className="neu-btn px-6 py-2 text-xs font-bold text-neu-text hover:text-red-500 uppercase tracking-widest transition-colors">Sign Out</button>
            <ActionButton onClick={onCreateProject} className="px-10 py-3">START NEW PROJECT</ActionButton>
          </div>
      </div>

      <div className="space-y-6">
          <h3 className="text-sm font-bold text-neu-text-dark uppercase px-2">Your Projects</h3>
          {projects.length === 0 ? (
            <div className="py-32 text-center neu-pressed rounded-3xl">
                <p className="text-neu-text italic text-sm font-bold">No projects found. Click "Start New Project" to begin.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {projects.map(project => (
                    <div key={project.id} className="group relative neu-flat rounded-3xl hover:scale-[1.02] transition-all duration-500 flex flex-col overflow-hidden">
                        <div className="aspect-video neu-pressed relative overflow-hidden m-4 rounded-2xl">
                            {project.thumbnailUrl ? (
                                <img src={project.thumbnailUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center opacity-20">
                                    <span className="text-[40px] font-black text-neu-text select-none">📁</span>
                                </div>
                            )}
                            <div className="absolute top-4 right-4 neu-flat px-3 py-1.5 rounded-full">
                                <span className="text-xs font-bold text-accent-orange">{project.progress}%</span>
                            </div>
                        </div>

                        <div className="p-6 pt-2 space-y-4 flex-grow flex flex-col">
                            <h4 className="text-lg font-black text-neu-text-dark uppercase tracking-tighter line-clamp-1">{project.title || "New Project"}</h4>
                            <p className="text-sm text-neu-text line-clamp-2 leading-relaxed flex-grow">{project.description || "Drafting in progress..."}</p>
                            
                            <div className="pt-4 flex gap-3">
                                <button 
                                    onClick={() => onLoadProject(project)}
                                    className="flex-1 py-3 neu-btn text-accent-orange text-xs font-bold uppercase tracking-widest transition-all"
                                >RESUME</button>
                                <button 
                                    onClick={() => onDeleteProject(project.id)}
                                    className="p-3 neu-btn text-red-500 hover:text-red-600 rounded-xl transition-all"
                                >
                                    🗑️
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
          )}
      </div>
    </div>
  );
};

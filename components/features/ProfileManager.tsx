
import React, { useState } from 'react';
import { Project, UserProfile } from '../../types.ts';
import { SectionCard } from '../SectionCard.tsx';
import { ActionButton } from '../common/ActionButton.tsx';

interface ProfileManagerProps {
  currentUser: UserProfile | null;
  projects: Project[];
  onSignIn: () => void;
  onSignOut: () => void;
  onUpgradeToPro: () => void;
  onCreateProject: () => void;
  onLoadProject: (project: Project) => void;
  onDeleteProject: (id: string) => void;
}

export const ProfileManager: React.FC<ProfileManagerProps> = ({
  currentUser, projects, onSignIn, onSignOut, onUpgradeToPro, onCreateProject, onLoadProject, onDeleteProject
}) => {
  if (!currentUser) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="neu-flat p-12 rounded-3xl w-full max-w-md animate-in fade-in zoom-in duration-500">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-neu-text-dark uppercase tracking-tighter mb-2">Login</h2>
            <p className="text-xs text-neu-text uppercase tracking-widest font-bold">Access your Studio Project</p>
          </div>
          <div className="space-y-6">
            <div className="flex items-center gap-3 px-2 mb-4">
              <input 
                type="checkbox" 
                id="forcePro" 
                className="w-4 h-4 accent-accent-orange"
                onChange={(e) => {
                  if (e.target.checked) {
                    localStorage.setItem('story_makr_force_pro', 'true');
                  } else {
                    localStorage.removeItem('story_makr_force_pro');
                  }
                }}
                defaultChecked={localStorage.getItem('story_makr_force_pro') === 'true'}
              />
              <label htmlFor="forcePro" className="text-[10px] font-bold text-neu-text uppercase tracking-widest cursor-pointer">Dev: Always Pro Mode</label>
            </div>
            <ActionButton onClick={onSignIn} className="w-full py-5 flex items-center justify-center gap-3">
                <span className="text-lg">G</span> SIGN IN WITH GOOGLE
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
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-black text-neu-text-dark uppercase tracking-tighter">{currentUser.username}</h2>
                  {currentUser.isPro && (
                    <span className="bg-accent-orange text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest shadow-sm">PRO</span>
                  )}
                </div>
                <p className="text-xs text-neu-text font-bold uppercase tracking-widest">Active User • Joined {new Date(currentUser.joinedDate).toLocaleDateString()}</p>
              </div>
          </div>
          <div className="flex items-center gap-4 relative z-10">
            {!currentUser.isPro && (
              <button 
                onClick={onUpgradeToPro} 
                className="neu-btn px-6 py-2 text-xs font-black text-accent-orange hover:bg-accent-orange hover:text-white uppercase tracking-widest transition-all border border-accent-orange/20"
              >
                Upgrade to Pro
              </button>
            )}
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
                                <img src={project.thumbnailUrl || undefined} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
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

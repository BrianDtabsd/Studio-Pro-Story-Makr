
import React from 'react';
import { Project, UserProfile, ActiveView } from '../../types.ts';
import { ActionButton } from '../common/ActionButton.tsx';
import { computeProjectProgress, getWorkflowStats } from '../../projectProgress.ts';

interface ProfileManagerProps {
  currentUser: UserProfile | null;
  projects: Project[];
  onSignIn: () => void;
  onSignOut: () => void;
  onUpgradeToPro: () => void;
  authError?: string | null;
  billingError?: string | null;
  onCreateProject: () => void;
  onLoadProject: (project: Project) => void;
  onDeleteProject: (id: string) => void;
}

export const ProfileManager: React.FC<ProfileManagerProps> = ({
  currentUser, projects, onSignIn, onSignOut, onUpgradeToPro, authError, billingError, onCreateProject, onLoadProject, onDeleteProject
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
            <ActionButton onClick={onSignIn} className="w-full py-5 flex items-center justify-center gap-3">
                <span className="text-lg">G</span> SIGN IN WITH GOOGLE
            </ActionButton>
            {authError && (
              <div className="text-xs font-bold text-red-500 uppercase tracking-wider text-center">
                {authError}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const relativeTime = (ts: number) => {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 2) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const resumeViewLabel = (view?: ActiveView) => {
    switch (view) {
      case ActiveView.ScriptWriter: return 'Script';
      case ActiveView.TextToSpeech: return 'Voice';
      case ActiveView.SceneImages: return 'Visuals';
      case ActiveView.ThumbnailMaker: return 'Cover';
      case ActiveView.ProjectExport: return 'Export';
      case ActiveView.StoryIdeas: return 'Settings';
      default: return 'Settings';
    }
  };

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
          <button onClick={onSignOut} className="neu-btn px-6 py-2 text-xs font-bold text-neu-text hover:text-red-500 uppercase tracking-widest transition-colors">Sign Out</button>
          <ActionButton onClick={onCreateProject} className="px-10 py-3">START NEW PROJECT</ActionButton>
        </div>
        {billingError && (
          <div className="w-full md:w-auto md:absolute md:bottom-3 md:right-8 text-xs font-bold text-red-500 uppercase tracking-wider">
            {billingError}
          </div>
        )}
        {authError && (
          <div className="w-full md:w-auto md:absolute md:bottom-8 md:right-8 text-xs font-bold text-red-500 uppercase tracking-wider">
            {authError}
          </div>
        )}
      </div>

      <div className="space-y-6">
        <h3 className="text-sm font-bold text-neu-text-dark uppercase px-2">Your Projects</h3>
        {projects.length === 0 ? (
          <div className="py-32 text-center neu-pressed rounded-3xl">
            <p className="text-neu-text italic text-sm font-bold">No projects found. Click "Start New Project" to begin.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map((project) => {
              const progress = computeProjectProgress(project.state);
              const stats = getWorkflowStats(project.state);
              return (
                <div key={project.id} className="group relative neu-flat rounded-3xl hover:scale-[1.02] transition-all duration-500 flex flex-col overflow-hidden">
                  <div className="aspect-video neu-pressed relative overflow-hidden m-4 rounded-2xl">
                    {project.thumbnailUrl ? (
                      <img src={project.thumbnailUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={project.title} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center opacity-20">
                        <span className="text-[40px] font-black text-neu-text select-none">📁</span>
                      </div>
                    )}
                    <div className="absolute top-4 right-4 neu-flat px-3 py-1.5 rounded-full">
                      <span className="text-xs font-bold text-accent-orange">{progress}%</span>
                    </div>
                  </div>

                  <div className="p-6 pt-2 space-y-4 flex-grow flex flex-col">
                    <div>
                      <h4 className="text-lg font-black text-neu-text-dark uppercase tracking-tighter line-clamp-1">{project.title || 'Untitled Project'}</h4>
                      <p className="text-[10px] text-neu-text uppercase tracking-widest mt-0.5">{relativeTime(project.lastModified)}</p>
                    </div>
                    <p className="text-sm text-neu-text line-clamp-2 leading-relaxed">{project.description || 'Drafting in progress...'}</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full ${stats.workflow === 'episodic' ? 'text-accent-orange neu-pressed' : 'text-neu-text-dark neu-flat'}`}>
                        {stats.workflow === 'episodic' ? 'Episodic' : 'Single Story'}
                      </span>
                      {stats.workflow === 'episodic' && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full neu-flat text-neu-text-dark">
                          {stats.episodeCount} Episodes
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-neu-text uppercase tracking-wider">
                      Scripts {stats.scriptCount} • Audio {stats.audioCount} • Visuals {stats.visualCount}
                    </p>
                    <p className="text-[10px] text-neu-text uppercase tracking-wider">
                      Resume: {resumeViewLabel(stats.resumeView)}
                    </p>
                    <div className="pt-2 flex gap-3">
                      <button
                        onClick={() => onLoadProject(project)}
                        className="flex-1 py-3 neu-btn text-accent-orange text-xs font-bold uppercase tracking-widest transition-all"
                      >Resume</button>
                      <button
                        onClick={() => onDeleteProject(project.id)}
                        className="p-3 neu-btn text-red-500 hover:text-red-600 rounded-xl transition-all"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

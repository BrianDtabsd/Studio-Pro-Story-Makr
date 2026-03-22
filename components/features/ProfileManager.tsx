
import React, { useRef, useState } from 'react';
import { Project, UserProfile, ActiveView, ContentStyle } from '../../types.ts';
import { ActionButton } from '../common/ActionButton.tsx';
import { computeProjectProgress, getWorkflowStats } from '../../projectProgress.ts';
import { uploadAvatarAsset } from '../../services/storageService.ts';

// ── Mascot ────────────────────────────────────────────────────────────────────
// "Mak" — minimal SVG face, three expressions.
const Mak = ({
  size = 48,
  expression = 'smile',
}: {
  size?: number;
  expression?: 'smile' | 'think' | 'wow';
}) => (
  <svg width={size} height={size} viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="30" cy="30" r="28" fill="#16172a" stroke="#ffad66" strokeWidth="1.5" />
    {expression === 'think' ? (
      <>
        <circle cx="22" cy="27" r="2.5" fill="#ffad66" />
        <circle cx="38" cy="27" r="2.5" fill="#ffad66" />
        <path d="M23 37 Q30 34 37 37" stroke="#ffad66" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="44" cy="16" r="2" fill="#ffad66" opacity="0.45" />
        <circle cx="50" cy="10" r="1.3" fill="#ffad66" opacity="0.25" />
      </>
    ) : expression === 'wow' ? (
      <>
        <ellipse cx="22" cy="27" rx="3" ry="3.5" fill="#ffad66" />
        <ellipse cx="38" cy="27" rx="3" ry="3.5" fill="#ffad66" />
        <ellipse cx="30" cy="38" rx="4" ry="4.5" stroke="#ffad66" strokeWidth="1.5" />
      </>
    ) : (
      <>
        <circle cx="22" cy="27" r="2.5" fill="#ffad66" />
        <circle cx="38" cy="27" r="2.5" fill="#ffad66" />
        <path d="M20 36 Q30 44 40 36" stroke="#ffad66" strokeWidth="1.8" strokeLinecap="round" />
      </>
    )}
  </svg>
);

// ── Avatar presets — 10 color schemes using the Mak face ─────────────────────
const PRESETS = [
  { bg: '#1e1f2e', accent: '#ffad66' },
  { bg: '#1c2a1c', accent: '#66ffad' },
  { bg: '#1c1c2e', accent: '#ad66ff' },
  { bg: '#2a1c1c', accent: '#ff7070' },
  { bg: '#1c2228', accent: '#66c8ff' },
  { bg: '#2a2a1c', accent: '#f0f066' },
  { bg: '#1c2828', accent: '#66ffee' },
  { bg: '#28201c', accent: '#ffb680' },
  { bg: '#1c1c20', accent: '#b0b0b0' },
  { bg: '#201c28', accent: '#ff80cc' },
];

// ── Avatar display ─────────────────────────────────────────────────────────────
const AvatarDisplay = ({ profile, size }: { profile: UserProfile; size: number }) => {
  const choice = profile.avatarChoice ?? 'initials';

  if (choice.startsWith('http')) {
    return (
      <img
        src={choice}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', border: '1.5px solid rgba(255,173,102,0.3)' }}
        alt="avatar"
      />
    );
  }

  if (choice.startsWith('preset-')) {
    const idx = Math.min(parseInt(choice.split('-')[1] ?? '0', 10), PRESETS.length - 1);
    const p = PRESETS[idx];
    return (
      <svg width={size} height={size} viewBox="0 0 60 60" fill="none">
        <circle cx="30" cy="30" r="28" fill={p.bg} stroke={p.accent} strokeWidth="1.5" />
        <circle cx="22" cy="27" r="2.5" fill={p.accent} />
        <circle cx="38" cy="27" r="2.5" fill={p.accent} />
        <path d="M20 36 Q30 44 40 36" stroke={p.accent} strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <div
      className="neu-pressed"
      style={{
        width: size, height: size, borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.38, fontWeight: 900, color: '#ffad66',
        border: '1.5px solid rgba(255,173,102,0.3)',
      }}
    >
      {(profile.username?.[0] ?? '?').toUpperCase()}
    </div>
  );
};

// ── Guide steps ───────────────────────────────────────────────────────────────
const STEPS: { num: string; label: string; expression: 'smile' | 'think' | 'wow'; speech: string }[] = [
  {
    num: '01', label: '1. Settings', expression: 'think',
    speech: 'Start here. Give me keywords, a genre, and a tone. I\'ll generate a set of story concepts for you to pick from.',
  },
  {
    num: '02', label: '2. Script', expression: 'smile',
    speech: 'Pick a concept and I\'ll write a full script. Single narrator, two voices, or a full cast — you set the format.',
  },
  {
    num: '03', label: '3. Voice', expression: 'smile',
    speech: 'Select a voice and I\'ll narrate every line. Edit the script first if you need to, then generate.',
  },
  {
    num: '04', label: '4. Visuals', expression: 'wow',
    speech: 'I\'ll create a scene image for every major moment. Set the visual style once and it carries through.',
  },
  {
    num: '05', label: 'Cover', expression: 'smile',
    speech: 'Generate a thumbnail for the project. It shows on your project card and inside your export.',
  },
  {
    num: '06', label: 'Export', expression: 'smile',
    speech: 'When you\'re done, download everything as a ZIP — script, audio files, images. Packaged and ready.',
  },
];

// ── Props ─────────────────────────────────────────────────────────────────────
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
  onUpdateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  userId: string;
}

// ── Component ─────────────────────────────────────────────────────────────────
export const ProfileManager: React.FC<ProfileManagerProps> = ({
  currentUser,
  projects,
  onSignIn,
  onSignOut,
  onUpgradeToPro,
  authError,
  billingError,
  onCreateProject,
  onLoadProject,
  onDeleteProject,
  onUpdateProfile,
  userId,
}) => {

  // ── Not signed in ───────────────────────────────────────────────────────────
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
          <button
            onClick={onSignIn}
            className="w-full neu-btn py-5 font-black text-sm uppercase tracking-widest text-neu-text-dark"
          >
            Sign In with Google
          </button>
        </div>
      </div>
    );
  }

  // ── Signed-in state ─────────────────────────────────────────────────────────
  const [tab, setTab] = useState<'projects' | 'guide' | 'account'>('projects');
  const [username, setUsername] = useState(currentUser.username ?? '');
  const [bio, setBio] = useState(currentUser.bio ?? '');
  const [avatarChoice, setAvatarChoice] = useState(currentUser.avatarChoice ?? 'initials');
  const [defaultStyle, setDefaultStyle] = useState<string>(currentUser.defaultContentStyle ?? '');
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    setSaving(true);
    await onUpdateProfile({
      username: username.trim() || currentUser.username,
      bio: bio.trim(),
      avatarChoice,
      defaultContentStyle: (defaultStyle as ContentStyle) || undefined,
    });
    setSaving(false);
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 2500);
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    setAvatarError(null);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const url = await uploadAvatarAsset(userId, ev.target?.result as string);
        setAvatarChoice(url);
        await onUpdateProfile({ avatarChoice: url });
      } catch (err) {
        setAvatarError(err instanceof Error ? err.message : 'Upload failed');
      } finally {
        setAvatarUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

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

      <div className="flex flex-wrap items-center gap-3 px-2">
        <button
          onClick={() => setTab('projects')}
          className={`neu-btn px-4 py-2 text-xs font-black uppercase tracking-widest ${tab === 'projects' ? 'text-accent-orange border border-accent-orange/30' : 'text-neu-text'}`}
        >
          Projects
        </button>
        <button
          onClick={() => setTab('guide')}
          className={`neu-btn px-4 py-2 text-xs font-black uppercase tracking-widest ${tab === 'guide' ? 'text-accent-orange border border-accent-orange/30' : 'text-neu-text'}`}
        >
          Guide
        </button>
        <button
          onClick={() => setTab('account')}
          className={`neu-btn px-4 py-2 text-xs font-black uppercase tracking-widest ${tab === 'account' ? 'text-accent-orange border border-accent-orange/30' : 'text-neu-text'}`}
        >
          Account
        </button>
      </div>

      {tab === 'projects' && (
      <div className="space-y-6">
        <h3 className="text-sm font-bold text-neu-text-dark uppercase px-2">Your Projects</h3>
        {projects.length === 0 ? (
          <div className="py-32 text-center neu-pressed rounded-3xl">
            <p className="text-neu-text italic text-sm font-bold">No projects found. Click "Start New Project" to begin.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map((project) => {
              const progress = project.state
                ? computeProjectProgress(project.state)
                : Math.max(0, Math.min(100, project.progress || 0));
              const stats = project.state
                ? getWorkflowStats(project.state)
                : { workflow: 'single' as const, episodeCount: 1, scriptCount: 0, audioCount: 0, visualCount: 0, resumeView: undefined };
              return (
                <div key={project.id} className="group relative neu-flat rounded-3xl hover:scale-[1.02] transition-all duration-500 flex flex-col overflow-hidden">
                  <div className="aspect-video neu-pressed relative overflow-hidden m-4 rounded-2xl">
                    {project.thumbnailUrl ? (
                      <img src={project.thumbnailUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={project.title} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center opacity-15">
                        <span className="text-4xl font-black text-neu-text select-none">SM</span>
                      </div>
                    )}
                    <div className="absolute top-3 right-3 neu-flat px-2.5 py-1 rounded-full">
                      <span className="text-[10px] font-black text-accent-orange">{progress}%</span>
                    </div>
                  </div>
                  <div className="p-6 pt-2 space-y-3 flex-grow flex flex-col">
                    <div>
                      <h4 className="text-lg font-black text-neu-text-dark uppercase tracking-tighter line-clamp-1">{project.title || 'Untitled'}</h4>
                      <p className="text-[10px] text-neu-text uppercase tracking-widest mt-0.5">{relativeTime(project.lastModified)}</p>
                    </div>
                    <p className="text-sm text-neu-text line-clamp-2 leading-relaxed flex-grow">{project.description || 'Drafting in progress...'}</p>
                    <div className="pt-2 flex gap-3">
                      <button
                        onClick={() => onLoadProject(project)}
                        className="flex-1 py-3 neu-btn text-accent-orange text-xs font-bold uppercase tracking-widest transition-all"
                      >Resume</button>
                      <button
                        onClick={() => onDeleteProject(project.id)}
                        className="p-3 neu-btn text-red-400 hover:text-red-600 text-xs font-bold uppercase tracking-widest transition-colors"
                      >Delete</button>
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ══ How It Works tab ═══════════════════════════════════════════════════ */}
      {tab === 'guide' && (
        <div className="space-y-4 max-w-2xl">
          {STEPS.map(step => (
            <div key={step.num} className="neu-flat rounded-2xl p-6 flex gap-5 items-start">
              <div className="flex-shrink-0 flex flex-col items-center gap-1.5">
                <Mak expression={step.expression} size={44} />
                <span className="text-[9px] font-black text-accent-orange uppercase tracking-widest">{step.num}</span>
              </div>
              <div className="flex-grow min-w-0">
                <h4 className="text-xs font-black text-neu-text-dark uppercase tracking-widest mb-3">{step.label}</h4>
                <div className="neu-pressed rounded-xl rounded-tl-sm p-4">
                  <p className="text-sm text-neu-text leading-relaxed">"{step.speech}"</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ══ Account tab ════════════════════════════════════════════════════════ */}
      {tab === 'account' && (
        <div className="max-w-lg space-y-6">

          {/* Avatar */}
          <div className="neu-flat rounded-2xl p-6 space-y-5">
            <h3 className="text-xs font-black text-neu-text-dark uppercase tracking-widest">Avatar</h3>
            <div className="flex items-center gap-4">
              <AvatarDisplay profile={{ ...currentUser, avatarChoice }} size={52} />
              <span className="text-xs text-neu-text">Current</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setAvatarChoice('initials')}
                className={`neu-btn px-4 py-2 text-xs font-black uppercase tracking-widest ${avatarChoice === 'initials' ? 'text-accent-orange border border-accent-orange/30' : 'text-neu-text'}`}
              >
                Text Initials
              </button>
              <button
                onClick={() => fileRef.current?.click()}
                disabled={avatarUploading}
                className="neu-btn px-4 py-2 text-xs font-black uppercase tracking-widest text-neu-text"
              >
                {avatarUploading ? 'Uploading...' : 'Upload Photo'}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
                aria-label="Upload avatar image"
                title="Upload avatar image"
              />
            </div>
            {avatarError && (
              <p className="text-[10px] text-red-400 font-medium">{avatarError}</p>
            )}
            <div>
              <p className="text-[9px] font-black text-neu-text uppercase tracking-widest mb-3">Presets</p>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((preset, i) => {
                  const key = `preset-${i}`;
                  return (
                    <button
                      key={key}
                      onClick={() => setAvatarChoice(key)}
                      title={`Avatar preset ${i + 1}`}
                      aria-label={`Avatar preset ${i + 1}`}
                      className={`rounded-full transition-all ${avatarChoice === key ? 'ring-2 ring-accent-orange ring-offset-2 ring-offset-neu-base scale-110' : 'opacity-60 hover:opacity-100'}`}
                    >
                      <svg width="36" height="36" viewBox="0 0 60 60" fill="none" role="img" aria-hidden="true">
                        <circle cx="30" cy="30" r="28" fill={preset.bg} stroke={preset.accent} strokeWidth="1.5" />
                        <circle cx="22" cy="27" r="2.5" fill={preset.accent} />
                        <circle cx="38" cy="27" r="2.5" fill={preset.accent} />
                        <path d="M20 36 Q30 44 40 36" stroke={preset.accent} strokeWidth="1.8" strokeLinecap="round" />
                      </svg>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Profile info */}
          <div className="neu-flat rounded-2xl p-6 space-y-5">
            <h3 className="text-xs font-black text-neu-text-dark uppercase tracking-widest">Profile</h3>
            <div>
              <label htmlFor="displayName" className="text-[9px] font-black text-neu-text uppercase tracking-widest block mb-2">Display Name</label>
              <input
                id="displayName"
                value={username}
                onChange={e => setUsername(e.target.value)}
                maxLength={40}
                placeholder="Display name shown on your profile"
                title="Display name"
                aria-label="Display name"
                className="w-full neu-pressed rounded-xl px-4 py-3 text-sm font-medium text-neu-text-dark bg-transparent outline-none"
              />
            </div>
            <div>
              <label className="text-[9px] font-black text-neu-text uppercase tracking-widest block mb-2">Bio</label>
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                maxLength={120}
                rows={2}
                placeholder="Filmmaker. Storyteller. Creator."
                className="w-full neu-pressed rounded-xl px-4 py-3 text-sm text-neu-text bg-transparent outline-none resize-none placeholder:opacity-30"
              />
              <p className="text-[9px] text-neu-text opacity-30 mt-1">{bio.length} / 120</p>
            </div>
          </div>

          {/* Default content style */}
          <div className="neu-flat rounded-2xl p-6 space-y-4">
            <div>
              <h3 className="text-xs font-black text-neu-text-dark uppercase tracking-widest">Default Content Style</h3>
              <p className="text-[10px] text-neu-text mt-1 leading-relaxed">Pre-selects your preferred style when starting a new project. You can always change it per project.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {['', 'Comedy', 'Drama', 'Documentary', 'Reality'].map(style => (
                <button
                  key={style || 'none'}
                  onClick={() => setDefaultStyle(style)}
                  className={`neu-btn px-4 py-2 text-xs font-black uppercase tracking-widest transition-all ${defaultStyle === style ? 'text-accent-orange border border-accent-orange/30' : 'text-neu-text'}`}
                >
                  {style || 'None'}
                </button>
              ))}
            </div>
          </div>

          {/* Save + Sign Out */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="neu-btn px-8 py-3 text-sm font-black text-neu-text-dark uppercase tracking-widest"
            >
              {saving ? 'Saving...' : savedMsg ? 'Saved' : 'Save Changes'}
            </button>
            <button
              onClick={onSignOut}
              className="text-xs font-bold text-red-400 hover:text-red-500 uppercase tracking-widest transition-colors"
            >
              Sign Out
            </button>
          </div>

        </div>
      )}

    </div>
  );
};

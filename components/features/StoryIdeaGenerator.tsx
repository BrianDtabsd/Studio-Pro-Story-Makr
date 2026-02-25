import React, { useState } from 'react';
import { generateStoryIdeas, generateImageForPrompt, analyzeCharacterAvatar } from '../../services/geminiService.ts';
import { ActionButton } from '../common/ActionButton.tsx';
import { TextAreaInput } from '../common/TextAreaInput.tsx';
import { SectionCard } from '../SectionCard.tsx';
import { LoadingSpinner } from '../LoadingSpinner.tsx';
import { ErrorDisplay } from '../ErrorDisplay.tsx';
import { STORY_IDEAS_PLACEHOLDER, PRESET_VOICE_KEYS_ORDERED, PRESET_VOICES_CONFIG } from '../../constants.ts';
import { StoryIdea, VIDEO_GENRES, VideoGenreId, ProStorySettings, STORY_SUB_GENRES, CharacterDefinition, PresetVoiceKey } from '../../types.ts';

interface Props {
  onIdeasGenerated: (k: string, i: StoryIdea[], g: VideoGenreId[], s: 'standalone' | 'episodic', p?: ProStorySettings) => void;
  onProceedToScripting: () => void;
  currentKeywords: string;
  currentIdeas: StoryIdea[];
  selectedIdeaIds: string[];
  setSelectedIdeaIds: (ids: string[]) => void;
  proSettingsEnabled: boolean;
  onProSettingsEnabledChange: (e: boolean) => void;
  proSettings: ProStorySettings;
  onProSettingsChange: (s: any) => void;
  onCharacterVoicePresetsChange: (u: any) => void;
}

export const StoryIdeaGenerator: React.FC<Props> = ({
  onIdeasGenerated, onProceedToScripting, currentKeywords, currentIdeas, selectedIdeaIds, setSelectedIdeaIds,
  proSettingsEnabled, onProSettingsEnabledChange, proSettings, onProSettingsChange, onCharacterVoicePresetsChange
}) => {
  const [keywords, setKeywords] = useState(currentKeywords);
  const [storyStyle, setStoryStyle] = useState('Drama');
  const [targetAudience, setTargetAudience] = useState('Everyone');
  const [medium, setMedium] = useState('Live Action');
  const [format, setFormat] = useState<'standalone' | 'episodic'>('standalone');
  const [contentType, setContentType] = useState<'narrative' | 'podcast' | 'educational' | 'reaction'>('narrative');
  const [podcastFormat, setPodcastFormat] = useState('Solo Monologue');
  const [variationCount, setVariationCount] = useState<5 | 10>(5);
  const [sourceLink, setSourceLink] = useState('');
  const [sourceFileName, setSourceFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const narrativeGenres = ['Drama', 'Comedy', 'Sci-Fi', 'Fantasy', 'Thriller', 'Mystery', 'Romance', 'Adventure', 'Coming of Age', 'Historical', 'Alternative History', 'Family Drama', 'Rom Com', 'Young Adult', 'Teen Raunch'];
  const infoGenres = ['News', 'Tech', 'Instructional', 'Edutainment', 'Explainer', 'Wellness', 'Medical', 'Business', 'Finance', 'World Events', 'Political', 'Current Events', 'Religion', 'Maps', 'Transit', 'Urban Design', 'Automobiles', 'Sports', 'Video Games'];

  const audiences = ['Kids', 'Everyone', 'Teens'];
  const proAudiences = ['Adults (18+)'];
  const mediums = ['Live Action', 'Animation'];
  const proMediums = ['Live Action (Indie)', 'Puppets', 'Claymation', 'Stop Motion'];

  const handleAddChar = () => {
    const c: CharacterDefinition = { id: `c-${Date.now()}`, name: '', gender: 'Other', personality: '', physicalDescription: '', relationalStatus: '', voicePresetKey: 'Narrator_F' };
    onProSettingsChange((prev: any) => ({ ...prev, characters: [...prev.characters, c] }));
  };

  const handleCharChange = (id: string, field: string, val: any) => {
    onProSettingsChange((prev: any) => ({
      ...prev,
      characters: prev.characters.map((c: any) => c.id === id ? { ...c, [field]: val } : c)
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSourceFileName(e.target.files[0].name);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      let mappedGenres: VideoGenreId[] = ['storytelling_narrative'];
      if (contentType === 'educational') mappedGenres = ['edutainment'];
      if (contentType === 'podcast') mappedGenres = ['podcast_style_video'];
      if (contentType === 'reaction') mappedGenres = ['comedy_skit']; // approx

      let fullKeywords = keywords;
      if (sourceLink) fullKeywords += `\nReference Link: ${sourceLink}`;
      if (sourceFileName) fullKeywords += `\nReference File: ${sourceFileName}`;

      const activeStyle = contentType === 'podcast' ? `Podcast Format: ${podcastFormat}` : `Genre/Topic: ${storyStyle}`;

      const ideas = await generateStoryIdeas(
        `${fullKeywords} | Content Type: ${contentType} | ${activeStyle} | Audience: ${targetAudience} | Visual Style: ${medium} | Format: ${format}`,
        mappedGenres,
        format,
        proSettingsEnabled ? proSettings : undefined,
        variationCount
      );
      onIdeasGenerated(keywords, ideas, mappedGenres, format, proSettingsEnabled ? proSettings : undefined);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const isPodcast = contentType === 'podcast';

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full">
      {/* --------------------------- */}
      {/* STORY BASICS (Top Section) */}
      {/* --------------------------- */}
      <section className="neu-flat p-6 flex flex-col gap-6">
        <h2 className="text-lg font-bold text-neu-text-dark uppercase tracking-wide border-b border-gray-200 pb-2">Story Basics</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            {/* Format */}
            <div>
              <h3 className="text-sm font-bold text-neu-text-dark mb-3">Video Format</h3>
              <div className="flex flex-wrap gap-3">
                <button type="button" onClick={() => setFormat('standalone')} className={`neu-btn px-4 py-2 text-xs font-medium ${format === 'standalone' ? 'neu-active-orange text-neu-text-dark' : 'text-neu-text'}`}>
                  Single Video
                </button>
                <button type="button" onClick={() => setFormat('episodic')} className={`neu-btn px-4 py-2 text-xs font-medium ${format === 'episodic' ? 'neu-active-orange text-neu-text-dark' : 'text-neu-text'}`}>
                  Series / Episodic
                </button>
              </div>
            </div>

            {/* Content Type */}
            <div>
              <h3 className="text-sm font-bold text-neu-text-dark mb-3">Content Type</h3>
              <div className="flex flex-wrap gap-3">
                {['narrative', 'podcast', 'educational', 'reaction'].map(val => (
                  <button key={val} type="button" onClick={() => setContentType(val as any)} className={`neu-btn px-4 py-2 text-xs font-medium ${contentType === val ? 'neu-active-orange text-neu-text-dark' : 'text-neu-text'}`}>
                    {val.charAt(0).toUpperCase() + val.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Dynamic Genre/Topic or Podcast Format */}
            {isPodcast ? (
              <div className="animate-in fade-in slide-in-from-top-2">
                <h3 className="text-sm font-bold text-neu-text-dark mb-3">Podcast Format</h3>
                <div className="flex flex-wrap gap-3">
                  {['Solo Monologue', 'Interview', 'Panel Discussion'].map(pf => (
                    <button key={pf} type="button" onClick={() => setPodcastFormat(pf)} className={`neu-btn px-4 py-2 text-xs font-medium ${podcastFormat === pf ? 'neu-active-orange text-neu-text-dark' : 'text-neu-text'}`}>
                      {pf}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <h3 className="text-sm font-bold text-neu-text-dark mb-3">Genre & Topic</h3>
                <div className="flex flex-wrap gap-3 items-center">
                  <select
                    value={storyStyle}
                    onChange={(e) => setStoryStyle(e.target.value)}
                    className="neu-pressed px-4 py-3 text-sm font-medium text-neu-text-dark focus:outline-none w-full border-r-8 border-transparent"
                  >
                    <option value="" disabled>Browse all genres & topics...</option>
                    <optgroup label="Fiction & Narrative">
                      {narrativeGenres.map(style => <option key={style} value={style}>{style}</option>)}
                    </optgroup>
                    <optgroup label="Non-Fiction & Info">
                      {infoGenres.map(style => <option key={style} value={style}>{style}</option>)}
                    </optgroup>
                  </select>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            {/* Target Audience */}
            <div>
              <h3 className="text-sm font-bold text-neu-text-dark mb-3">Target Audience</h3>
              <div className="flex flex-wrap gap-3">
                {audiences.map(aud => (
                  <button key={aud} type="button" onClick={() => setTargetAudience(aud)} className={`neu-btn px-4 py-2 text-xs font-medium ${targetAudience === aud ? 'neu-active-orange text-neu-text-dark' : 'text-neu-text'}`}>
                    {aud}
                  </button>
                ))}
                {proAudiences.map(aud => (
                  <button key={aud} type="button" onClick={() => { if (proSettingsEnabled) setTargetAudience(aud); }} className={`neu-btn px-4 py-2 text-xs font-medium ${targetAudience === aud ? 'neu-active-orange text-neu-text-dark' : 'text-neu-text'} ${!proSettingsEnabled ? 'opacity-50 cursor-not-allowed' : ''}`} title={!proSettingsEnabled ? "Unlock Pro Features to use this audience" : ""}>
                    {aud} (Pro)
                  </button>
                ))}
              </div>
            </div>

            {/* Medium */}
            <div>
              <h3 className="text-sm font-bold text-neu-text-dark mb-3">Visual Style</h3>
              <div className="flex flex-wrap gap-3">
                {mediums.map(med => (
                  <button key={med} type="button" onClick={() => setMedium(med)} className={`neu-btn px-4 py-2 text-xs font-medium ${medium === med ? 'neu-active-orange text-neu-text-dark' : 'text-neu-text'}`}>
                    {med}
                  </button>
                ))}
                {proMediums.map(med => (
                  <button key={med} type="button" onClick={() => { if (proSettingsEnabled) setMedium(med); }} className={`neu-btn px-4 py-2 text-xs font-medium ${medium === med ? 'neu-active-orange text-neu-text-dark' : 'text-neu-text'} ${!proSettingsEnabled ? 'opacity-50 cursor-not-allowed' : ''}`} title={!proSettingsEnabled ? "Unlock Pro Features to use this style" : ""}>
                    {med} (Pro)
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --------------------------- */}
      {/* CORE CONCEPT (Middle Section) */}
      {/* --------------------------- */}
      <section className="flex flex-col gap-6">
        <div className="neu-flat p-8 flex-grow flex flex-col">
          <h2 className="text-lg font-bold text-neu-text-dark uppercase tracking-wide text-center mb-1">Your Core Concept</h2>
          <p className="text-xs font-bold text-neu-text mb-4 text-center">What do you want to make a video about?</p>

          <div className="neu-pressed p-6 flex-grow min-h-[160px]">
            <textarea
              className="w-full h-full bg-transparent border-0 resize-none focus:ring-0 text-neu-text-dark leading-relaxed"
              placeholder="e.g., A detective who can talk to ghosts solves a mystery in a futuristic city..."
              value={keywords}
              onChange={e => setKeywords(e.target.value)}
            ></textarea>
          </div>

          <div className="mt-4">
            <label className="block text-xs font-bold text-neu-text-dark mb-2 uppercase tracking-wide">Reference Material (Optional)</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Paste External Link..."
                value={sourceLink}
                onChange={e => setSourceLink(e.target.value)}
                className="w-full neu-pressed p-3 text-sm text-neu-text-dark focus:outline-none"
              />
              <div className="relative">
                <input
                  type="file"
                  accept="video/*,audio/*,image/*"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="neu-btn w-full py-3 text-sm font-bold text-neu-text text-center overflow-hidden text-ellipsis whitespace-nowrap px-4">
                  {sourceFileName ? sourceFileName : 'Upload Reference File'}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-center mt-8">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="neu-action-btn neu-btn px-12 py-4 text-lg font-bold text-neu-text-dark hover:scale-[1.01] transition-transform w-[80%] md:w-[60%]"
            >
              {loading ? 'BRAINSTORMING...' : 'GENERATE IDEAS'}
            </button>
          </div>

          {error && <div className="mt-4 text-red-500 text-center text-sm">{error}</div>}

          {currentIdeas.length > 0 && (
            <div className="mt-12 space-y-6">
              <h3 className="text-md font-bold text-neu-text-dark uppercase text-center border-b border-gray-200 pb-2">
                {format === 'standalone' ? 'Your Idea Options' : 'Generated Episodes'}
              </h3>

              {format === 'standalone' && currentIdeas.length > 0 && proSettingsEnabled && (
                <div className="bg-orange-50/50 p-4 rounded-xl border border-orange-100 flex flex-col gap-2 max-w-lg mx-auto mb-6">
                  <label className="block text-sm font-bold text-neu-text-dark text-center">Custom Series Cart</label>
                  <p className="text-[10px] text-neu-text text-center uppercase tracking-wider mb-2">Click multiple ideas to create a custom series combination</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {selectedIdeaIds.length === 0 && <span className="text-xs italic text-gray-400">No episodes added yet.</span>}
                    {selectedIdeaIds.map((id, index) => {
                      const idea = currentIdeas.find(i => i.id === id);
                      return <span key={id} className="neu-pressed px-3 py-1 rounded-full text-xs font-bold text-accent-orange">Episode {index + 1}: {idea?.title.split(':')[0] || 'Idea'}</span>;
                    })}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentIdeas.map(idea => (
                  <div
                    key={idea.id}
                    onClick={() => {
                      if (format === 'standalone' && proSettingsEnabled) {
                        if (selectedIdeaIds.includes(idea.id)) {
                          setSelectedIdeaIds(selectedIdeaIds.filter(id => id !== idea.id));
                        } else {
                          setSelectedIdeaIds([...selectedIdeaIds, idea.id]);
                        }
                      } else {
                        setSelectedIdeaIds([idea.id]);
                      }
                    }}
                    className={`p-6 rounded-2xl cursor-pointer transition-all ${selectedIdeaIds.includes(idea.id) ? 'neu-pressed border-2 border-orange-300' : 'neu-flat hover:scale-[1.01]'}`}
                  >
                    <h4 className="text-lg font-bold text-neu-text-dark mb-2">{idea.title}</h4>
                    <p className="text-sm text-neu-text">{idea.description}</p>
                  </div>
                ))}
              </div>
              {selectedIdeaIds.length > 0 && (
                <div className="flex justify-center mt-8">
                  <button
                    onClick={onProceedToScripting}
                    className="neu-action-btn neu-btn px-12 py-4 text-md font-bold text-neu-text-dark w-[60%]"
                  >
                    Next: Write the Script
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* --------------------------- */}
      {/* ADVANCED OPTIONS (Bottom Section) */}
      {/* --------------------------- */}
      <section className="neu-flat p-6 flex flex-col h-full transition-all">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-neu-text-dark uppercase tracking-wide">Advanced Options</h2>
          <label className="flex items-center gap-3 cursor-pointer">
            <span className="text-sm font-bold text-neu-text-dark uppercase">Unlock Pro Features</span>
            <input
              type="checkbox"
              checked={proSettingsEnabled}
              onChange={e => onProSettingsEnabledChange(e.target.checked)}
              className="w-5 h-5 rounded text-accent-orange focus:ring-accent-orange bg-neu-base border-gray-300"
            />
          </label>
        </div>

        <div className={`transition-all duration-300 ${proSettingsEnabled ? 'opacity-100 flex-grow flex flex-col gap-8 mt-4' : 'opacity-50 pointer-events-none h-10 overflow-hidden'}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-sm font-bold text-neu-text-dark mb-3">Number of Ideas</h3>
              <div className="flex flex-wrap gap-3">
                <button type="button" onClick={() => setVariationCount(5)} className={`neu-btn px-4 py-2 text-xs font-medium ${variationCount === 5 ? 'neu-active-orange text-neu-text-dark' : 'text-neu-text'}`}>
                  5 Options
                </button>
                <button type="button" onClick={() => setVariationCount(10)} className={`neu-btn px-4 py-2 text-xs font-medium ${variationCount === 10 ? 'neu-active-orange text-neu-text-dark' : 'text-neu-text'}`}>
                  10 Options (Pro)
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-neu-text-dark mb-2">Location & Time Period</label>
              <div className="neu-pressed p-3">
                <textarea
                  className="w-full bg-transparent border-0 resize-none focus:ring-0 text-neu-text-dark text-sm"
                  rows={2}
                  placeholder="e.g. Victorian London, Neo-Tokyo 2049..."
                  value={proSettings.primarySetting}
                  onChange={e => onProSettingsChange((prev: any) => ({ ...prev, primarySetting: e.target.value }))}
                ></textarea>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-bold text-neu-text-dark uppercase tracking-wider">Main Characters</label>
              <button type="button" onClick={handleAddChar} className="neu-btn px-4 py-1.5 text-xs font-bold text-accent-orange uppercase tracking-wider">+ Add Character</button>
            </div>
            <p className="text-[10px] text-neu-text mb-4 uppercase tracking-wide">Add specific characters to include in the story.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {proSettings.characters.map((c, i) => (
                <div key={c.id} className="neu-pressed p-4 flex flex-col gap-3 relative rounded-xl animate-in fade-in">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] uppercase font-bold text-accent-orange">Character {i + 1}</span>
                    <button type="button" onClick={() => onProSettingsChange((prev: any) => ({ ...prev, characters: prev.characters.filter((x: any) => x.id !== c.id) }))} className="text-red-400 hover:text-red-500 text-xs font-bold leading-none p-1">✕</button>
                  </div>
                  <input
                    placeholder="Name (e.g. Dr. Vance)"
                    value={c.name}
                    onChange={e => handleCharChange(c.id, 'name', e.target.value)}
                    className="bg-transparent border-b border-gray-300 p-1 text-sm font-bold text-neu-text-dark focus:outline-none"
                  />
                  <textarea
                    placeholder="Visual details & personality..."
                    rows={2}
                    value={c.physicalDescription}
                    onChange={e => handleCharChange(c.id, 'physicalDescription', e.target.value)}
                    className="bg-transparent border-b border-gray-300 p-1 text-xs text-neu-text focus:outline-none resize-none"
                  />
                </div>
              ))}
              {proSettings.characters.length === 0 && (
                <div className="col-span-full py-8 text-center text-sm italic text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                  No characters defined. AI will generate them automatically.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

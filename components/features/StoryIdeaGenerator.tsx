
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
  const [variationCount, setVariationCount] = useState<5 | 10>(5);
  const [sourceLink, setSourceLink] = useState('');
  const [sourceFileName, setSourceFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const narrativeGenres = ['Drama', 'Comedy', 'Sci-Fi', 'Fantasy', 'Thriller', 'Mystery', 'Romance', 'Adventure', 'Coming of Age', 'Historical', 'Alternative History', 'Family Drama', 'Rom Com', 'Young Adult', 'Teen Raunch'];
  const infoGenres = ['News', 'Tech', 'Instructional', 'Edutainment', 'Explainer', 'Wellness', 'Medical', 'Business', 'Finance', 'World Events', 'Political', 'Current Events', 'Religion', 'Maps', 'Transit', 'Urban Design', 'Automobiles', 'Sports', 'Video Games'];
  const creatorFormats = ['Podcast', 'Video Podcast', 'React', 'Review', 'Recap', 'Stand-up'];
  
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
      const mappedGenres: VideoGenreId[] = ['g-1'];
      
      let fullKeywords = keywords;
      if (sourceLink) fullKeywords += `\nReference Link: ${sourceLink}`;
      if (sourceFileName) fullKeywords += `\nReference File: ${sourceFileName}`;

      const ideas = await generateStoryIdeas(
        `${fullKeywords} | Genre/Topic: ${storyStyle} | Audience: ${targetAudience} | Visual Style: ${medium} | Format: ${format}`, 
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-grow">
      {/* Left Column - Settings */}
      <section className="lg:col-span-3 neu-flat p-6 flex flex-col gap-6">
        <h2 className="text-lg font-bold text-neu-text-dark uppercase tracking-wide">Story Basics</h2>
        
        {/* Format */}
        <div>
          <h3 className="text-sm font-bold text-neu-text-dark mb-3">Video Format</h3>
          <div className="flex flex-wrap gap-3">
            <button 
              type="button"
              onClick={() => setFormat('standalone')}
              className={`neu-btn px-4 py-2 text-xs font-medium ${format === 'standalone' ? 'neu-active-orange text-neu-text-dark' : 'text-neu-text'}`}
            >
              Single Video
            </button>
            <button 
              type="button"
              onClick={() => setFormat('episodic')}
              className={`neu-btn px-4 py-2 text-xs font-medium ${format === 'episodic' ? 'neu-active-orange text-neu-text-dark' : 'text-neu-text'}`}
            >
              Series / Episodic
            </button>
          </div>
        </div>

        {/* Story Style */}
        <div>
          <h3 className="text-sm font-bold text-neu-text-dark mb-3">Genre & Topic</h3>
          <div className="flex flex-wrap gap-3">
            {['Drama', 'Comedy', 'Sci-Fi', 'Explainer'].map(style => (
              <button 
                key={style}
                type="button"
                onClick={() => setStoryStyle(style)}
                className={`neu-btn px-4 py-2 text-xs font-medium ${storyStyle === style ? 'neu-active-orange text-neu-text-dark' : 'text-neu-text'}`}
              >
                {style}
              </button>
            ))}
            <select 
              value={storyStyle}
              onChange={(e) => setStoryStyle(e.target.value)}
              className="neu-pressed px-4 py-2 text-xs font-medium text-neu-text focus:outline-none w-full mt-2"
            >
              <option value="" disabled>Browse all genres & topics...</option>
              <optgroup label="Fiction & Narrative">
                {narrativeGenres.map(style => <option key={style} value={style}>{style}</option>)}
              </optgroup>
              <optgroup label="Non-Fiction & Info">
                {infoGenres.map(style => <option key={style} value={style}>{style}</option>)}
              </optgroup>
              <optgroup label="Creator Formats">
                {creatorFormats.map(style => <option key={style} value={style}>{style}</option>)}
              </optgroup>
            </select>
          </div>
        </div>

        {/* Target Audience */}
        <div>
          <h3 className="text-sm font-bold text-neu-text-dark mb-3">Target Audience</h3>
          <div className="flex flex-wrap gap-3">
            {audiences.map(aud => (
              <button 
                key={aud}
                type="button"
                onClick={() => setTargetAudience(aud)}
                className={`neu-btn px-4 py-2 text-xs font-medium ${targetAudience === aud ? 'neu-active-orange text-neu-text-dark' : 'text-neu-text'}`}
              >
                {aud}
              </button>
            ))}
            {proAudiences.map(aud => (
              <button 
                key={aud}
                type="button"
                onClick={() => {
                  if (proSettingsEnabled) setTargetAudience(aud);
                }}
                className={`neu-btn px-4 py-2 text-xs font-medium ${targetAudience === aud ? 'neu-active-orange text-neu-text-dark' : 'text-neu-text'} ${!proSettingsEnabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                title={!proSettingsEnabled ? "Unlock Advanced Details to use this audience" : ""}
              >
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
              <button 
                key={med}
                type="button"
                onClick={() => setMedium(med)}
                className={`neu-btn px-4 py-2 text-xs font-medium ${medium === med ? 'neu-active-orange text-neu-text-dark' : 'text-neu-text'}`}
              >
                {med}
              </button>
            ))}
            {proMediums.map(med => (
              <button 
                key={med}
                type="button"
                onClick={() => {
                  if (proSettingsEnabled) setMedium(med);
                }}
                className={`neu-btn px-4 py-2 text-xs font-medium ${medium === med ? 'neu-active-orange text-neu-text-dark' : 'text-neu-text'} ${!proSettingsEnabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                title={!proSettingsEnabled ? "Unlock Advanced Details to use this style" : ""}
              >
                {med} (Pro)
              </button>
            ))}
          </div>
        </div>

        {/* Variations */}
        <div>
          <h3 className="text-sm font-bold text-neu-text-dark mb-3">Number of Ideas</h3>
          <div className="flex flex-wrap gap-3">
            <button 
              type="button"
              onClick={() => setVariationCount(5)}
              className={`neu-btn px-4 py-2 text-xs font-medium ${variationCount === 5 ? 'neu-active-orange text-neu-text-dark' : 'text-neu-text'}`}
            >
              5 Options
            </button>
            <button 
              type="button"
              onClick={() => {
                if (proSettingsEnabled) setVariationCount(10);
              }}
              className={`neu-btn px-4 py-2 text-xs font-medium ${variationCount === 10 ? 'neu-active-orange text-neu-text-dark' : 'text-neu-text'} ${!proSettingsEnabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={!proSettingsEnabled ? "Unlock Advanced Details to generate 10 options" : ""}
            >
              10 Options (Pro)
            </button>
          </div>
        </div>
      </section>

      {/* Center Column - Story Seed */}
      <section className="lg:col-span-6 flex flex-col gap-6">
        <div className="neu-flat p-8 flex-grow flex flex-col">
          <h2 className="text-lg font-bold text-neu-text-dark uppercase tracking-wide text-center mb-1">Your Core Concept</h2>
          <p className="text-xs font-bold text-neu-text mb-2 text-center">What do you want to make a video about?</p>
          
          <div className="neu-pressed p-6 flex-grow mb-6 min-h-[240px]">
            <textarea 
              className="w-full h-full bg-transparent border-0 resize-none focus:ring-0 text-neu-text-dark leading-relaxed" 
              placeholder="e.g., A detective who can talk to ghosts solves a mystery in a futuristic city..."
              value={keywords}
              onChange={e => setKeywords(e.target.value)}
            ></textarea>
          </div>

          <div className="flex justify-center mt-4">
            <button 
              onClick={handleSubmit}
              disabled={loading}
              className="neu-action-btn neu-btn px-12 py-4 text-lg font-bold text-neu-text-dark hover:scale-[1.01] transition-transform"
            >
              {loading ? 'BRAINSTORMING...' : 'GENERATE IDEAS'}
            </button>
          </div>

          {error && <div className="mt-4 text-red-500 text-center text-sm">{error}</div>}

          {currentIdeas.length > 0 && (
            <div className="mt-8 space-y-4">
              <h3 className="text-sm font-bold text-neu-text-dark uppercase text-center">
                {format === 'standalone' ? 'Your Idea Options' : 'Generated Episodes'}
              </h3>
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
              {selectedIdeaIds.length > 0 && (
                <div className="flex justify-center mt-6">
                  <button 
                    onClick={onProceedToScripting}
                    className="neu-action-btn neu-btn px-8 py-3 text-md font-bold text-neu-text-dark"
                  >
                    Next: Write the Script
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Right Column - Pro Settings / Episodic Builder */}
      <section className="lg:col-span-3 neu-flat p-6 flex flex-col h-full">
        <h2 className="text-lg font-bold text-neu-text-dark uppercase tracking-wide text-center mb-4">Advanced Details</h2>
        
        <label className="flex items-center gap-3 cursor-pointer mb-6">
          <input 
            type="checkbox" 
            checked={proSettingsEnabled} 
            onChange={e => onProSettingsEnabledChange(e.target.checked)} 
            className="w-5 h-5 rounded text-accent-orange focus:ring-accent-orange bg-neu-base border-gray-300" 
          />
          <span className="text-sm font-bold text-neu-text-dark">Unlock Pro Features</span>
        </label>

        {proSettingsEnabled && (
          <div className="flex-grow flex flex-col gap-6">
            
            {/* Episode Tracker */}
            {format === 'standalone' && currentIdeas.length > 0 && (
              <div>
                <label className="block text-sm font-bold text-neu-text-dark mb-2">Your Selected Episodes</label>
                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                  {selectedIdeaIds.length === 0 && <p className="text-xs text-neu-text italic">Click ideas in the center to add them to your custom series.</p>}
                  {selectedIdeaIds.map((id, index) => {
                    const idea = currentIdeas.find(i => i.id === id);
                    if (!idea) return null;
                    return (
                      <div key={id} className="neu-pressed p-3 flex flex-col gap-1">
                        <span className="text-xs font-bold text-accent-orange uppercase">Episode {index + 1}</span>
                        <h4 className="text-sm font-bold text-neu-text-dark line-clamp-1">{idea.title}</h4>
                        <p className="text-xs text-neu-text line-clamp-2">{idea.description}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Source Material Uploader */}
            <div>
              <label className="block text-sm font-bold text-neu-text-dark mb-2">Reference Material</label>
              <p className="text-[10px] text-neu-text mb-3">Paste a link or upload a file if you are making a React, Review, or Recap video.</p>
              <div className="space-y-3">
                <input 
                  type="text" 
                  placeholder="Paste Video/Podcast Link..." 
                  value={sourceLink}
                  onChange={e => setSourceLink(e.target.value)}
                  className="w-full neu-pressed p-3 text-sm text-neu-text-dark focus:outline-none"
                />
                <div className="relative">
                  <input 
                    type="file" 
                    accept="video/*,audio/*"
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="neu-btn w-full py-2 text-xs font-bold text-neu-text text-center">
                    {sourceFileName ? sourceFileName : 'Upload Video/Audio File'}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-neu-text-dark mb-2">Location & Time Period</label>
              <div className="neu-pressed p-3">
                <textarea 
                  className="w-full bg-transparent border-0 resize-none focus:ring-0 text-neu-text-dark text-sm" 
                  rows={3}
                  placeholder="Where and when does this take place?"
                  value={proSettings.primarySetting}
                  onChange={e => onProSettingsChange((prev: any) => ({ ...prev, primarySetting: e.target.value }))}
                ></textarea>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-bold text-neu-text-dark">Main Characters</label>
                <button type="button" onClick={handleAddChar} className="neu-btn px-3 py-1 text-xs font-bold text-accent-orange">+</button>
              </div>
              <p className="text-[10px] text-neu-text mb-3">Add specific characters to include in the story.</p>
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                {proSettings.characters.map(c => (
                  <div key={c.id} className="neu-pressed p-3 flex flex-col gap-2 relative">
                    <button type="button" onClick={() => onProSettingsChange((prev: any) => ({ ...prev, characters: prev.characters.filter((x:any) => x.id !== c.id) }))} className="absolute top-2 right-2 text-red-500 text-xs font-bold">X</button>
                    <input 
                      placeholder="Character Name" 
                      value={c.name} 
                      onChange={e => handleCharChange(c.id, 'name', e.target.value)} 
                      className="bg-transparent border-b border-gray-300 p-1 text-sm font-bold text-neu-text-dark focus:outline-none" 
                    />
                    <input 
                      placeholder="Personality & Traits" 
                      value={c.physicalDescription} 
                      onChange={e => handleCharChange(c.id, 'physicalDescription', e.target.value)} 
                      className="bg-transparent border-b border-gray-300 p-1 text-xs text-neu-text focus:outline-none" 
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};


import React, { useState } from 'react';
import { generateStoryIdeas } from '../../services/geminiService.ts';
import { ActionButton } from '../common/ActionButton.tsx';
import { TextAreaInput } from '../common/TextAreaInput.tsx';
import { SectionCard } from '../SectionCard.tsx';
import { LoadingSpinner } from '../LoadingSpinner.tsx';
import { ErrorDisplay } from '../ErrorDisplay.tsx';
import { STORY_IDEAS_PLACEHOLDER } from '../../constants.ts';
import { StoryIdea, VIDEO_GENRES, VideoGenreId, ProStorySettings, STORY_SUB_GENRES, CharacterDefinition, ContentStyle, PodcastFormat } from '../../types.ts';

interface Props {
  onIdeasGenerated: (k: string, i: StoryIdea[]) => void;
  onProceedToScripting: () => void;
  currentKeywords: string;
  currentIdeas: StoryIdea[];
  selectedIdeaIds: string[]; 
  setSelectedIdeaIds: (ids: string[] | ((prev: string[]) => string[])) => void;
  isProUser: boolean;
  proSettings: ProStorySettings;
  onProSettingsChange: (s: any) => void;
  onCharacterVoicePresetsChange: (u: any) => void;
}

export const StoryIdeaGenerator: React.FC<Props> = ({ 
  onIdeasGenerated, onProceedToScripting, currentKeywords, currentIdeas, selectedIdeaIds, setSelectedIdeaIds,
  isProUser, proSettings, onProSettingsChange, onCharacterVoicePresetsChange
}) => {
  const [keywords, setKeywords] = useState(currentKeywords);
  const [targetAudience, setTargetAudience] = useState('Everyone');
  const [medium, setMedium] = useState('Live Action');
  const [format, setFormat] = useState<'standalone' | 'episodic'>('standalone');
  const [variationCount, setVariationCount] = useState<5 | 10>(5);
  const [sourceLink, setSourceLink] = useState('');
  const [sourceFileName, setSourceFileName] = useState('');
  const [mediaData, setMediaData] = useState<{mimeType: string, data: string} | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      const file = e.target.files[0];
      setSourceFileName(file.name);
      
      // Read the file as base64 to send to Gemini
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        setMediaData({ mimeType: file.type, data: base64String });
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleTopic = (topicId: VideoGenreId) => {
    onProSettingsChange((prev: any) => {
      const topics = prev.topics || [];
      if (topics.includes(topicId)) {
        return { ...prev, topics: topics.filter((t: VideoGenreId) => t !== topicId) };
      } else {
        return { ...prev, topics: [...topics, topicId] };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      let fullKeywords = keywords;
      if (sourceLink) fullKeywords += `\nReference Link: ${sourceLink}`;
      if (sourceFileName) fullKeywords += `\nReference File: ${sourceFileName}`;

      const ideas = await generateStoryIdeas(
        `${fullKeywords} | Audience: ${targetAudience} | Visual Style: ${medium} | Format: ${format}`, 
        proSettings.topics || [], 
        format, 
        { ...proSettings, subGenre: targetAudience as any }, // Pass audience as subGenre for tone
        variationCount,
        mediaData || undefined
      );
      onIdeasGenerated(keywords, ideas);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const selectedSeries = currentIdeas.find(i => i.isSeriesConcept && selectedIdeaIds.includes(i.id));
  const episodes = currentIdeas.filter(i => !i.isSeriesConcept);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-grow">
      {/* Left Column - Settings */}
      <section className="lg:col-span-3 neu-flat p-6 flex flex-col gap-6">
        <h2 className="text-lg font-bold text-neu-text-dark uppercase tracking-wide">Story Basics</h2>
        
        {/* Format & Podcast Format */}
        <div className="space-y-4">
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

          <div>
            <h3 className="text-sm font-bold text-neu-text-dark mb-3">Podcast or Upload Format</h3>
            <div className="flex flex-wrap gap-3">
              {[PodcastFormat.Recap, PodcastFormat.Review, PodcastFormat.React, PodcastFormat.Interview].map(pf => (
                <button 
                  key={pf}
                  type="button"
                  onClick={() => onProSettingsChange((prev: any) => ({ ...prev, podcastFormat: prev.podcastFormat === pf ? undefined : pf }))}
                  className={`neu-btn px-4 py-2 text-xs font-medium ${proSettings.podcastFormat === pf ? 'neu-active-orange text-neu-text-dark' : 'text-neu-text'}`}
                >
                  {pf}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content Style */}
        <div>
          <h3 className="text-sm font-bold text-neu-text-dark mb-3">Content Style</h3>
          <div className="flex flex-wrap gap-3">
            {[ContentStyle.Comedy, ContentStyle.Drama, ContentStyle.Documentary, ContentStyle.Reality].map(style => (
              <button 
                key={style}
                type="button"
                onClick={() => onProSettingsChange((prev: any) => ({ ...prev, contentStyle: style }))}
                className={`neu-btn px-4 py-2 text-xs font-medium ${proSettings.contentStyle === style ? 'neu-active-orange text-neu-text-dark' : 'text-neu-text'}`}
              >
                {style}
              </button>
            ))}
          </div>
        </div>

        {/* Topics Dropdown */}
        <div>
          <h3 className="text-sm font-bold text-neu-text-dark mb-3">Topics</h3>
          <div className="space-y-2">
            <select 
              onChange={(e) => toggleTopic(e.target.value as VideoGenreId)}
              className="neu-pressed px-4 py-2 text-xs font-medium text-neu-text focus:outline-none w-full"
              value=""
            >
              <option value="" disabled>Add topics...</option>
              {VIDEO_GENRES.map(g => (
                <option key={g.id} value={g.id} disabled={proSettings.topics?.includes(g.id)}>{g.label}</option>
              ))}
            </select>
            <div className="flex flex-wrap gap-2 mt-2">
              {proSettings.topics?.map(topicId => {
                const topic = VIDEO_GENRES.find(g => g.id === topicId);
                return (
                  <span key={topicId} className="flex items-center gap-1 px-2 py-1 bg-neu-pressed rounded-lg text-[10px] font-bold text-neu-text-dark">
                    {topic?.label}
                    <button onClick={() => toggleTopic(topicId)} className="text-red-500 hover:text-red-700">×</button>
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        {/* Character Count */}
        <div>
          <h3 className="text-sm font-bold text-neu-text-dark mb-3">Narrative Structure</h3>
          <div className="flex flex-wrap gap-3">
            <button 
              type="button"
              onClick={() => onProSettingsChange((prev: any) => ({ ...prev, characterCount: 1 }))}
              className={`neu-btn px-4 py-2 text-xs font-medium ${proSettings.characterCount === 1 ? 'neu-active-orange text-neu-text-dark' : 'text-neu-text'}`}
            >
              1 Character / Narrator
            </button>
            <button 
              type="button"
              onClick={() => onProSettingsChange((prev: any) => ({ ...prev, characterCount: 2 }))}
              className={`neu-btn px-4 py-2 text-xs font-medium ${proSettings.characterCount === 2 ? 'neu-active-orange text-neu-text-dark' : 'text-neu-text'}`}
            >
              2 Characters / Interview
            </button>
            <button 
              type="button"
              onClick={() => onProSettingsChange((prev: any) => ({ ...prev, characterCount: 3 }))}
              className={`neu-btn px-4 py-2 text-xs font-medium ${proSettings.characterCount === 3 ? 'neu-active-orange text-neu-text-dark' : 'text-neu-text'}`}
            >
              3+ Characters / Ensemble
            </button>
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
                  if (isProUser) setTargetAudience(aud);
                }}
                className={`neu-btn px-4 py-2 text-xs font-medium ${targetAudience === aud ? 'neu-active-orange text-neu-text-dark' : 'text-neu-text'} ${!isProUser ? 'opacity-50 cursor-not-allowed' : ''}`}
                title={!isProUser ? "Pro subscription required for this audience" : ""}
              >
                {aud}
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
                  if (isProUser) setMedium(med);
                }}
                className={`neu-btn px-4 py-2 text-xs font-medium ${medium === med ? 'neu-active-orange text-neu-text-dark' : 'text-neu-text'} ${!isProUser ? 'opacity-50 cursor-not-allowed' : ''}`}
                title={!isProUser ? "Pro subscription required for this style" : ""}
              >
                {med}
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
                if (isProUser) setVariationCount(10);
              }}
              className={`neu-btn px-4 py-2 text-xs font-medium ${variationCount === 10 ? 'neu-active-orange text-neu-text-dark' : 'text-neu-text'} ${!isProUser ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={!isProUser ? "Pro subscription required for 10 options" : ""}
            >
              10 Options
            </button>
          </div>
        </div>
      </section>

      {/* Center Column - Story Seed */}
      <section className="lg:col-span-6 flex flex-col gap-6">
        <div className="neu-flat p-8 flex-grow flex flex-col">
          
          <div className="mb-6">
            <label className="block text-sm font-bold text-neu-text-dark mb-2">Location & Time Period</label>
            <div className="neu-pressed p-3">
              <textarea 
                className="w-full bg-transparent border-0 resize-none focus:ring-0 text-neu-text-dark text-sm" 
                rows={2}
                placeholder="Where and when does this take place?"
                value={proSettings.primarySetting}
                onChange={e => onProSettingsChange((prev: any) => ({ ...prev, primarySetting: e.target.value }))}
              ></textarea>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-bold text-neu-text-dark">Main Characters</label>
              <button type="button" onClick={handleAddChar} className="neu-btn px-3 py-1 text-xs font-bold text-accent-orange">+</button>
            </div>
            <p className="text-[10px] text-neu-text mb-3">Add specific characters to include in the story.</p>
            <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2">
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

          <h2 className="text-lg font-bold text-neu-text-dark uppercase tracking-wide text-center mb-1">Your Core Concept</h2>
          <p className="text-xs font-bold text-neu-text mb-2 text-center">What do you want to make a video about?</p>
          
          <div className="neu-pressed p-6 flex-grow mb-6 min-h-[160px]">
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
                {format === 'standalone' ? 'Your Idea Options' : 'Series Concept'}
              </h3>
              {currentIdeas.filter(i => format === 'standalone' || i.isSeriesConcept).map(idea => (
                <div 
                  key={idea.id} 
                  onClick={() => {
                    if (format === 'standalone') {
                      setSelectedIdeaIds([idea.id]);
                    } else {
                      // Selecting a series concept
                      setSelectedIdeaIds([idea.id]);
                    }
                  }}
                  className={`p-6 rounded-2xl cursor-pointer transition-all ${selectedIdeaIds.includes(idea.id) ? 'neu-pressed border-2 border-orange-300' : 'neu-flat hover:scale-[1.01]'}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-lg font-bold text-neu-text-dark">{idea.title}</h4>
                    {idea.isSeriesConcept && <span className="text-[10px] font-bold bg-accent-orange text-white px-2 py-0.5 rounded-full uppercase">Series Concept</span>}
                  </div>
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
        <h2 className="text-lg font-bold text-neu-text-dark uppercase tracking-wide text-center mb-4">
          {selectedSeries ? 'Episode Management' : 'Advanced Details'}
        </h2>
        
        <div className="flex-grow flex flex-col gap-6">
          {/* Episode Tracker */}
          {selectedSeries && (
            <div>
              <label className="block text-sm font-bold text-neu-text-dark mb-2">Select Episodes to Script</label>
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {episodes.map((ep) => (
                  <div 
                    key={ep.id} 
                    onClick={() => {
                      setSelectedIdeaIds(prev => 
                        prev.includes(ep.id) ? prev.filter(id => id !== ep.id) : [...prev, ep.id]
                      );
                    }}
                    className={`neu-pressed p-4 flex flex-col gap-1 cursor-pointer transition-all border-2 ${selectedIdeaIds.includes(ep.id) ? 'border-accent-orange' : 'border-transparent'}`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-accent-orange uppercase">Episode</span>
                      <input type="checkbox" checked={selectedIdeaIds.includes(ep.id)} readOnly className="w-4 h-4 rounded text-accent-orange" />
                    </div>
                    <h4 className="text-sm font-bold text-neu-text-dark line-clamp-1">{ep.title}</h4>
                    <p className="text-xs text-neu-text line-clamp-2">{ep.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!selectedSeries && (
            <>
              {/* Source Material Uploader */}
              <div>
                <label className="block text-sm font-bold text-neu-text-dark mb-2">Review, Recap, or Reaction</label>
                <p className="text-[10px] text-neu-text mb-3">Upload a video and the app will return a podcast or video VoiceOver of a review, recap, or reaction to the uploaded content.</p>
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
            </>
          )}
        </div>
      </section>
    </div>
  );
};

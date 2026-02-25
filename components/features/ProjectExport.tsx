import React, { useState } from 'react';
import { SectionCard } from '../SectionCard.tsx';
import { ActionButton } from '../common/ActionButton.tsx';
import { StoryIdea, SceneImageDefinition, TitleCardData, GeneratedImage } from '../../types.ts';
import JSZip from 'jszip';

export const ProjectExport: React.FC<{ story: StoryIdea | null; script: string; scenes: SceneImageDefinition[]; titles: TitleCardData[]; thumbnail: GeneratedImage | null; }> = ({ story, script, scenes, titles, thumbnail }) => {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (!story) return;
    setExporting(true);
    try {
      const zip = new JSZip();
      const folder = zip.folder(story.title.replace(/\s+/g, '_'));
      if (folder) {
        folder.file("script.txt", script);
        const imgFolder = folder.folder("images");
        for (const s of scenes) {
          if (s.generatedImageUrl) folder.file(`scene_${s.sceneNumber}.png`, s.generatedImageUrl.split(',')[1], { base64: true });
          if (s.generatedVideoUrl) {
            const vid = await (await fetch(s.generatedVideoUrl)).blob();
            folder.file(`scene_${s.sceneNumber}.mp4`, vid);
          }
        }
        if (thumbnail) folder.file("thumbnail.png", thumbnail.src.split(',')[1], { base64: true });
        const blob = await zip.generateAsync({ type: "blob" });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${story.title}_project_package.zip`;
        link.click();
      }
    } catch (e) { alert("Failed to package files."); } finally { setExporting(false); }
  };

  return (
    <SectionCard title="Final Project Export">
      <div className="text-center py-10 space-y-8">
        <div className="w-20 h-20 neu-pressed rounded-full flex items-center justify-center mx-auto text-3xl text-accent-orange">📦</div>
        <div><h3 className="text-xl font-bold uppercase text-neu-text-dark">Ready for Download</h3><p className="text-sm text-neu-text mt-2 max-w-sm mx-auto">This will download all your assets (Script, Images, Audio, and Video) in one organized ZIP folder.</p></div>
        <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
          <div className="neu-flat p-4 rounded-xl text-center"><span className="text-lg text-accent-orange font-black block">{scenes.length}</span><span className="text-xs font-bold text-neu-text-dark uppercase">Visual Assets</span></div>
          <div className="neu-flat p-4 rounded-xl text-center"><span className="text-lg text-accent-orange font-black block">{scenes.filter(s => s.generatedVideoUrl).length}</span><span className="text-xs font-bold text-neu-text-dark uppercase">Video Clips</span></div>
        </div>
        <ActionButton onClick={handleExport} isLoading={exporting} className="w-full max-w-md mx-auto py-6">Download Final Package</ActionButton>
      </div>
    </SectionCard>
  );
};
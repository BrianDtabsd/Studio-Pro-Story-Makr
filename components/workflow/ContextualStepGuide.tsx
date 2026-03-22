import React from 'react';
import { ActiveView } from '../../types.ts';

export interface WorkflowGuideStep {
  id: ActiveView;
  label: string;
  complete: boolean;
}

export interface WorkflowCriterion {
  label: string;
  complete: boolean;
}

interface ContextualStepGuideProps {
  activeView: ActiveView;
  steps: WorkflowGuideStep[];
  title: string;
  instructions: string[];
  criteria: WorkflowCriterion[];
}

export const ContextualStepGuide: React.FC<ContextualStepGuideProps> = ({
  activeView,
  steps,
  title,
  instructions,
  criteria,
}) => (
  <section className="neu-flat p-5 md:p-6 rounded-3xl mb-6">
    <div className="flex flex-wrap gap-2 md:gap-3 mb-4">
      {steps.map((step, index) => {
        const isActive = step.id === activeView;
        return (
          <div
            key={step.id}
            className={`px-3 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
              isActive
                ? 'neu-pressed text-accent-orange border border-accent-orange/40 animate-pulse'
                : step.complete
                  ? 'neu-pressed text-emerald-500'
                  : 'neu-flat text-neu-text'
            }`}
          >
            {index + 1}. {step.label} {step.complete ? '✓' : ''}
          </div>
        );
      })}
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="neu-pressed p-4 rounded-2xl">
        <h3 className="text-xs font-black uppercase tracking-widest text-neu-text-dark mb-3">{title}</h3>
        <ol className="space-y-2">
          {instructions.map((instruction, idx) => (
            <li key={instruction} className="text-sm text-neu-text leading-relaxed">
              <span className="font-black text-accent-orange mr-2">{idx + 1}.</span>
              {instruction}
            </li>
          ))}
        </ol>
      </div>
      <div className="neu-pressed p-4 rounded-2xl">
        <h3 className="text-xs font-black uppercase tracking-widest text-neu-text-dark mb-3">
          Completion Criteria
        </h3>
        <ul className="space-y-2">
          {criteria.map((criterion) => (
            <li key={criterion.label} className="flex items-start gap-2 text-sm text-neu-text">
              <span className={`font-black ${criterion.complete ? 'text-emerald-500' : 'text-neu-text opacity-40'}`}>
                {criterion.complete ? '✓' : '○'}
              </span>
              <span>{criterion.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  </section>
);

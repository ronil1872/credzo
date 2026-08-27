import React from 'react';
import { ExperimentMetadata } from '../types';

interface ExperimentCardProps {
  experiment: ExperimentMetadata;
  onLaunch: (id: ExperimentMetadata['id']) => void;
}

export const ExperimentCard: React.FC<ExperimentCardProps> = ({
  experiment,
  onLaunch,
}) => {
  const getStatusClass = (status: ExperimentMetadata['status']) => {
    switch (status) {
      case 'Scaffolded':
        return 'scaffolded';
      case 'In Prototyping':
        return 'in-prototyping';
      case 'Review Ready':
        return 'review-ready';
      default:
        return 'scaffolded';
    }
  };

  return (
    <div className={`experiment-card ${experiment.isPrimary ? 'experiment-card-flagship' : ''}`}>
      <div>
        <div className="experiment-card-top">
          <div className="experiment-card-icon">{experiment.icon}</div>
          <div className="experiment-card-badges">
            {experiment.isPrimary && (
              <span className="experiment-flagship-badge">★ Flagship Prototype</span>
            )}
            <span className={`experiment-status-badge ${getStatusClass(experiment.status)}`}>
              {experiment.status}
            </span>
          </div>
        </div>

        <h3 className="experiment-card-title">{experiment.title}</h3>
        <p className="experiment-card-desc">{experiment.description}</p>

        <div className="experiment-tags">
          {experiment.tags.map((tag) => (
            <span key={tag} className="experiment-tag">
              #{tag}
            </span>
          ))}
        </div>
      </div>

      <button
        type="button"
        className={`experiment-card-action ${experiment.isPrimary ? 'action-flagship' : ''}`}
        onClick={() => onLaunch(experiment.id)}
      >
        {experiment.isPrimary ? 'Open Full Homepage →' : 'Open Experiment →'}
      </button>
    </div>
  );
};

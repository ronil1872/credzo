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
      default:
        return 'scaffolded';
    }
  };

  return (
    <div className="experiment-card">
      <div>
        <div className="experiment-card-top">
          <div className="experiment-card-icon">{experiment.icon}</div>
          <span className={`experiment-status-badge ${getStatusClass(experiment.status)}`}>
            {experiment.status}
          </span>
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
        className="experiment-card-action"
        onClick={() => onLaunch(experiment.id)}
      >
        Open Experiment &rarr;
      </button>
    </div>
  );
};

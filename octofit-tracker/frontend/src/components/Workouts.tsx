import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Suggestion = { title: string; reason: string };

export default function Workouts() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getJson<{ suggestions: Suggestion[] }>('/api/workouts/suggestions/mona%40example.com')
      .then((data) => setSuggestions(data.suggestions))
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'Unable to load workout suggestions'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <CapabilityCard title="Workout suggestions" description="Recommend workouts from activity patterns." loading={loading} error={error} empty={suggestions.length === 0} emptyText="No workout suggestions yet.">
      <ul className="list-group">
        {suggestions.map((suggestion, index) => (
          <li className="list-group-item" key={index}><strong>{suggestion.title}</strong>{suggestion.reason ? ` — ${suggestion.reason}` : ''}</li>
        ))}
      </ul>
    </CapabilityCard>
  );
}

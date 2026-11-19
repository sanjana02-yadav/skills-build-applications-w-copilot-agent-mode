import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Activity = { type: string; minutes: number; points: number };

export default function Activities() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getJson<{ activities: Activity[] }>('/api/activities')
      .then((data) => setActivities(data.activities))
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'Unable to load activities'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <CapabilityCard title="Activities" description="Track student activity minutes and points." loading={loading} error={error} empty={activities.length === 0} emptyText="No activities yet.">
      <ul className="list-group">
        {activities.map((activity, index) => (
          <li className="list-group-item" key={index}>{activity.type} — {activity.minutes} minutes — {activity.points} points</li>
        ))}
      </ul>
    </CapabilityCard>
  );
}

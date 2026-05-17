import { useEffect, useState } from 'react';
import { api, ModuleProgress, TopicBreakdown } from '../lib/api';

interface DashboardData {
  grammarProgress: ModuleProgress | null;
  comprehensionProgress: ModuleProgress | null;
  grammarWeakTopics: TopicBreakdown[];
  vocabDueToday: number;
  loading: boolean;
  error: string | null;
}

export function useDashboard(): DashboardData {
  const [data, setData] = useState<DashboardData>({
    grammarProgress: null,
    comprehensionProgress: null,
    grammarWeakTopics: [],
    vocabDueToday: 0,
    loading: true,
    error: null,
  });

  useEffect(() => {
    Promise.all([
      api.grammar.progress().catch(() => null),
      api.comprehension.progress().catch(() => null),
    ]).then(([grammarRes, comprehensionRes]) => {
      const weakTopics = grammarRes?.topic_breakdown
        ?.filter(t => t.accuracy_pct < 65 && t.attempts >= 3)
        ?.sort((a, b) => a.accuracy_pct - b.accuracy_pct)
        ?.slice(0, 3) ?? [];

      setData({
        grammarProgress: grammarRes?.progress ?? null,
        comprehensionProgress: comprehensionRes?.progress ?? null,
        grammarWeakTopics: weakTopics,
        vocabDueToday: 0,
        loading: false,
        error: null,
      });
    }).catch(err => {
      setData(d => ({ ...d, loading: false, error: err.message }));
    });
  }, []);

  return data;
}

export type { DashboardData };

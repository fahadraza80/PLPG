import { buildApiError } from './apiError';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const getAuthToken = (): string | null => localStorage.getItem('plpg_access_token');

const getAuthHeaders = () => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export interface RecommendationAnalysis {
  explanation?: string;
  why_this_field?: string;
  benefits?: string[];
  current_strengths?: string[];
  skills_to_develop?: string[];
  recommended_path?: string;
  success_factors?: string[];
  time_to_competency?: string;
  career_outlook?: string;
  suspicion?: { is_suspicious?: boolean; reason?: string; score?: number };
}

export interface LearningPathPhase {
  level: string;
  duration: string;
  topics: string[];
  resources?: string[];
}

export interface LearningPathGoal {
  id?: string;
  description?: string;
  status?: string;
  dueDate?: string;
  priority?: string;
}

export interface RecommendationResponse {
  id: string;
  primaryDomain: string;
  confidence: number;
  analysis: RecommendationAnalysis;
  secondaryInterests: Array<{ domain: string; score: number; percentile?: number }>;
  learningPath: {
    domain: string;
    currentLevel: string;
    estimatedDuration: string;
    phases: LearningPathPhase[];
    nextPhase?: LearningPathPhase | null;
    goals?: LearningPathGoal[];
    progress?: number;
  };
  detailedRecommendations?: {
    learning_path?: LearningPathPhase[];
    top_resources?: Array<{ title: string; type: string; url?: string; why_recommended?: string }>;
    project_ideas?: Array<{ name: string; difficulty: string; duration?: string; description?: string }>;
    skills_required?: string[];
  };
}

export const generateRecommendation = async (interestScores: Record<string, number>) => {
  const res = await fetch(`${API_BASE_URL}/recommendations/generate`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ interest_scores: interestScores }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw buildApiError(data, res.status);
  }
  if (data?.success === false) {
    throw buildApiError({ message: data?.message || 'Failed to generate recommendation' }, res.status);
  }
  return data;
};

export const getActiveRecommendation = async (): Promise<RecommendationResponse> => {
  const res = await fetch(`${API_BASE_URL}/recommendations/active`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw buildApiError(data, res.status);
  }
  if (data?.success === false) {
    throw buildApiError({ message: data?.message || 'No active recommendation found.' }, res.status);
  }

  return data.recommendation as RecommendationResponse;
};

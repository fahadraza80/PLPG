import React, { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import { getActiveRecommendation, type RecommendationResponse } from '../../services/recommendationService';
import { getCareerPaths } from '../../services/interestService';
import type { ApiError } from '../../services/apiError';

const DOMAIN_STYLES: Record<string, { icon: string; color: string }> = {
  'AI & Machine Learning': { icon: '🤖', color: 'from-purple-500 to-indigo-600' },
  'Web Development': { icon: '🌐', color: 'from-blue-500 to-cyan-600' },
  Cybersecurity: { icon: '🔐', color: 'from-red-500 to-rose-600' },
  'Data Science': { icon: '📊', color: 'from-green-500 to-emerald-600' },
  'Mobile Development': { icon: '📱', color: 'from-orange-500 to-amber-600' },
  'Cloud Computing': { icon: '☁️', color: 'from-sky-500 to-blue-600' },
  'Game Development': { icon: '🎮', color: 'from-violet-500 to-purple-600' },
  Coding: { icon: '💻', color: 'from-slate-600 to-gray-700' },
};

type CareerPath = {
  title: string;
  industry: string;
  salary_range: string;
  growth_potential: string;
};

const LearningPath: React.FC = () => {
  const { userInterests, isAuthenticated, user } = useStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'roadmap' | 'courses' | 'projects' | 'careers'>('roadmap');
  const [recommendation, setRecommendation] = useState<RecommendationResponse | null>(null);
  const [careerPaths, setCareerPaths] = useState<CareerPath[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    loadRecommendation();
  }, [isAuthenticated]);

  const loadRecommendation = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getActiveRecommendation();
      setRecommendation(data);
      if (data?.primaryDomain) {
        const careerData = await getCareerPaths(data.primaryDomain);
        setCareerPaths(careerData.career_paths || []);
      }
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError?.message || 'Unable to load your learning path.');
    } finally {
      setLoading(false);
    }
  };

  const primaryDomain = recommendation?.primaryDomain || userInterests?.primaryInterest;
  const style = primaryDomain ? DOMAIN_STYLES[primaryDomain] : undefined;
  const phases = recommendation?.learningPath?.phases ?? recommendation?.detailedRecommendations?.learning_path ?? [];
  const courses = recommendation?.detailedRecommendations?.top_resources ?? [];
  const projects = recommendation?.detailedRecommendations?.project_ideas ?? [];

  const tags = useMemo(() => {
    const tagSet = new Set<string>();
    recommendation?.detailedRecommendations?.skills_required?.forEach((skill) => tagSet.add(skill));
    phases.forEach((phase) => phase.topics?.forEach((topic) => tagSet.add(topic)));
    return Array.from(tagSet).filter(Boolean).slice(0, 8);
  }, [recommendation, phases]);

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 pt-24 pb-12">
        <div className="max-w-5xl mx-auto px-4">
          <LoadingSkeleton variant="card" count={3} />
        </div>
      </div>
    );
  }

  if (!primaryDomain || !recommendation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 pt-24 pb-12 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-6xl mb-4">🎯</div>
          <h2 className="text-2xl font-bold text-slate-900 mb-3">No Learning Path Yet</h2>
          <p className="text-slate-600 mb-4">Complete the Interest Assessment first to get your personalized learning path.</p>
          {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
          <button
            onClick={() => navigate('/interest-check')}
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
          >
            Take Interest Assessment
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 pt-24 pb-12">
      <div className="max-w-5xl mx-auto px-4">
        {error && (
          <div className="mb-6 p-4 rounded-xl border border-red-200 bg-red-50 text-red-700">
            {error}
          </div>
        )}

        <div className={`bg-gradient-to-r ${style?.color || 'from-indigo-500 to-purple-600'} rounded-2xl p-8 mb-8 text-white`}>
          <div className="flex items-start gap-6">
            <div className="text-6xl">{style?.icon || '📚'}</div>
            <div className="flex-1">
              <p className="text-white/70 text-sm font-medium mb-1">Your Personalized Learning Path</p>
              <h1 className="text-3xl font-bold mb-2">{primaryDomain}</h1>
              <p className="text-white/80 leading-relaxed">
                Generated from your interest assessment, quiz performance, and profile context.
              </p>
              <div className="flex flex-wrap items-center gap-4 mt-4">
                <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
                  🎯 {Math.round((recommendation.confidence || 0))}% match
                </span>
                <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
                  🧭 {phases.length} phases
                </span>
                <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
                  💼 {careerPaths.length} career paths
                </span>
              </div>
            </div>
          </div>
        </div>

        {tags.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
            <h3 className="font-semibold text-slate-700 mb-3 text-sm uppercase tracking-wide">Key Focus Tags</h3>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span key={tag} className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-semibold">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {userInterests?.allInterests?.length ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
            <h3 className="font-semibold text-slate-700 mb-3 text-sm uppercase tracking-wide">Your Other Interests</h3>
            <div className="flex flex-wrap gap-2">
              {userInterests.allInterests.slice(1, 5).map((interest, i) => (
                <button
                  key={i}
                  onClick={() => navigate('/interest-check')}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-full text-sm font-medium hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                >
                  {interest.domain} — {Math.round(interest.confidence * 100)}%
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div className="flex gap-2 mb-6 bg-white rounded-xl border border-slate-200 p-1">
          {(['roadmap', 'courses', 'projects', 'careers'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold capitalize transition-all ${
                activeTab === tab ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab === 'roadmap' ? '🗺️ Roadmap' : tab === 'courses' ? '📚 Courses' : tab === 'projects' ? '🛠️ Projects' : '💼 Careers'}
            </button>
          ))}
        </div>

        {activeTab === 'roadmap' && (
          <div className="space-y-4">
            {phases.map((phase, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6 flex gap-5">
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm bg-gradient-to-br ${style?.color || 'from-indigo-500 to-purple-600'}`}>
                    {i + 1}
                  </div>
                  {i < phases.length - 1 && <div className="w-0.5 flex-1 bg-slate-200 mt-2" />}
                </div>
                <div className="flex-1 pb-2">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-slate-900 text-lg">{phase.level || `Phase ${i + 1}`}</h3>
                    <span className="text-xs text-slate-500 bg-slate-100 px-3 py-1 rounded-full">⏱ {phase.duration || 'Self-paced'}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {phase.topics?.map((topic, j) => (
                      <span key={j} className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium">
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
            <div className="text-center pt-4">
              <button onClick={() => navigate('/quizzes')} className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors">
                Start with Quizzes →
              </button>
            </div>
          </div>
        )}

        {activeTab === 'courses' && (
          <div className="grid sm:grid-cols-2 gap-4">
            {courses.map((course, i) => (
              <a
                key={i}
                href={course.url || '#'}
                target={course.url ? '_blank' : undefined}
                rel={course.url ? 'noopener noreferrer' : undefined}
                className="bg-white rounded-2xl border border-slate-200 p-6 hover:border-indigo-300 hover:shadow-md transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-xs font-bold px-2 py-1 rounded-full bg-indigo-100 text-indigo-700">
                    {course.type || 'RESOURCE'}
                  </span>
                  <svg className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </div>
                <h3 className="font-bold text-slate-900 mb-1 group-hover:text-indigo-600 transition-colors">{course.title}</h3>
                {course.why_recommended && <p className="text-sm text-slate-500">{course.why_recommended}</p>}
              </a>
            ))}
          </div>
        )}

        {activeTab === 'projects' && (
          <div className="grid sm:grid-cols-2 gap-4">
            {projects.map((project, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${style?.color || 'from-indigo-500 to-purple-600'} flex items-center justify-center text-white font-bold`}>
                  {i + 1}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{project.name}</h3>
                  <p className="text-sm text-slate-500">{project.description || project.difficulty}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'careers' && (
          <div className="grid sm:grid-cols-2 gap-4">
            {careerPaths.map((career, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${style?.color || 'from-indigo-500 to-purple-600'} flex items-center justify-center text-white text-lg`}>
                    💼
                  </div>
                  <h3 className="font-bold text-slate-900">{career.title}</h3>
                </div>
                <p className="text-sm text-slate-500">{career.industry} • {career.growth_potential}</p>
                {career.salary_range && <p className="text-xs text-slate-400 mt-1">{career.salary_range}</p>}
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 bg-white rounded-2xl border border-slate-200 p-6 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900">Ready to test your knowledge?</h3>
            <p className="text-sm text-slate-500 mt-1">Take quizzes tailored to your {primaryDomain} focus</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => navigate('/dashboard')} className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors">
              Dashboard
            </button>
            <button onClick={() => navigate('/quizzes')} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors">
              Take Quiz →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LearningPath;

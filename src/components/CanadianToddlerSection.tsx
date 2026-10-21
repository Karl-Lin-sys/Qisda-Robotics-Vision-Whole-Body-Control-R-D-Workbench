import React, { useState } from 'react';
import { TODDLER_CHAPTERS } from '../data/roboticsBenchmarkData';
import { Volume2, HelpCircle, Send, MessageSquare } from 'lucide-react';

interface CanadianToddlerSectionProps {
  onOpenVoiceWithPrompt: (prompt: string) => void;
}

export const CanadianToddlerSection: React.FC<CanadianToddlerSectionProps> = ({
  onOpenVoiceWithPrompt,
}) => {
  const [revealedIds, setRevealedIds] = useState<Record<string, boolean>>({
    'toddler-1-vision': true,
  });
  const [customQuestion, setCustomQuestion] = useState<string>('');
  const [aiResponse, setAiResponse] = useState<string>(
    "Hey there, little buddy! Ask me anything about our Qisda robot—like how its laser flashlight works, why 99 plain Timbits is a tricky game, or how we share Lego blueprints fairly in Taiwan, eh!"
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const toggleReveal = (id: string) => {
    setRevealedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAskToddlerCoach = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customQuestion.trim();
    if (!trimmed) {
      setErrorMsg('Please type a question for Buddy the Canadian Beaver first, eh!');
      return;
    }
    setErrorMsg(null);
    setIsLoading(true);
    try {
      const resp = await fetch('/api/gemini/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: trimmed,
          mode: 'toddler',
        }),
      });
      const data = await resp.json();
      if (!resp.ok || data.error) {
        throw new Error(data.error || 'Could not reach the Canadian Toddler Coach.');
      }
      setAiResponse(data.text);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Network error while asking the Canadian Toddler Coach.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section id="canadian-guide" className="py-10 border-b border-slate-200">
      <div className="mb-8">
        <div className="text-xs font-medium text-slate-500 mb-2">
          <span>Canadian English Toddler Pedagogy</span>
          <span className="mx-2" aria-hidden="true">·</span>
          <span>Zero Jargon · 100% True Robotics Math Underneath, eh!</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-3">
          04. Explain Like I’m a Toddler in Canadian English, eh!
        </h2>
        <p className="text-sm sm:text-base text-slate-600 max-w-3xl leading-relaxed">
          Every PhD-level robotics architecture, Big-O memory proof, and Taiwan legal rule translated into warm,
          crystal-clear Canadian English stories using Timbits, Zambonis, Maple Syrup, Beavers, and Toques so even a
          four-year-old in Ottawa or Vancouver can grasp the exact intuition!
        </p>
      </div>

      {/* 4 Canadian Story Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {TODDLER_CHAPTERS.map((chap) => {
          const isRevealed = Boolean(revealedIds[chap.id]);
          return (
            <div
              key={chap.id}
              className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between"
            >
              <div>
                <div className="text-xs text-slate-500 mb-1">
                  <span>Grown-Up Science: {chap.grownUpConcept}</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{chap.title}</h3>
                <div className="text-xs font-semibold text-blue-800 mb-3">
                  Analogy: {chap.canadianAnalogy}
                </div>
                <p className="text-sm text-slate-700 leading-relaxed mb-4">{chap.storyText}</p>
              </div>

              <div className="pt-4 border-t border-slate-100 space-y-3">
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                      <HelpCircle className="w-4 h-4 text-blue-700 shrink-0" />
                      <span>Toddler Pop-Quiz: {chap.interactiveQuestion}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleReveal(chap.id)}
                      className="px-2.5 py-1 text-xs font-medium bg-white border border-slate-300 rounded-md hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0"
                    >
                      {isRevealed ? 'Hide Answer' : 'Show Answer, eh!'}
                    </button>
                  </div>
                  {isRevealed && (
                    <p className="text-xs text-emerald-900 mt-2.5 pt-2.5 border-t border-slate-200 leading-relaxed">
                      <strong>Answer: </strong>
                      {chap.interactiveAnswer}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-slate-500">
                    Want to talk about this out loud?
                  </span>
                  <button
                    type="button"
                    onClick={() => onOpenVoiceWithPrompt(chap.voicePromptSuggestion)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors whitespace-nowrap shrink-0"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Ask in Gemini 3.8 Live Voice</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Custom Canadian Toddler Translator Box */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-900 mb-2">
          <MessageSquare className="w-4 h-4 text-blue-700" />
          <span>Ask Buddy the Canadian Robot Beaver Any Custom Question!</span>
        </div>
        <p className="text-xs sm:text-sm text-slate-600 mb-4">
          Type any robotics, computer vision, or Taiwan law question below and get an instant Canadian English toddler
          explanation—or click a quick-prompt button to test it out, eh!
        </p>

        <div className="flex flex-wrap gap-2 mb-4">
          {[
            'Why does the robot need EtherCAT nerves that talk 1,000 times a second, eh?',
            'How does OpenUSD help the robot practice in a video game before real winter?',
            'Why do we use Cholesky instead of flipping a matrix upside down?',
          ].map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => {
                setCustomQuestion(q);
                setErrorMsg(null);
              }}
              className="px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors text-left"
            >
              “{q}”
            </button>
          ))}
        </div>

        <form onSubmit={handleAskToddlerCoach} className="flex flex-col sm:flex-row gap-3 mb-4">
          <label htmlFor="toddler-custom-input" className="sr-only">
            Ask a robotics question for a Canadian toddler explanation
          </label>
          <input
            id="toddler-custom-input"
            type="text"
            value={customQuestion}
            onChange={(e) => {
              setCustomQuestion(e.target.value);
              if (errorMsg) setErrorMsg(null);
            }}
            placeholder="e.g., How does the robot's LiDAR laser work in a snowy hallway, eh?"
            className="flex-1 px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isLoading ? 'Thinking in Canadian, eh...' : 'Explain for a Toddler, eh!'}</span>
          </button>
        </form>

        {errorMsg && (
          <div role="alert" className="p-3 mb-4 text-xs text-rose-800 bg-rose-50 border border-rose-200 rounded-lg">
            {errorMsg}
          </div>
        )}

        <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 leading-relaxed">
          <div className="text-xs font-semibold text-slate-500 mb-1">
            Buddy’s Canadian Toddler Explanation:
          </div>
          <div className="whitespace-pre-wrap">{aiResponse}</div>
        </div>
      </div>
    </section>
  );
};

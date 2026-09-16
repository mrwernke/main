import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useSession } from "@/lib/session";
import { SAT_DOMAINS } from "@/lib/config";
import QuestionDisplay from "@/components/QuestionDisplay";
import QuestionNav from "@/components/QuestionNav";
import { isAnswerCorrect, correctAnswerLabel } from "@/lib/grading";
import { Button } from "@/components/ui/button";
import { ListChecks, ArrowRight, RotateCcw, CheckCircle2, XCircle, Loader2 } from "lucide-react";

const DIFFICULTY_STYLES = {
  Easy: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Medium: "bg-amber-50 text-amber-700 border-amber-200",
  Hard: "bg-rose-50 text-rose-700 border-rose-200",
};

export default function PracticeQuestions() {
  const { user } = useSession();
  const [topic, setTopic] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [checked, setChecked] = useState([]);
  const [loading, setLoading] = useState(false);
  const [current, setCurrent] = useState(0);
  const [stats, setStats] = useState({ correct: 0, total: 0 });
  const [finished, setFinished] = useState(false);

  const selected = answers[current] ?? null;
  const revealed = checked[current];

  const startDrill = async (chosenTopic) => {
    setTopic(chosenTopic);
    setLoading(true);
    setFinished(false);
    setCurrent(0);
    setStats({ correct: 0, total: 0 });
    const filter = { usage: "practice" };
    if (chosenTopic !== "all") filter.topic = chosenTopic;
    const qs = await base44.entities.Question.filter(filter);
    const diffRank = { Easy: 1, Medium: 2, Hard: 3 };
    qs.sort((a, b) => {
      const t = (a.topic || "").localeCompare(b.topic || "");
      if (t !== 0) return t;
      return (diffRank[a.difficulty] ?? 99) - (diffRank[b.difficulty] ?? 99);
    });

    // Restore previously saved attempts so progress persists across logins
    const savedAnswers = new Array(qs.length).fill(null);
    const savedChecked = new Array(qs.length).fill(false);
    let savedCorrect = 0;
    let savedTotal = 0;
    try {
      const attempts = await base44.entities.PracticeAttempt.filter({ student_id: user.id }, "-created_date", 500);
      const byQuestion = {};
      attempts.forEach((a) => {
        if (!a.question_id) return;
        if (!byQuestion[a.question_id] || new Date(a.created_date) > new Date(byQuestion[a.question_id].created_date)) {
          byQuestion[a.question_id] = a;
        }
      });
      qs.forEach((q, i) => {
        const a = byQuestion[q.id];
        if (a) {
          savedAnswers[i] = a.selected_answer;
          savedChecked[i] = true;
          savedTotal += 1;
          if (a.correct) savedCorrect += 1;
        }
      });
    } catch {
      /* ignore */
    }
    setQuestions(qs);
    setAnswers(savedAnswers);
    setChecked(savedChecked);
    setStats({ correct: savedCorrect, total: savedTotal });
    setLoading(false);
  };

  const selectAnswer = (ans) => {
    if (checked[current]) return;
    setAnswers((prev) => {
      const next = [...prev];
      next[current] = ans;
      return next;
    });
  };

  const goTo = (i) => setCurrent(i);

  const reveal = async () => {
    const ans = answers[current];
    if (!ans || checked[current]) return;
    const q = questions[current];
    const correct = isAnswerCorrect(q, ans);
    setChecked((prev) => {
      const next = [...prev];
      next[current] = true;
      return next;
    });
    setStats((s) => ({ correct: s.correct + (correct ? 1 : 0), total: s.total + 1 }));
    try {
      await base44.entities.PracticeAttempt.create({
        student_id: user.id,
        student_name: `${user.first_name} ${user.last_name}`,
        question_id: q.id,
        topic: q.topic,
        difficulty: q.difficulty,
        selected_answer: ans,
        correct,
      });
    } catch {
      /* ignore */
    }
  };

  const next = () => {
    if (current < questions.length - 1) setCurrent((c) => c + 1);
    else setFinished(true);
  };

  const reset = () => {
    setTopic(null);
    setQuestions([]);
    setAnswers([]);
    setChecked([]);
    setFinished(false);
    setStats({ correct: 0, total: 0 });
    setCurrent(0);
  };

  // Selection screen
  if (!topic) {
    return (
      <div className="p-6 md:p-10 max-w-2xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-[#1E2A4A] mb-1">Practice Questions</h2>
          <p className="text-gray-500">Choose a topic to start drilling.</p>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => startDrill("all")}
            className="w-full text-left px-4 py-3 rounded-lg border-2 border-[#1E2A4A] bg-[#1E2A4A] text-white font-semibold transition-colors hover:bg-[#28365e]"
          >
            All Topics
          </button>
          {SAT_DOMAINS.map((d) => (
            <div key={d.name} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
              <p className="text-sm font-bold text-[#1E2A4A] mb-2.5">{d.name}</p>
              <div className="grid sm:grid-cols-2 gap-2">
                {d.topics.map((t) => (
                  <button
                    key={t}
                    onClick={() => startDrill(t)}
                    className="text-left px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-700 transition-colors hover:border-[#1E2A4A] hover:bg-blue-50/50"
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="p-10 text-center text-gray-400 flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading questions ...</div>;
  }

  if (questions.length === 0) {
    return (
      <div className="p-6 md:p-10 max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
          <ListChecks className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <h3 className="font-semibold text-[#1E2A4A] mb-1">No questions available</h3>
          <p className="text-sm text-gray-500 mb-5">
            There are no practice questions for {topic === "all" ? "any topic" : topic} yet.
          </p>
          <Button variant="outline" onClick={reset}>Choose another topic</Button>
        </div>
      </div>
    );
  }

  if (finished) {
    const pct = Math.round((stats.correct / stats.total) * 100);
    return (
      <div className="p-6 md:p-10 max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-7 h-7 text-emerald-500" />
          </div>
          <h3 className="text-xl font-bold text-[#1E2A4A] mb-1">Drill Complete!</h3>
          <p className="text-gray-500 mb-4">
            {stats.correct} of {stats.total} correct ({pct}%)
          </p>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden max-w-xs mx-auto mb-6">
            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
          </div>
          <Button onClick={reset} className="w-full">
            <RotateCcw className="w-4 h-4 mr-1" /> Practice Another Topic
          </Button>
        </div>
      </div>
    );
  }

  const q = questions[current];

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[#1E2A4A]">{topic === "all" ? "All Topics" : topic}</span>
          {q.difficulty && (
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${DIFFICULTY_STYLES[q.difficulty] || "bg-gray-50 text-gray-600 border-gray-200"}`}>
              {q.difficulty}
            </span>
          )}
        </div>
        <div className="text-sm text-gray-400">
          {current + 1} of {questions.length} - {stats.correct}/{stats.total} correct
        </div>
      </div>

      <QuestionNav
        questions={questions}
        current={current}
        checked={checked}
        answers={answers}
        onJump={goTo}
      />

      <button onClick={reset} className="mb-3 text-sm text-gray-400 hover:text-gray-600">
        &larr; Back to topic selection
      </button>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <QuestionDisplay
          question={q}
          selectedAnswer={selected}
          onSelect={selectAnswer}
          showResult={revealed}
        />
      </div>

      <div className="flex items-center justify-between mt-4">
        {!revealed ? (
          <Button onClick={reveal} disabled={!selected} className="w-full">
            Check Answer
          </Button>
        ) : (
          <Button onClick={next} className="w-full">
            {current < questions.length - 1 ? "Next Question" : "Finish"} <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        )}
      </div>

      {revealed && (
        <div
          className={`mt-3 flex items-center gap-2 text-sm font-medium ${
            isAnswerCorrect(q, selected) ? "text-emerald-600" : "text-red-600"
          }`}
        >
          {isAnswerCorrect(q, selected) ? (
            <><CheckCircle2 className="w-4 h-4" /> Correct!</>
          ) : (
            <><XCircle className="w-4 h-4" /> Not quite &mdash; the correct answer is {correctAnswerLabel(q)}.</>
          )}
        </div>
      )}

    </div>
  );
}

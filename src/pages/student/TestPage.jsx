import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useSession } from "@/lib/session";
import { TEST_LABELS } from "@/lib/config";
import QuestionDisplay from "@/components/QuestionDisplay";
import { isAnswerCorrect } from "@/lib/grading";
import { Button } from "@/components/ui/button";
import { Lock, Clock, ArrowLeft, ArrowRight, CheckCircle2, XCircle, Loader2, Trophy } from "lucide-react";

export default function TestPage() {
  const { testNumber } = useParams();
  const tn = parseInt(testNumber, 10);
  const { user, refreshStudent } = useSession();
  const [student, setStudent] = useState(user);
  const [questions, setQuestions] = useState([]);
  const [result, setResult] = useState(null);
  const [phase, setPhase] = useState("loading"); // loading | locked | intro | taking | submitting | results
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [review, setReview] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    (async () => {
      const fresh = await refreshStudent();
      setStudent(fresh);
      const unlockedKey = `test${tn}_unlocked`;
      const unlocked = fresh[unlockedKey];
      const qs = await base44.entities.Question.filter({ usage: `test_${tn}` }, undefined, 200);
      setQuestions(qs);
      const existing = await base44.entities.TestResult.filter(
        { student_id: user.id, test_number: tn },
        "-created_date",
        1
      );
      if (existing.length) {
        setResult(existing[0]);
        setPhase("results");
      } else if (!unlocked) {
        setPhase("locked");
      } else if (qs.length === 0) {
        setPhase("noquestions");
      } else {
        setPhase("intro");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tn]);

  useEffect(() => {
    if (phase !== "taking") return;
    if (timeLeft <= 0) {
      submitTest();
      return;
    }
    timerRef.current = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, timeLeft]);

  const startTest = () => {
    setAnswers({});
    setCurrent(0);
    setTimeLeft(questions.length * 90);
    setPhase("taking");
  };

  const submitTest = async () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setPhase("submitting");
    let correct = 0;
    const topicBreakdown = {};
    const answerLog = [];
    questions.forEach((q) => {
      const sel = answers[q.id];
      const isCorrect = isAnswerCorrect(q, sel);
      if (isCorrect) correct++;
      const topic = q.topic || "Uncategorized";
      if (!topicBreakdown[topic]) topicBreakdown[topic] = { correct: 0, total: 0 };
      topicBreakdown[topic].total++;
      if (isCorrect) topicBreakdown[topic].correct++;
      answerLog.push({ question_id: q.id, selected: sel, correct: isCorrect, topic });
    });
    const score = Math.round(200 + (correct / questions.length) * 600);
    const res = await base44.entities.TestResult.create({
      student_id: user.id,
      student_name: `${user.first_name} ${user.last_name}`,
      test_number: tn,
      score,
      total_questions: questions.length,
      correct_count: correct,
      topic_breakdown: topicBreakdown,
      answers: answerLog,
    });
    setResult(res);
    setPhase("results");
  };

  const fmtTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const q = questions[current];

  if (phase === "loading") {
    return <div className="p-10 text-center text-gray-400">Loadingâ€¦</div>;
  }

  if (phase === "locked") {
    return (
      <div className="p-6 md:p-10 max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 text-center">
          <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-7 h-7 text-gray-400" />
          </div>
          <h2 className="text-xl font-bold text-[#1E2A4A] mb-2">{TEST_LABELS[tn]}</h2>
          <p className="text-gray-500 mb-1">This test is currently locked.</p>
          <p className="text-sm text-gray-400">
            Your tutor will unlock it when you're ready. Check back soon!
          </p>
        </div>
      </div>
    );
  }

  if (phase === "noquestions") {
    return (
      <div className="p-6 md:p-10 max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 text-center">
          <h2 className="text-xl font-bold text-[#1E2A4A] mb-2">{TEST_LABELS[tn]}</h2>
          <p className="text-gray-500">Questions for this test haven't been uploaded yet.</p>
        </div>
      </div>
    );
  }

  if (phase === "results" && result) {
    return (
      <div className="p-6 md:p-10 max-w-3xl mx-auto">
        <div className="bg-gradient-to-br from-[#1E2A4A] to-[#2A3A5E] rounded-2xl p-8 text-white text-center mb-6 shadow-lg">
          <Trophy className="w-10 h-10 mx-auto mb-2 text-amber-300" />
          <p className="text-white/70 text-sm uppercase tracking-wide mb-1">Your Predicted Score</p>
          <p className="text-5xl font-bold">{result.score}</p>
          <p className="text-white/60 text-sm">out of 800</p>
          <p className="text-white/80 mt-3 text-sm">
            {result.correct_count} of {result.total_questions} correct
          </p>
        </div>

        <h3 className="font-bold text-[#1E2A4A] mb-3">Results by Topic</h3>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-3 mb-6">
          {Object.entries(result.topic_breakdown || {}).map(([topic, data]) => {
            const pct = data.total ? Math.round((data.correct / data.total) * 100) : 0;
            return (
              <div key={topic}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">{topic}</span>
                  <span className="text-gray-400">
                    {data.correct}/{data.total} ({pct}%)
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      pct >= 70 ? "bg-emerald-500" : pct >= 40 ? "bg-amber-500" : "bg-red-400"
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-2 justify-center mb-6">
          <Button variant={review ? "outline" : "default"} onClick={() => setReview((r) => !r)}>
            {review ? "Hide Answer Review" : "Review Answers"}
          </Button>
          <Link to="/dashboard">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </div>

        {review && (
          <div className="space-y-4">
            <h3 className="font-bold text-[#1E2A4A] mb-1">Answer Review</h3>
            {questions.map((qq, i) => {
              const entry = (result.answers || []).find((a) => a.question_id === qq.id);
              return (
                <div key={qq.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-gray-400 uppercase">Question {i + 1}</span>
                    {entry?.correct ? (
                      <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Correct
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-red-500 flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" /> Incorrect
                      </span>
                    )}
                  </div>
                  <QuestionDisplay
                    question={qq}
                    selectedAnswer={entry?.selected}
                    showResult
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  if (phase === "intro") {
    return (
      <div className="p-6 md:p-10 max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          <h2 className="text-2xl font-bold text-[#1E2A4A] mb-2">{TEST_LABELS[tn]}</h2>
          <p className="text-gray-500 mb-5">
            You'll have {fmtTime(questions.length * 90)} to answer {questions.length} questions.
            Once you start, the timer cannot be paused.
          </p>
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-5 text-sm text-gray-600">
            <p className="font-semibold text-[#1E2A4A] mb-1">Instructions</p>
            <ul className="list-disc list-inside space-y-1 text-gray-600">
              <li>Read each question carefully and select the best answer.</li>
              <li>You can navigate between questions using the grid.</li>
              <li>Your score is calculated when you submit the test.</li>
            </ul>
          </div>
          <Button onClick={startTest} className="w-full">
            Start Test
          </Button>
        </div>
      </div>
    );
  }

  // Taking phase
  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm font-semibold text-[#1E2A4A]">{TEST_LABELS[tn]}</div>
        <div
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-sm font-bold ${
            timeLeft < 60 ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"
          }`}
        >
          <Clock className="w-4 h-4" />
          {fmtTime(timeLeft)}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <p className="text-sm text-gray-400 mb-4">
          Question {current + 1} of {questions.length}
        </p>
        <QuestionDisplay
          question={q}
          selectedAnswer={answers[q.id]}
          onSelect={(key) => setAnswers((a) => ({ ...a, [q.id]: key }))}
        />
      </div>

      <div className="flex items-center justify-between mt-4">
        <Button
          variant="outline"
          onClick={() => setCurrent((c) => Math.max(0, c - 1))}
          disabled={current === 0}
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Previous
        </Button>
        {current < questions.length - 1 ? (
          <Button onClick={() => setCurrent((c) => c + 1)}>
            Next <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        ) : (
          <Button onClick={submitTest} disabled={phase === "submitting"}>
            {phase === "submitting" ? (
              <Loader2 className="w-4 h-4 animate-spin mr-1" />
            ) : (
              <CheckCircle2 className="w-4 h-4 mr-1" />
            )}
            Submit Test
          </Button>
        )}
      </div>

      <div className="mt-5">
        <div className="flex flex-wrap gap-1.5">
          {questions.map((qq, i) => (
            <button
              key={qq.id}
              onClick={() => setCurrent(i)}
              className={`w-8 h-8 rounded-lg text-xs font-semibold border transition-colors ${
                i === current
                  ? "bg-[#1E2A4A] text-white border-[#1E2A4A]"
                  : answers[qq.id]
                  ? "bg-blue-50 text-[#1E2A4A] border-blue-200"
                  : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

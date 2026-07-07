import { Check, X } from "lucide-react";
import { isAnswerCorrect } from "@/lib/grading";

// Difficulty color theme: background tint, border, text
const DIFFICULTY_THEME = {
  Easy: { bg: "bg-emerald-50", border: "border-emerald-300", text: "text-emerald-700", dot: "bg-emerald-400" },
  Medium: { bg: "bg-amber-50", border: "border-amber-300", text: "text-amber-700", dot: "bg-amber-400" },
  Hard: { bg: "bg-rose-50", border: "border-rose-300", text: "text-rose-700", dot: "bg-rose-400" },
};

export default function QuestionNav({ questions, current, checked, answers, onJump }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-3 mb-4 overflow-x-auto">
      <div className="flex gap-2 min-w-max">
        {questions.map((q, i) => {
          const isCurrent = i === current;
          const isDone = checked[i];
          const correct = isDone && isAnswerCorrect(q, answers[i]);
          const theme = DIFFICULTY_THEME[q.difficulty] || {
            bg: "bg-gray-50",
            border: "border-gray-300",
            text: "text-gray-700",
            dot: "bg-gray-300",
          };
          return (
            <button
              key={q.id || i}
              onClick={() => onJump(i)}
              className={`relative w-12 h-12 rounded-lg border-2 font-semibold text-sm transition-all flex flex-col items-center justify-center ${theme.bg} ${theme.border} ${theme.text} ${
                isCurrent ? "ring-2 ring-offset-1 ring-[#1E2A4A] scale-105" : "hover:brightness-95"
              }`}
              title={`Question ${i + 1}${q.difficulty ? " Â· " + q.difficulty : ""}`}
            >
              <span className="leading-none">{i + 1}</span>
              {isDone && (
                <span
                  className={`absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow ${
                    correct ? "bg-emerald-500" : "bg-rose-500"
                  } text-white`}
                >
                  {correct ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-emerald-400" /> Easy</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-amber-400" /> Medium</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-rose-400" /> Hard</span>
      </div>
    </div>
  );
}

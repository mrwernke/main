import { CheckCircle2, XCircle } from "lucide-react";
import LatexText from "@/components/LatexText";
import { isAnswerCorrect } from "@/lib/grading";

export default function QuestionDisplay({ question, selectedAnswer, onSelect, showResult }) {
  const choices = [
    { key: "A", text: question.choice_a },
    { key: "B", text: question.choice_b },
    { key: "C", text: question.choice_c },
    { key: "D", text: question.choice_d },
  ].filter((c) => c.text);

  return (
    <div>
      <LatexText className="text-base text-gray-800 mb-5 leading-relaxed prose prose-sm max-w-none" >
        {question.question_text}
      </LatexText>
      {question.image_url && (
        <img src={question.image_url} alt="Question" className="max-h-72 rounded-lg border border-gray-200 mb-5" />
      )}
      {question.question_type === "grid_in" ? (
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-2">Enter your answer</label>
          <input
            type="text"
            inputMode="decimal"
            value={selectedAnswer ?? ""}
            disabled={showResult}
            onChange={(e) => onSelect?.(e.target.value)}
            placeholder="e.g. 12, 0.5, 7/2"
            className={`w-48 px-3 py-2.5 rounded-lg border-2 text-center text-lg font-bold outline-none transition-colors ${
              showResult && isAnswerCorrect(question, selectedAnswer)
                ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                : showResult
                ? "border-red-400 bg-red-50 text-red-700"
                : "border-gray-200 focus:border-[#1E2A4A]"
            }`}
          />
          {showResult && (
            <p className="mt-2 text-sm text-gray-600">
              Correct answer:{" "}
              <span className="font-semibold text-emerald-600">{question.numeric_answer}</span>
            </p>
          )}
        </div>
      ) : (
      <div className="space-y-2.5">
        {choices.map((c) => {
          const isSelected = selectedAnswer === c.key;
          const isCorrect = question.correct_answer === c.key;
          let style = "border-gray-200 hover:border-[#1E2A4A] hover:bg-blue-50/40";
          if (showResult) {
            if (isCorrect) style = "border-emerald-400 bg-emerald-50";
            else if (isSelected) style = "border-red-400 bg-red-50";
            else style = "border-gray-200 opacity-60";
          } else if (isSelected) {
            style = "border-[#1E2A4A] bg-blue-50";
          }
          return (
            <button
              key={c.key}
              disabled={showResult}
              onClick={() => onSelect?.(c.key)}
              className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-colors flex items-start gap-3 ${style}`}
            >
              <span className="font-bold text-[#1E2A4A] shrink-0">{c.key}.</span>
              <LatexText className="text-gray-700 prose prose-sm max-w-none flex-1">{c.text}</LatexText>
              {showResult && isCorrect && (
                <CheckCircle2 className="w-5 h-5 text-emerald-500 ml-auto shrink-0" />
              )}
              {showResult && isSelected && !isCorrect && (
                <XCircle className="w-5 h-5 text-red-500 ml-auto shrink-0" />
              )}
            </button>
          );
        })}
      </div>
      )}
      {showResult && question.explanation && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Explanation</p>
          <LatexText className="text-sm text-gray-700 prose prose-sm max-w-none">{question.explanation}</LatexText>
        </div>
      )}
    </div>
  );
}
import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { SAT_DOMAINS, SAT_TOPICS, DIFFICULTIES, QUESTION_USAGES } from "@/lib/config";
import LatexText from "@/components/LatexText";
import { Image as ImageIcon, Loader2, X } from "lucide-react";

const normalizeDifficulty = (difficulty) => (difficulty === "Challenge" ? "Hard" : difficulty);

function MathPreview({ value }) {
  if (!value?.trim()) return null;
  return (
    <div className="mt-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
      <p className="mb-1 text-[11px] font-semibold uppercase text-gray-400">Math Preview</p>
      <LatexText className="prose prose-sm max-w-none text-sm text-gray-700">{value}</LatexText>
    </div>
  );
}

export default function QuestionForm({ initial, onSubmit, onCancel, hideDifficulty, showUsage = false }) {
  const [f, setF] = useState({
    question_text: "",
    question_type: "multiple_choice",
    numeric_answer: "",
    choice_a: "",
    choice_b: "",
    choice_c: "",
    choice_d: "",
    correct_answer: "A",
    topic: SAT_TOPICS[0],
    difficulty: DIFFICULTIES[0],
    usage: "practice",
    explanation: "",
    points: 1,
    image_url: "",
    ...initial,
    difficulty: normalizeDifficulty(initial?.difficulty) || DIFFICULTIES[0],
    usage: initial?.usage || "practice",
  });
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));

  const uploadFile = async (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    setUploading(true);
    setUploadError("");
    try {
      const payload = file instanceof File ? file : { file };
      const { file_url } = await base44.integrations.Core.UploadFile(payload);
      if (!file_url) {
        setUploadError("Image upload was not available. Please try again.");
        return;
      }
      set("image_url", file_url);
    } catch {
      setUploadError("Image upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) {
          e.preventDefault();
          uploadFile(file);
          return;
        }
      }
    }
  };

  const inputCls = "w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#1E2A4A] outline-none text-sm";
  const labelCls = "text-sm font-medium text-gray-700 block mb-1";

  return (
    <div
      className="space-y-4"
      onPaste={handlePaste}
      onDrop={(e) => {
        const file = e.dataTransfer?.files?.[0];
        if (file) {
          e.preventDefault();
          uploadFile(file);
        }
      }}
      onDragOver={(e) => e.preventDefault()}
    >
      <div>
        <label className={labelCls}>Question Text</label>
        <textarea
          value={f.question_text}
          onChange={(e) => set("question_text", e.target.value)}
          rows={3}
          className={inputCls}
        />
        <MathPreview value={f.question_text} />
      </div>
      <div>
        <label className={labelCls}>Question Image (optional)</label>
        {f.image_url ? (
          <div className="relative inline-block">
            <img src={f.image_url} alt="Question" className="max-h-48 rounded-lg border border-gray-200" />
            <button
              type="button"
              onClick={() => set("image_url", "")}
              className="absolute -top-2 -right-2 bg-white border border-gray-200 rounded-full p-1 shadow-sm hover:bg-gray-50"
            >
              <X className="w-3.5 h-3.5 text-gray-600" />
            </button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center gap-1 px-4 py-6 rounded-lg border-2 border-dashed border-gray-200 hover:border-[#1E2A4A] cursor-pointer text-center">
            {uploading ? (
              <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
            ) : (
              <ImageIcon className="w-5 h-5 text-gray-400" />
            )}
            <span className="text-xs text-gray-500">
  {uploading ? "Uploading..." : "Paste screenshot (Ctrl+V), drag image here, or click to upload"}
</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0])}
            />
          </label>
        )}
        {uploadError ? <p className="mt-2 text-xs text-red-500">{uploadError}</p> : null}
      </div>
      <div>
        <label className={labelCls}>Question Type</label>
        <select
          value={f.question_type || "multiple_choice"}
          onChange={(e) => set("question_type", e.target.value)}
          className={`${inputCls} bg-white`}
        >
          <option value="multiple_choice">Multiple Choice</option>
          <option value="grid_in">Grid-In (Numeric)</option>
        </select>
      </div>
      {(f.question_type || "multiple_choice") === "grid_in" ? (
        <div>
          <label className={labelCls}>Correct Numeric Answer</label>
          <input
            value={f.numeric_answer}
            onChange={(e) => set("numeric_answer", e.target.value)}
            placeholder="e.g. 12, 0.5, 7/2"
            className={inputCls}
          />
        </div>
      ) : (
        <>
          {["a", "b", "c", "d"].map((c) => (
            <div key={c}>
              <label className={labelCls}>Choice {c.toUpperCase()}</label>
              <input
                value={f[`choice_${c}`]}
                onChange={(e) => set(`choice_${c}`, e.target.value)}
                className={inputCls}
              />
              <MathPreview value={f[`choice_${c}`]} />
            </div>
          ))}
          <div>
            <label className={labelCls}>Correct Answer</label>
            <select
              value={f.correct_answer}
              onChange={(e) => set("correct_answer", e.target.value)}
              className={`${inputCls} bg-white`}
            >
              {["A", "B", "C", "D"].map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>
        </>
      )}
      {showUsage && (
        <div>
          <label className={labelCls}>Used In</label>
          <select
            value={f.usage || "practice"}
            onChange={(e) => set("usage", e.target.value)}
            className={`${inputCls} bg-white`}
          >
            {QUESTION_USAGES.map((usage) => (
              <option key={usage.value} value={usage.value}>
                {usage.label}
              </option>
            ))}
          </select>
        </div>
      )}
      <div>
        <label className={labelCls}>Topic</label>
        <select
          value={f.topic}
          onChange={(e) => set("topic", e.target.value)}
          className={`${inputCls} bg-white`}
        >
          {SAT_DOMAINS.map((d) => (
            <optgroup key={d.name} label={d.name}>
              {d.topics.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {!hideDifficulty && (
          <div>
            <label className={labelCls}>Difficulty</label>
            <select
              value={f.difficulty}
              onChange={(e) => set("difficulty", e.target.value)}
              className={`${inputCls} bg-white`}
            >
              {DIFFICULTIES.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label className={labelCls}>Points</label>
          <input
            type="number"
            value={f.points}
            onChange={(e) => set("points", Number(e.target.value))}
            className={inputCls}
          />
        </div>
      </div>
      <div>
        <label className={labelCls}>Explanation</label>
        <textarea
          value={f.explanation}
          onChange={(e) => set("explanation", e.target.value)}
          rows={2}
          className={inputCls}
        />
        <MathPreview value={f.explanation} />
      </div>
      <div className="flex gap-2 justify-end pt-2">
        <Button 
  onClick={() => {
    const cleanStr = (str) => typeof str === "string" 
      ? str.replace(/[\u00A0\u00C2]/g, " ").replace(/—/g, "&mdash;").replace(/–/g, "&ndash;") 
      : str;

    const sanitizedForm = {
      ...f,
      question_text: cleanStr(f.question_text),
      explanation: cleanStr(f.explanation),
      choice_a: cleanStr(f.choice_a),
      choice_b: cleanStr(f.choice_b),
      choice_c: cleanStr(f.choice_c),
      choice_d: cleanStr(f.choice_d),
    };
    onSubmit(sanitizedForm);
  }}
>
  Save Question
</Button>
      </div>
    </div>
  );
}


import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { QUESTION_USAGES, SAT_DOMAINS } from "@/lib/config";
import Modal from "@/components/Modal";
import QuestionForm from "@/components/QuestionForm";
import LatexText from "@/components/LatexText";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Loader2, Image as ImageIcon } from "lucide-react";

const usageLabel = (value) => QUESTION_USAGES.find((usage) => usage.value === value)?.label || "Practice Questions";

export default function PracticeQuestionsAdmin() {
  const [topic, setTopic] = useState("all");
  const [usage, setUsage] = useState("all");
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState("");
  const [modal, setModal] = useState(null);
  const importInputRef = useRef(null);

  const defaultQuestionData = () => ({
    usage: usage === "all" ? "practice" : usage,
    topic: topic === "all" ? undefined : topic,
  });

  const fetchQs = async () => {
    setLoading(true);
    const qs = await base44.entities.Question.list(undefined, 1000);
    setQuestions(qs.map((q) => ({ ...q, difficulty: q.difficulty === "Challenge" ? "Hard" : q.difficulty })));
    setLoading(false);
  };

  useEffect(() => {
    fetchQs();
  }, []);

  const filtered = questions.filter((q) => {
    const matchesTopic = topic === "all" || q.topic === topic;
    
    // Normalize empty or missing fields to "practice", but match explicitly chosen strings directly
    const currentUsage = q.usage || "practice";
    const matchesUsage = usage === "all" || currentUsage === usage;
    
    return matchesTopic && matchesUsage;
  });

  const save = async (f) => {
    const payload = { ...f, difficulty: f.difficulty === "Challenge" ? "Hard" : f.difficulty, usage: f.usage || "practice" };
    if (modal.mode === "add" || modal.mode === "import") {
      await base44.entities.Question.create(payload);
    } else {
      await base44.entities.Question.update(modal.data.id, payload);
    }
    setModal(null);
    fetchQs();
  };

  const remove = async (q) => {
    if (!confirm("Delete this question?")) return;
    await base44.entities.Question.delete(q.id);
    fetchQs();
  };

  const importImage = async (file) => {
    if (!file || !file.type?.startsWith("image/")) return;
    setImporting(true);
    setImportError("");
    try {
      const payload = file instanceof File ? file : { file };
      const { file_url } = await base44.integrations.Core.UploadFile(payload);
      if (!file_url) {
        setImportError("Image import failed.");
        return;
      }
      setModal({
        mode: "import",
        data: {
          ...defaultQuestionData(),
          image_url: file_url,
        },
      });
    } catch {
      setImportError("Image import failed.");
    } finally {
      setImporting(false);
      if (importInputRef.current) importInputRef.current.value = "";
    }
  };

  const handlePaste = (e) => {
    if (modal) return;
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) {
          e.preventDefault();
          importImage(file);
          return;
        }
      }
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto" onPaste={handlePaste}>
      <div className="mb-5">
        <h2 className="text-2xl font-bold text-[#1E2A4A] mb-1">Question Database</h2>
        <p className="text-gray-500 text-sm">Manage the master question list and choose where each question is used.</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-5 space-y-4">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Used In</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setUsage("all")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                usage === "all" ? "bg-[#1E2A4A] text-white" : "bg-white border border-gray-200 text-gray-600"
              }`}
            >
              All Locations
            </button>
            {QUESTION_USAGES.map((u) => (
              <button
                key={u.value}
                onClick={() => setUsage(u.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  usage === u.value ? "bg-[#1E2A4A] text-white" : "bg-white border border-gray-200 text-gray-600"
                }`}
              >
                {u.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2.5">
          <button
            onClick={() => setTopic("all")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              topic === "all" ? "bg-[#1E2A4A] text-white" : "bg-white border border-gray-200 text-gray-600"
            }`}
          >
            All Topics
          </button>
          {SAT_DOMAINS.map((d) => (
            <div key={d.name}>
              <p className="text-xs font-semibold text-gray-400 uppercase mb-1.5">{d.name}</p>
              <div className="flex flex-wrap gap-2">
                {d.topics.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTopic(t)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      topic === t ? "bg-[#1E2A4A] text-white" : "bg-white border border-gray-200 text-gray-600"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <p className="text-sm text-gray-500">{filtered.length} questions</p>
          {importError ? <p className="text-xs text-red-500 mt-1">{importError}</p> : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            ref={importInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && importImage(e.target.files[0])}
          />
          <Button variant="outline" onClick={() => importInputRef.current?.click()} disabled={importing}>
            {importing ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <ImageIcon className="w-4 h-4 mr-1" />}
            Import Image
          </Button>
          <Button onClick={() => setModal({ mode: "add", data: defaultQuestionData() })}>
            <Plus className="w-4 h-4 mr-1" /> Add Question
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-gray-300" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-10 text-center text-gray-400 text-sm">
          No questions match these filters.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((q, i) => (
            <div key={q.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="text-xs text-gray-400 mb-1 flex items-center gap-1.5">
  <span>{i + 1}</span>
  <span className="text-gray-300">|</span>
  <span>{usageLabel(q.usage)}</span>
  <span className="text-gray-300">|</span>
  <span>{q.topic}</span>
  <span className="text-gray-300">|</span>
  <span className="font-medium text-gray-500">{q.difficulty}</span>
</p>
                  <LatexText className="text-sm text-gray-800 prose prose-sm max-w-none">{q.question_text}</LatexText>
                  {q.image_url ? (
                    <img src={q.image_url} alt="" className="mt-3 max-h-32 rounded-lg border border-gray-200" />
                  ) : null}
                  <p className="text-xs text-emerald-600 mt-2">
                    Correct: {q.question_type === "grid_in" ? q.numeric_answer || q.correct_answer : q.correct_answer}
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => setModal({ mode: "edit", data: q })} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-[#1E2A4A]">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => remove(q)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal?.mode === "import" ? "Import Question Image" : modal?.mode === "add" ? "Add Question" : "Edit Question"}
        maxWidth="max-w-lg"
      >
        {modal && (
          <QuestionForm initial={modal.data} onSubmit={save} onCancel={() => setModal(null)} showUsage />
        )}
      </Modal>
    </div>
  );
}


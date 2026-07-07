import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { TEST_LABELS } from "@/lib/config";
import Modal from "@/components/Modal";
import QuestionForm from "@/components/QuestionForm";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Loader2, Database } from "lucide-react";

export default function PracticeTestsAdmin() {
  const { testNumber } = useParams();
  const testNum = Number(testNumber) || 1;
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);

  const fetchQs = async () => {
    setLoading(true);
    const qs = await base44.entities.Question.filter({ usage: `test_${testNum}` }, undefined, 500);
    setQuestions(qs.map((q) => ({ ...q, difficulty: q.difficulty === "Challenge" ? "Hard" : q.difficulty })));
    setLoading(false);
  };

  useEffect(() => {
    fetchQs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testNum]);

  const save = async (f) => {
    await base44.entities.Question.update(modal.data.id, { ...f, usage: `test_${testNum}` });
    setModal(null);
    fetchQs();
  };

  const remove = async (q) => {
    if (!confirm("Remove this question from the database?")) return;
    await base44.entities.Question.delete(q.id);
    fetchQs();
  };

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto">
      <div className="mb-5">
        <h2 className="text-2xl font-bold text-[#1E2A4A] mb-1">{TEST_LABELS[testNum]}</h2>
        <p className="text-gray-500 text-sm">Review questions assigned to this test. Add or move questions from the Question Database.</p>
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        {[1, 2, 3].map((n) => (
          <Link
            key={n}
            to={`/admin/tests/${n}`}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              testNum === n ? "bg-[#1E2A4A] text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-gray-300"
            }`}
          >
            {TEST_LABELS[n]}
          </Link>
        ))}
        <Link to="/admin/questions" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-white border border-gray-200 text-gray-600 hover:border-gray-300">
          <Database className="w-4 h-4" /> Question Database
        </Link>
      </div>

      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">{questions.length} questions</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-gray-300" /></div>
      ) : questions.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-10 text-center text-gray-400 text-sm">
          No questions are assigned to {TEST_LABELS[testNum]} yet.
        </div>
      ) : (
        <div className="space-y-3">
          {questions.map((q, i) => (
            <div key={q.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="text-xs text-gray-400 mb-1">Q{i + 1} - {q.topic} - {q.difficulty || "-"}</p>
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">{q.question_text}</p>
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
        title="Edit Question"
        maxWidth="max-w-lg"
      >
        {modal && (
          <QuestionForm
            initial={modal.data}
            onSubmit={save}
            onCancel={() => setModal(null)}
          />
        )}
      </Modal>
    </div>
  );
}

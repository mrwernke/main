import { SAT_TOPICS } from "@/lib/config";

export default function TopicBars({ breakdown }) {
  if (!breakdown) return null;
  const topics = SAT_TOPICS.filter((t) => breakdown[t]);
  if (!topics.length) return null;
  return (
    <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
      {topics.map((topic) => {
        const data = breakdown[topic];
        const pct = data.total ? Math.round((data.correct / data.total) * 100) : 0;
        return (
          <div key={topic}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-600">{topic}</span>
              <span className="text-gray-400">
                {data.correct}/{data.total} ({pct}%)
              </span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
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
  );
}

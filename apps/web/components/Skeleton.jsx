export default function Skeleton() {
  return (
    <div className="rounded-2xl bg-white p-3 shadow-card dark:bg-slate-900">
      <div className="h-28 rounded-xl bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 bg-[length:200%_100%] animate-[shimmer_1.4s_infinite] dark:from-slate-800 dark:via-slate-700 dark:to-slate-800"></div>
      <div className="mt-3 space-y-2">
        <div className="h-3 w-3/4 rounded bg-slate-100 dark:bg-slate-800"></div>
        <div className="h-3 w-1/2 rounded bg-slate-100 dark:bg-slate-800"></div>
        <div className="h-4 w-2/3 rounded bg-slate-200 dark:bg-slate-700"></div>
      </div>
    </div>
  );
}

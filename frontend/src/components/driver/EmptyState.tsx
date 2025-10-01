"use client";

export default function EmptyState({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="text-center py-12">
      <div className="text-gray-500 text-lg mb-2">{title}</div>
      {subtitle ? <div className="text-gray-400 text-sm">{subtitle}</div> : null}
    </div>
  );
}




"use client";

export default function SectionHeader({ title, right }: { title: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <div className="text-base font-semibold text-gray-800">{title}</div>
      {right}
    </div>
  );
}




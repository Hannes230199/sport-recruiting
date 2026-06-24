import { parseJobDescription } from "@/lib/parseJobDescription";

interface Section {
  title: string;
  emoji: string;
  items: string[];
  asBullets: boolean;
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="mt-3 space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2.5 text-sm text-slate-700 leading-relaxed">
          <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400 mt-[7px]" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function ParagraphBlock({ items }: { items: string[] }) {
  return (
    <div className="mt-3 space-y-3">
      {items.map((p, i) => (
        <p key={i} className="text-sm leading-relaxed text-slate-700">
          {p}
        </p>
      ))}
    </div>
  );
}

export function JobDescription({ description }: { description: string }) {
  const parsed = parseJobDescription(description);

  const sections: Section[] = [
    {
      title: "Über das Unternehmen",
      emoji: "🏢",
      items: parsed.companyInfo,
      asBullets: false,
    },
    {
      title: "Deine Aufgaben",
      emoji: "📋",
      items: parsed.tasks,
      asBullets: true,
    },
    {
      title: "Dein Profil",
      emoji: "🎯",
      items: parsed.requirements,
      asBullets: true,
    },
    {
      title: "Weitere Informationen",
      emoji: "ℹ️",
      items: parsed.moreInfo,
      asBullets: true,
    },
  ].filter((s) => s.items.length > 0);

  // No structure parsed — fall back to plain pre-wrap text
  if (sections.length === 0) {
    return (
      <div className="whitespace-pre-line text-sm leading-relaxed text-slate-700">
        {description}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {sections.map((section) => (
        <div key={section.title}>
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <span className="text-base">{section.emoji}</span>
            <h3 className="text-sm font-bold text-slate-800">{section.title}</h3>
          </div>
          {section.asBullets ? (
            <BulletList items={section.items} />
          ) : (
            <ParagraphBlock items={section.items} />
          )}
        </div>
      ))}
    </div>
  );
}

import { parseJobDescription } from "@/lib/parseJobDescription";

interface SectionDef {
  title: string;
  emoji: string;
  items: string[];
  asBullets: boolean;
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="mt-3 space-y-2.5">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3 text-sm leading-relaxed text-slate-700">
          <span className="mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
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

  const sections: SectionDef[] = [
    { title: "Über das Unternehmen", emoji: "🏢", items: parsed.companyInfo, asBullets: false },
    { title: "Deine Aufgaben",       emoji: "📋", items: parsed.tasks,       asBullets: true  },
    { title: "Dein Profil",          emoji: "🎯", items: parsed.requirements, asBullets: true  },
    { title: "Weitere Infos",        emoji: "ℹ️", items: parsed.moreInfo,    asBullets: true  },
  ].filter((s) => s.items.length > 0);

  if (sections.length === 0) {
    return (
      <div className="whitespace-pre-line text-sm leading-relaxed text-slate-700">
        {description}
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-100">
      {sections.map((section) => (
        <div key={section.title} className="py-5 first:pt-0 last:pb-0">
          <div className="flex items-center gap-2">
            <span className="text-sm">{section.emoji}</span>
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">
              {section.title}
            </h3>
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

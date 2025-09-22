import { CityExplorer } from "@/components/cities/CityExplorer";
import { StickyPageHeaderWrapper } from "@/components/layout/StickyPageHeaderWrapper";
import { CitySynonymManager } from "@/components/settings/CitySynonymManager";

export default function CitiesPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <StickyPageHeaderWrapper
        title="Города и справочники"
        description="На интерактивной карте от Яндекс Карт можно изучить ключевые города России, а ниже находится инструмент для управления синонимами и вариантами написания."
      />

      <main className="container mx-auto space-y-10 px-4 pb-12 pt-6">
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-950 px-6 py-8 shadow-xl shadow-slate-900/30">
          <CityExplorer />
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-900/10">
          <div className="mb-6 space-y-2">
            <h2 className="text-2xl font-semibold text-slate-900">Справочник синонимов</h2>
            <p className="text-sm text-slate-600">
              Поддерживайте актуальный список городов и их альтернативных написаний, чтобы все отчёты и импортированные данные оставались единообразными.
            </p>
          </div>
          <CitySynonymManager />
        </section>
      </main>
    </div>
  );
}

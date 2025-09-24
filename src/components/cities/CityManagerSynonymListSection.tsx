'use client';

import { Button, Input } from '@/components/ui';
import { MarkerPresetPicker } from '@/components/cities/MarkerPresetPicker';
import { CityMarkerIcon } from '@/components/cities/CityMarkerIcon';
import { DEFAULT_MARKER_PRESET, markerPresetLookup } from '@/lib/constants/cityMarkers';
import { normaliseMarkerPreset } from '@/lib/utils/cityCoordinates';
import type { CityCoordinates } from '@/lib/utils/cityCoordinates';
import { AddSynonymForm } from '@/components/settings/AddSynonymForm';
import type { CityGroup, CitySynonymRecord } from './cityManagerTypes';
import { InlineEdit } from '@/components/ui/InlineEdit';
import { IconMap } from '@/components/ui/IconMap';

interface CityManagerSynonymListSectionProps {
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  onSearchKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  isLoading: boolean;
  filteredGroupedSynonyms: CityGroup[];
  deletingMap: Record<string, boolean>;
  isSubmitting: boolean;
  onDeleteSynonym: (synonym: CitySynonymRecord) => void;
  onCityNameClick: (group: CityGroup) => void;
  onUpdateCityName: (cityId: string, newName: string) => Promise<void> | void;
  onDeleteCity: (event: React.MouseEvent, city: { id: string; name: string }) => void;
  onMarkerPresetChange: (cityId: string, value: string) => void;
  markerUpdatingMap: Record<string, boolean>;
  formatCityCoordinates: (coords: CityCoordinates | null) => string;
  onSynonymAdded: () => Promise<void> | void;
}

export function CityManagerSynonymListSection({
  searchTerm,
  onSearchTermChange,
  onSearchKeyDown,
  isLoading,
  filteredGroupedSynonyms,
  deletingMap,
  isSubmitting,
  onDeleteSynonym,
  onCityNameClick,
  onUpdateCityName,
  onDeleteCity,
  onMarkerPresetChange,
  markerUpdatingMap,
  formatCityCoordinates,
  onSynonymAdded,
}: CityManagerSynonymListSectionProps) {
  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="city-search">
          Поиск по списку городов
        </label>
        <div className="relative">
          <Input
            id="city-search"
            placeholder="Поиск по городу или синониму"
            value={searchTerm}
            onChange={(event) => onSearchTermChange(event.target.value)}
            onKeyDown={onSearchKeyDown}
            className="pl-9"
            type="search"
            autoComplete="new-password"
          />
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">🔍</span>
        </div>
        <p className="text-xs text-slate-500">Найдите город в существующем списке для редактирования или удаления.</p>
      </div>

      {isLoading ? (
        <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
          Загружаем текущий список городов…
        </div>
      ) : filteredGroupedSynonyms.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
          Ничего не найдено. Проверьте запрос или добавьте новый город.
        </div>
      ) : (
        filteredGroupedSynonyms.map(group => {
          const canonicalName = group.cityName;
          const synonymsForCity = group.entries.filter(
            entry => entry.synonym.trim().toLowerCase() !== canonicalName.trim().toLowerCase()
          );
          const hasCoordinates = Boolean(group.coordinates);
          const coordinatesHint = hasCoordinates ? 'Город отображается на карте' : 'Координаты не определены';
          const markerLabel = markerPresetLookup.get(normaliseMarkerPreset(group.coordinates?.markerPreset))?.label;
          const isMarkerUpdating = Boolean(markerUpdatingMap[group.cityId]);

          return (
            <div key={group.cityId} className="rounded-lg border border-slate-200 bg-white">
              <div className="flex flex-col gap-2 px-4 py-3 text-left">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    {hasCoordinates ? (
                      <MarkerPresetPicker
                        value={group.coordinates?.markerPreset ?? DEFAULT_MARKER_PRESET}
                        onChange={(value) => onMarkerPresetChange(group.cityId, value)}
                        disabled={isMarkerUpdating || isSubmitting}
                        triggerClassName="inline-flex h-8 w-8 items-center justify-center rounded-full border border-transparent bg-slate-100 text-slate-600 transition hover:bg-slate-200 focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-0"
                      />
                    ) : (
                      <span className="flex items-center justify-center rounded-full bg-slate-100 p-1" title={coordinatesHint}>
                        <CityMarkerIcon active={false} preset={group.coordinates?.markerPreset} />
                        <span className="sr-only">{coordinatesHint}</span>
                      </span>
                    )}
                  </div>

                  <div className="flex min-w-[12rem] flex-wrap items-center gap-2">
                    <InlineEdit
                      value={canonicalName}
                      onSave={(newName) => onUpdateCityName(group.cityId, newName)}
                    />
                    <span className="text-xs font-normal text-slate-500">
                      ({formatCityCoordinates(group.coordinates ?? null)})
                    </span>
                    <button
                      type="button"
                      onClick={() => onCityNameClick(group)}
                      className="rounded p-1 text-slate-500 transition hover:text-sky-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                      aria-label="Show on map"
                    >
                      <IconMap className="h-5 w-5" />
                    </button>
                  </div>

                  <AddSynonymForm
                    cityId={group.cityId}
                    cityName={canonicalName}
                    onSynonymAdded={onSynonymAdded}
                    className="flex-1 min-w-[14rem] flex-row flex-wrap items-center gap-2 lg:flex-nowrap"
                    inputClassName="h-9 flex-1 min-w-[10rem] text-sm"
                    buttonClassName="h-9 px-3"
                  />

                  <Button
                    variant="danger"
                    size="sm"
                    onClick={(event) => group.cityId && onDeleteCity(event, { id: group.cityId, name: canonicalName })}
                    disabled={!group.cityId}
                    className="ml-auto shrink-0"
                  >
                    Удалить
                  </Button>
                </div>

                {synonymsForCity.length > 0 ? (
                  <div className="flex flex-wrap gap-1 text-[11px] text-slate-600">
                    {synonymsForCity.map(entry => (
                      <span
                        key={entry.id}
                        className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 leading-tight"
                      >
                        {entry.synonym}
                        <button
                          type="button"
                          onClick={() => onDeleteSynonym(entry)}
                          className="rounded-full border border-transparent px-1 text-slate-400 transition hover:border-red-400 hover:text-red-500"
                          disabled={!!deletingMap[entry.id.toString()] || isSubmitting}
                          aria-label="Удалить синоним"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

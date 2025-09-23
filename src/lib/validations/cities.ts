import { z } from 'zod';

export const updateCityCoordinatesSchema = z.object({
  id: z.string().uuid(),
  coordinates: z.object({
    lat: z.number(),
    lon: z.number(),
    markerPreset: z.string().min(1).optional().nullable(),
  }),
});

export type UpdateCityCoordinatesData = z.infer<typeof updateCityCoordinatesSchema>;

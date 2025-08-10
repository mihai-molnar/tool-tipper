import { z } from 'zod';

export const createPageSchema = z.object({
  title: z.string().optional(),
});

export const createHotspotSchema = z.object({
  page_id: z.string().uuid(),
  x_pct: z.number().min(0).max(1),
  y_pct: z.number().min(0).max(1),
  text: z.string().min(1).max(1000),
});

export const updateHotspotSchema = z.object({
  text: z.string().min(1).max(1000).optional(),
  x_pct: z.number().min(0).max(1).optional(),
  y_pct: z.number().min(0).max(1).optional(),
  z_index: z.number().optional(),
});

export const updatePageSchema = z.object({
  title: z.string().max(200).optional(),
});

export const uploadFileSchema = z.object({
  pageId: z.string().uuid(),
});
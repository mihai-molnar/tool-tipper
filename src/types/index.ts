export interface Page {
  id: string;
  slug: string;
  edit_token?: string;
  title?: string;
  image_path: string;
  image_url?: string;
  image_width?: number;
  image_height?: number;
  created_at: string;
  updated_at: string;
}

export interface Hotspot {
  id: string;
  page_id: string;
  x_pct: number;
  y_pct: number;
  text: string;
  z_index: number;
  created_at: string;
  updated_at: string;
}

export interface CreatePageRequest {
  title?: string;
}

export interface CreatePageResponse {
  id: string;
  slug: string;
  edit_token: string;
}

export interface UploadResponse {
  image_path: string;
  image_url: string;
  image_width: number;
  image_height: number;
}

export interface CreateHotspotRequest {
  page_id: string;
  x_pct: number;
  y_pct: number;
  text: string;
}

export interface UpdateHotspotRequest {
  text?: string;
  x_pct?: number;
  y_pct?: number;
  z_index?: number;
}

export interface UpdatePageRequest {
  title?: string;
}
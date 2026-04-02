export type UserRole = 'admin' | 'rep' | 'demo';
export type VisualizationStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  tenant_id: string;
  full_name: string;
  role: UserRole;
  avatar_url: string | null;
  created_at: string;
}

export interface Product {
  id: string;
  tenant_id: string;
  name: string;
  brand: string;
  color: string;
  style: string | null;
  swatch_url: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Visualization {
  id: string;
  tenant_id: string;
  created_by: string;
  product_id: string;
  customer_name: string | null;
  customer_address: string | null;
  original_image_path: string;
  result_image_path: string | null;
  prompt_used: string | null;
  status: VisualizationStatus;
  error_message: string | null;
  processing_time_ms: number | null;
  created_at: string;
  // Joined fields
  product?: Product;
  creator?: Profile;
}

export interface Invite {
  id: string;
  tenant_id: string;
  email: string;
  role: UserRole;
  token: string;
  accepted_at: string | null;
  created_at: string;
}

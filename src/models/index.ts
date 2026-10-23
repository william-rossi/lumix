/**
 * Core domain models for the real estate platform
 * All interfaces in English as per project requirements
 */

export interface Agency {
  id: string;
  name: string;
  slug: string; // URL-friendly identifier
  logo?: string;
  coverImage?: string;
  description: string;
  address: Address;
  phone: string;
  email: string;
  website?: string;
  creci: string; // Brazilian real estate license
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface Address {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  coordinates?: GeoCoordinates;
}

export interface GeoCoordinates {
  lat: number;
  lng: number;
}

export interface Development {
  id: string;
  agencyId: string;
  name: string;
  slug: string; // For subdomain: meuempreendimento.lumix.com.br
  description: string;
  tagline?: string;
  address: Address;
  status: DevelopmentStatus;
  type: DevelopmentType;
  launchDate?: Date;
  deliveryDate?: Date;
  coverImage: string;
  gallery: MediaItem[];
  model3d: Model3DConfig;
  units: Unit[];
  amenities: Amenity[];
  specifications: Specification[];
  pricing: PricingInfo;
  highlights: string[];
  nearby?: NearbyPlace[];
  createdAt: Date;
  updatedAt: Date;
  isPublished: boolean;
  featured?: boolean;
  seo: SEOData;
}

export type DevelopmentStatus = 
  | 'launching' 
  | 'under_construction' 
  | 'ready' 
  | 'sold_out';

export type DevelopmentType = 
  | 'residential' 
  | 'commercial' 
  | 'mixed' 
  | 'land';

export interface Model3DConfig {
  id: string;
  url: string; // GLTF/GLB file URL
  format: 'gltf' | 'glb';
  version: string;
  fileSize: number; // in bytes
  bounds: BoundingBox;
  unitsMapping: Unit3DMapping[];
  cameraPresets: CameraPreset[];
  lightingPreset: LightingPreset;
  materials: MaterialConfig[];
  /**
   * Normalized massing used to build the interactive scale model when no
   * uploaded GLB art model is present. Keeps the demo lightweight and lets
   * the agency edit floors/units without touching a 3D editor.
   */
  massing: MassingConfig;
  storage?: ModelStorageInfo;
}

export interface MassingConfig {
  mode: "procedural" | "model";
  floors: number;
  unitsPerFloor: number;
  towerWidth: number;
  towerDepth: number;
  floorHeight: number;
}

export interface ModelStorageInfo {
  provider: "mongodb-gridfs" | "s3" | "local";
  fileId: string;
  checksum: string;
  compressed: boolean;
  compression?: "draco" | "meshopt" | "gzip";
  uploadedAt: Date;
}

export interface BoundingBox {
  min: Vector3;
  max: Vector3;
}

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface Unit3DMapping {
  unitId: string;
  meshNames: string[]; // Mesh names in the 3D model that represent this unit
  floorLevel: number;
  position: Vector3; // Center position for camera focus
  color?: string; // Highlight color for availability status
}

export interface CameraPreset {
  id: string;
  name: string;
  position: Vector3;
  target: Vector3;
  fov?: number;
}

export interface LightingPreset {
  environmentMap?: string;
  ambientIntensity: number;
  directionalLights: DirectionalLight[];
}

export interface DirectionalLight {
  position: Vector3;
  intensity: number;
  color: string;
}

export interface MaterialConfig {
  meshName: string;
  material: {
    type: 'standard' | 'physical' | 'basic';
    color?: string;
    metalness?: number;
    roughness?: number;
    transparent?: boolean;
    opacity?: number;
    map?: string; // Texture URL
  };
}

export interface Unit {
  id: string;
  developmentId: string;
  code: string; // Human-readable: "A-101", "B-202"
  name?: string; // Marketing name: "Studio Premium", "Cobertura Duplex"
  floor: number;
  type: UnitType;
  status: UnitStatus;
  area: AreaBreakdown;
  rooms: RoomConfig;
  pricing: UnitPricing;
  orientation: Orientation;
  images: MediaItem[];
  floorPlan?: MediaItem;
  features: string[];
  description?: string;
  sortOrder: number;
}

export type UnitType = 
  | 'studio' 
  | '1_bedroom' 
  | '2_bedrooms' 
  | '3_bedrooms' 
  | '4_bedrooms' 
  | 'penthouse' 
  | 'garden' 
  | 'commercial' 
  | 'custom';

export type UnitStatus = 
  | 'available' 
  | 'reserved' 
  | 'sold' 
  | 'blocked';

export interface AreaBreakdown {
  private: number; // Área privativa
  common: number; // Área comum
  total: number; // Área total
  balcony?: number;
  garden?: number;
}

export interface RoomConfig {
  bedrooms: number;
  suites: number;
  bathrooms: number;
  halfBathrooms: number;
  parkingSpaces: number;
  hasBalcony: boolean;
  hasGarden: boolean;
  hasStorage: boolean;
}

export interface UnitPricing {
  basePrice: number; // in cents (BRL)
  pricePerSqm: number; // in cents
  iptuEstimate?: number; // monthly in cents
  condoFeeEstimate?: number; // monthly in cents
  paymentPlan?: PaymentPlan;
  promotions?: Promotion[];
}

export interface PaymentPlan {
  downPayment: number; // percentage
  installments: number;
  correctionIndex: 'INCC' | 'IPCA' | 'CDI' | 'fixed';
  balloonPayments?: BalloonPayment[];
}

export interface BalloonPayment {
  dueDate: Date;
  amount: number; // in cents
  description: string;
}

export interface Promotion {
  id: string;
  name: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  validUntil: Date;
  conditions?: string;
}

export type Orientation = 
  | 'north' 
  | 'south' 
  | 'east' 
  | 'west' 
  | 'northeast' 
  | 'northwest' 
  | 'southeast' 
  | 'southwest';

export interface Amenity {
  id: string;
  name: string;
  icon: string;
  category: AmenityCategory;
  description?: string;
}

export type AmenityCategory = 
  | 'leisure' 
  | 'sports' 
  | 'wellness' 
  | 'convenience' 
  | 'security' 
  | 'sustainability' 
  | 'technology';

export interface NearbyPlace {
  label: string;
  category: string;
  minutes: number;
}

export interface Specification {
  category: string;
  items: SpecificationItem[];
}

export interface SpecificationItem {
  name: string;
  value: string;
  highlight?: boolean;
}

export interface PricingInfo {
  minPrice: number; // in cents
  maxPrice: number; // in cents
  currency: 'BRL';
  pricePerSqmRange: { min: number; max: number };
}

export interface MediaItem {
  id: string;
  type: 'image' | 'video' | '360' | 'floorplan';
  url: string;
  thumbnail?: string;
  alt: string;
  caption?: string;
  order: number;
  metadata?: MediaMetadata;
}

export interface MediaMetadata {
  width?: number;
  height?: number;
  format?: string;
  size?: number;
}

export interface SEOData {
  title: string;
  description: string;
  keywords: string[];
  ogImage?: string;
  structuredData?: Record<string, unknown>;
}

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: UserRole;
  agencyId?: string;
  avatar?: string;
  preferences: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

export type UserRole = 'super_admin' | 'agency_admin' | 'agent' | 'client';

export interface UserPreferences {
  language: 'pt-BR' | 'en' | 'es';
  currency: 'BRL';
  notifications: NotificationPreferences;
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  whatsapp: boolean;
  sms: boolean;
}

export interface Lead {
  id: string;
  developmentId: string;
  unitId?: string;
  name: string;
  email: string;
  phone: string;
  message?: string;
  source: LeadSource;
  status: LeadStatus;
  assignedAgentId?: string;
  utm?: UTMParams;
  createdAt: Date;
  updatedAt: Date;
}

export type LeadSource = 
  | 'website' 
  | 'portal' 
  | 'social_media' 
  | 'referral' 
  | 'walk_in' 
  | 'event';

export type LeadStatus = 
  | 'new' 
  | 'contacted' 
  | 'qualified' 
  | 'visiting' 
  | 'proposal' 
  | 'closed_won' 
  | 'closed_lost';

export interface UTMParams {
  source?: string;
  medium?: string;
  campaign?: string;
  term?: string;
  content?: string;
}

export interface View3DState {
  selectedUnitId: string | null;
  cameraMode: 'orbit' | 'first_person' | 'floor_plan' | 'dollhouse';
  floorLevel: number | null;
  isMeasureMode: boolean;
  annotations: Annotation[];
}

export interface Annotation {
  id: string;
  position: Vector3;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'feature' | 'measurement';
}
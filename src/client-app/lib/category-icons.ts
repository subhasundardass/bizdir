// lib/category-icons.ts
import {
  Utensils,
  Hotel,
  Stethoscope,
  Dumbbell,
  Scissors,
  Wrench,
  GraduationCap,
  ShoppingBag,
  Car,
  Building2,
  type LucideIcon
} from 'lucide-react';

const ICONS: Record<string, LucideIcon> = {
  utensils: Utensils,
  hotel: Hotel,
  stethoscope: Stethoscope,
  dumbbell: Dumbbell,
  scissors: Scissors,
  wrench: Wrench,
  'graduation-cap': GraduationCap,
  'shopping-bag': ShoppingBag,
  car: Car
};

export const getCategoryIcon = (key?: string): LucideIcon => (key && ICONS[key]) || Building2; // safe fallback

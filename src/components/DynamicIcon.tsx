import React from 'react';
import {
  Sparkles,
  Coffee,
  Smartphone,
  Watch,
  Shirt,
  ShoppingBag,
  Laptop,
  Gift,
  Headphones,
  Camera,
  Tv,
  Gem,
  Package,
  Heart,
  Crown,
  Flame,
  Tag,
  Store,
  LucideProps,
} from 'lucide-react';

export const ICON_MAP: Record<string, React.FC<LucideProps>> = {
  Sparkles,
  Coffee,
  Smartphone,
  Watch,
  Shirt,
  ShoppingBag,
  Laptop,
  Gift,
  Headphones,
  Camera,
  Tv,
  Gem,
  Package,
  Heart,
  Crown,
  Flame,
  Tag,
  Store,
};

export const AVAILABLE_ICONS = Object.keys(ICON_MAP);

interface DynamicIconProps extends LucideProps {
  name?: string;
}

export const DynamicIcon: React.FC<DynamicIconProps> = ({ name, ...props }) => {
  if (!name || !ICON_MAP[name]) {
    return <ShoppingBag {...props} />;
  }
  const IconComponent = ICON_MAP[name];
  return <IconComponent {...props} />;
};

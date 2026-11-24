import {
  type Icon,
  IconBarbell,
  IconBeer,
  IconBike,
  IconBolt,
  IconBook,
  IconBriefcase,
  IconBuildingBank,
  IconBus,
  IconCar,
  IconCash,
  IconCategory,
  IconCoffee,
  IconCreditCard,
  IconDeviceGamepad2,
  IconDeviceMobile,
  IconDeviceTv,
  IconDroplet,
  IconFirstAidKit,
  IconGasStation,
  IconGift,
  IconHeart,
  IconHome,
  IconMovie,
  IconMusic,
  IconPaw,
  IconPigMoney,
  IconPill,
  IconPlane,
  IconReceipt,
  IconSchool,
  IconShirt,
  IconShoppingCart,
  IconTool,
  IconToolsKitchen2,
  IconWifi,
} from '@tabler/icons-react';
import {
  type CategoryColor,
  type CategoryIconKey,
  resolveCategoryAppearance,
} from '@/lib/category-appearance';
import { cn } from '@/lib/utils';

const CATEGORY_ICON_COMPONENTS: Record<CategoryIconKey, Icon> = {
  category: IconCategory,
  'shopping-cart': IconShoppingCart,
  'tools-kitchen-2': IconToolsKitchen2,
  coffee: IconCoffee,
  home: IconHome,
  car: IconCar,
  bus: IconBus,
  'gas-station': IconGasStation,
  plane: IconPlane,
  heart: IconHeart,
  'first-aid-kit': IconFirstAidKit,
  pill: IconPill,
  school: IconSchool,
  book: IconBook,
  briefcase: IconBriefcase,
  cash: IconCash,
  'credit-card': IconCreditCard,
  'pig-money': IconPigMoney,
  receipt: IconReceipt,
  gift: IconGift,
  shirt: IconShirt,
  'device-gamepad-2': IconDeviceGamepad2,
  'device-mobile': IconDeviceMobile,
  'device-tv': IconDeviceTv,
  wifi: IconWifi,
  bolt: IconBolt,
  droplet: IconDroplet,
  paw: IconPaw,
  barbell: IconBarbell,
  movie: IconMovie,
  music: IconMusic,
  beer: IconBeer,
  'building-bank': IconBuildingBank,
  tool: IconTool,
  bike: IconBike,
};

const LIGHT_FOREGROUND = '#ffffff';
const DARK_FOREGROUND = '#111827';
const MIN_CONTRAST = 3;
const ICON_SIZE_RATIO = 0.55;

function channelToLinear(channel: number): number {
  const c = channel / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function getCategoryIconForeground(color: CategoryColor): string {
  const hex = color.replace('#', '');
  const linear = (start: number) =>
    channelToLinear(Number.parseInt(hex.slice(start, start + 2), 16));
  const r = linear(0);
  const g = linear(2);
  const b = linear(4);
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const whiteContrast = 1.05 / (luminance + 0.05);

  return whiteContrast >= MIN_CONTRAST ? LIGHT_FOREGROUND : DARK_FOREGROUND;
}

export function CategoryIcon({
  icon,
  color,
  size = 40,
  className,
}: {
  icon?: string | null | undefined;
  color?: string | null | undefined;
  size?: number;
  className?: string;
}) {
  const resolved = resolveCategoryAppearance({ icon, color });
  const IconComponent = CATEGORY_ICON_COMPONENTS[resolved.icon];

  return (
    <span
      data-slot="category-icon"
      aria-hidden="true"
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full',
        className,
      )}
      style={{ backgroundColor: resolved.color, width: size, height: size }}
    >
      <IconComponent
        size={Math.round(size * ICON_SIZE_RATIO)}
        color={getCategoryIconForeground(resolved.color)}
        stroke={2}
      />
    </span>
  );
}

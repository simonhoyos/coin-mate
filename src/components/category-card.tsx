'use client';

import { IconPencil, IconTrash } from '@tabler/icons-react';
import { motion, type PanInfo, useAnimation } from 'framer-motion';
import React from 'react';
import { CategoryIcon } from '@/components/category-icon';
import { Button } from '@/components/ui/button';
import { useIsMobileResolved } from '@/hooks/use-mobile';

interface Category {
  id: string;
  name?: string;
  description?: string;
  icon?: string | null;
  color?: string | null;
  space?: {
    id: string;
    name?: string;
  };
}

interface CategoryCardProps {
  category: Category;
  onEditClick: (id: string) => void;
  onDeleteClick: (id: string) => void;
}

export function CategoryCard({
  category,
  onEditClick,
  onDeleteClick,
}: CategoryCardProps) {
  const viewport = useIsMobileResolved();
  const isMobile = viewport === true;
  const isDesktop = viewport === false;
  const controls = useAnimation();
  const [isSwipedOpen, setIsSwipedOpen] = React.useState(false);

  const ACTIONS_WIDTH = 160;

  const handlePanEnd = async (_: never, info: PanInfo) => {
    const offset = info.offset.x;
    const velocity = info.velocity.x;

    if (offset < -ACTIONS_WIDTH / 2 || velocity < -100) {
      await controls.start({ x: -ACTIONS_WIDTH });
      setIsSwipedOpen(true);
    } else {
      await controls.start({ x: 0 });
      setIsSwipedOpen(false);
    }
  };

  React.useEffect(() => {
    if (!isMobile && isSwipedOpen) {
      controls.start({ x: 0 });
      setIsSwipedOpen(false);
    }
  }, [isMobile, isSwipedOpen, controls]);

  return (
    <div className="relative overflow-hidden rounded border shadow-xs bg-muted md:flex md:items-center md:bg-background">
      {isMobile && (
        <div className="absolute inset-0 flex justify-end items-stretch">
          <div className="flex w-[160px]">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onEditClick(category.id)}
              className="h-full rounded-none flex-1 px-0 flex flex-col gap-1 items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              <IconPencil size={20} />
              <span className="text-xs font-medium">Edit</span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onDeleteClick(category.id)}
              className="bg-destructive text-white h-full rounded-none flex-1 px-0 flex flex-col gap-1 items-center justify-center hover:bg-destructive hover:text-destructive-foreground transition-colors"
            >
              <IconTrash size={20} />
              <span className="text-xs font-medium">Delete</span>
            </Button>
          </div>
        </div>
      )}

      <motion.div
        drag={isMobile ? 'x' : false}
        dragConstraints={{ left: -1000, right: 0 }}
        dragElastic={0.1}
        animate={controls}
        {...(isMobile ? { onPanEnd: handlePanEnd } : {})}
        className="relative px-4 py-6 bg-background flex flex-col gap-2 max-md:cursor-pointer md:flex-1 z-10 max-md:active:cursor-grabbing"
        onClick={() => {
          if (isSwipedOpen) {
            controls.start({ x: 0 });
            setIsSwipedOpen(false);
          }
        }}
      >
        <div className="flex items-center gap-3 pointer-events-none">
          <CategoryIcon
            icon={category.icon ?? null}
            color={category.color ?? null}
          />
          <div className="flex flex-1 min-w-0 flex-col gap-2">
            <h2 className="font-bold capitalize">{category.name}</h2>
            {(category.description ?? '') !== '' && (
              <p>{category.description}</p>
            )}
            {category.space?.name != null && (
              <p className="text-xs text-muted-foreground">
                {category.space.name}
              </p>
            )}
          </div>
        </div>
      </motion.div>

      {isDesktop && (
        <div className="flex items-stretch self-stretch bg-background">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Edit"
            className="h-full w-14 rounded-none cursor-pointer"
            onClick={() => onEditClick(category.id)}
          >
            <IconPencil size={16} />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Delete"
            className="h-full w-14 rounded-none cursor-pointer text-destructive"
            onClick={() => onDeleteClick(category.id)}
          >
            <IconTrash size={16} />
          </Button>
        </div>
      )}
    </div>
  );
}

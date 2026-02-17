'use client';

import {
  IconPencil,
  IconTrash,
} from '@tabler/icons-react';
import { motion, useAnimation, PanInfo } from 'framer-motion';
import Link from 'next/link';
import React from 'react';
import { Button } from '@/components/ui/button';

interface Transaction {
  id: string;
  concept?: string;
  description?: string;
  currency?: string;
  amount_cents?: number;
  transacted_at?: string;
  type?: string;
  category?: {
    id: string;
    name?: string;
  };
}

interface TransactionCardProps {
  transaction: Transaction;
  moneyFormatter: Intl.NumberFormat;
  editHref: string;
  onDeleteClick: (id: string) => void;
}

export function TransactionCard({
  transaction,
  moneyFormatter,
  editHref,
  onDeleteClick,
}: TransactionCardProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const controls = useAnimation();
  const [isSwipedOpen, setIsSwipedOpen] = React.useState(false);

  const ACTIONS_WIDTH = 160; // Total width of Edit + Delete buttons
  const FULL_SWIPE_THRESHOLD = 250;

  const handlePanEnd = async (_: any, info: PanInfo) => {
    const offset = info.offset.x;
    const velocity = info.velocity.x;

    if (offset < -FULL_SWIPE_THRESHOLD || velocity < -500) {
      // Full swipe to delete
      onDeleteClick(transaction.id);
      controls.start({ x: 0 });
      setIsSwipedOpen(false);
    } else if (offset < -ACTIONS_WIDTH / 2 || velocity < -100) {
      // Snap open to show actions
      await controls.start({ x: -ACTIONS_WIDTH });
      setIsSwipedOpen(true);
    } else {
      // Snap back closed
      await controls.start({ x: 0 });
      setIsSwipedOpen(false);
    }
  };

  return (
    <div className="relative overflow-hidden rounded border shadow-xs group bg-muted">
      {/* Actions Layer (Revealed on Swipe/Hover) */}
      <div className="absolute inset-0 flex justify-end items-stretch">
        <div className="flex w-[160px]">
          <Button 
            type="button" 
            variant="ghost" 
            asChild
            className="h-full rounded-none flex-1 px-0 flex flex-col gap-1 items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            <Link href={editHref}>
              <IconPencil size={20} />
              <span className="text-xs font-medium">Edit</span>
            </Link>
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onDeleteClick(transaction.id)}
            className="h-full rounded-none flex-1 px-0 flex flex-col gap-1 items-center justify-center hover:bg-destructive hover:text-destructive-foreground transition-colors"
          >
            <IconTrash size={20} />
            <span className="text-xs font-medium">Delete</span>
          </Button>
        </div>
      </div>

      {/* Main Card Layer */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -1000, right: 0 }}
        dragElastic={0.1}
        animate={controls}
        onPanEnd={handlePanEnd}
        className="relative px-4 py-6 bg-background flex flex-col gap-2 cursor-pointer active:cursor-grabbing z-10"
        onClick={() => {
          if (!isSwipedOpen) {
            setIsExpanded(!isExpanded);
          } else {
            // Close actions if tapped while open
            controls.start({ x: 0 });
            setIsSwipedOpen(false);
          }
        }}
      >
        <div className="flex justify-between items-start pointer-events-none">
          <div className="flex flex-col gap-1">
            <p className="text-xs text-gray-500">
              {transaction.category?.name} ({transaction.type})
            </p>
            <h2 className="font-bold">{transaction.concept}</h2>
          </div>
          <div className="text-right">
            <p className="font-medium">
              {moneyFormatter.format((transaction.amount_cents ?? 0) / 100)}
            </p>
          </div>
        </div>

        {isExpanded && (transaction.description ?? '') !== '' && (
          <motion.p 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="text-sm text-muted-foreground mt-2 pointer-events-none overflow-hidden"
          >
            {transaction.description}
          </motion.p>
        )}
        
        {/* Desktop Hover Hint */}
        <div className="absolute right-2 top-4 opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex gap-1 pointer-events-none">
           <IconPencil size={14} className="text-muted-foreground" />
           <IconTrash size={14} className="text-destructive/50" />
        </div>
      </motion.div>
    </div>
  );
}

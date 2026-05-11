import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

interface BackButtonProps {
  to?: string;
  label?: string;
  className?: string;
}

export default function BackButton({ to, label = "Return to Terminal", className }: BackButtonProps) {
  const navigate = useNavigate();

  return (
    <motion.button
      whileHover={{ x: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => to ? navigate(to) : navigate(-1)}
      className={cn(
        "inline-flex items-center gap-2 text-gray-500 hover:text-cyan-400 transition-all font-black uppercase tracking-widest text-[10px] py-2",
        className
      )}
    >
      <div className="w-8 h-8 rounded-full border border-gray-800 flex items-center justify-center group-hover:border-cyan-500/30 group-hover:bg-cyan-500/10 transition-all">
        <ArrowLeft size={16} />
      </div>
      <span>{label}</span>
    </motion.button>
  );
}

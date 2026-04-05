import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp } from "lucide-react";

interface SplashScreenProps {
  show: boolean;
}

const SplashScreen = ({ show }: SplashScreenProps) => (
  <AnimatePresence>
    {show && (
      <motion.div
        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background"
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      >
        {/* Animated rings */}
        <div className="relative flex items-center justify-center">
          <motion.div
            className="absolute h-28 w-28 rounded-full border-2 border-primary/20"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: [0.6, 1.2, 0.6], opacity: [0, 0.5, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute h-20 w-20 rounded-full border-2 border-accent/30"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: [0.8, 1.4, 0.8], opacity: [0, 0.4, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
          />
          <motion.div
            className="flex h-16 w-16 items-center justify-center rounded-2xl gradient-hero shadow-hero"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
          >
            <TrendingUp className="h-8 w-8 text-primary-foreground" />
          </motion.div>
        </div>

        <motion.h1
          className="mt-6 text-2xl font-bold text-foreground"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          InvestSphere
        </motion.h1>

        {/* Loading bar */}
        <motion.div
          className="mt-4 h-1 w-40 overflow-hidden rounded-full bg-secondary"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <motion.div
            className="h-full rounded-full gradient-hero"
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>

        <motion.p
          className="mt-3 text-sm text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          Securing your investments...
        </motion.p>
      </motion.div>
    )}
  </AnimatePresence>
);

export default SplashScreen;

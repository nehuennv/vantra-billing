import { motion } from "framer-motion";

export function PageTransition({ children, className = "" }) {
    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

import { toastManager } from "../context/ToastManager";

export const useToast = () => {
    return { toast: toastManager };
};

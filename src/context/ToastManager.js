export class ToastManager {
    constructor() {
        this.listeners = new Set();
    }

    subscribe(listener) {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    }

    notify(event) {
        this.listeners.forEach(listener => listener(event));
    }

    add(type, message, mixedArgs, extraDuration) {
        let description, duration, icon;

        if (typeof mixedArgs === 'object' && mixedArgs !== null) {
            // Sonner style: toast.success('Title', { description, duration, icon })
            description = mixedArgs.description;
            duration = mixedArgs.duration;
            icon = mixedArgs.icon;
        } else {
            // Standard style: toast.success('Title', 'Description', 4000)
            description = mixedArgs;
            duration = extraDuration;
        }

        // Defaults
        if (duration === undefined) duration = 4000;

        const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
        this.notify({ type: 'ADD', payload: { id, type, message, description, duration, icon } });
        return id;
    }

    dismiss(id) {
        this.notify({ type: 'DISMISS', payload: { id } });
    }

    success(message, args, duration) {
        return this.add('success', message, args, duration);
    }

    error(message, args, duration) {
        return this.add('error', message, args, duration);
    }

    warning(message, args, duration) {
        return this.add('warning', message, args, duration);
    }

    info(message, args, duration) {
        return this.add('info', message, args, duration);
    }

    loading(message, args, duration = Infinity) {
        return this.add('loading', message, args, duration);
    }

    update(id, { type, message, description, duration = 4000 }) {
        this.notify({ type: 'UPDATE', payload: { id, updates: { type, message, description, duration } } });
    }

    promise(promise, { loading, success, error }) {
        const id = this.loading(loading);

        promise
            .then((data) => {
                const message = typeof success === 'function' ? success(data) : success;
                this.dismiss(id);
                this.success(message);
            })
            .catch((err) => {
                const message = typeof error === 'function' ? error(err) : error;
                this.dismiss(id);
                this.error(message);
            });

        return promise;
    }
}

export const toastManager = new ToastManager();

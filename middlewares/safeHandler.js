export const safeHandler = (fn) => {
    return (req, res, next) => {
        try {
            const result = fn(req, res, next);
            if (result instanceof Promise) {
                result.catch(next); 
            }
        } catch (error) {
            next(error); 
        }
    };
};
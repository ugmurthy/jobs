import { allowedQueues } from '../config/queues.js';
export const validateQueue = (req, res, next) => {
    const { queueName } = req.params;
    if (!allowedQueues.includes(queueName)) {
        res.status(400).json({ message: `Queue '${queueName}' is not a valid queue.` });
        return;
    }
    next();
};

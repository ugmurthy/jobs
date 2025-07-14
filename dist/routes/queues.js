import { Router } from 'express';
import { allowedQueues } from '../config/queues.js';
const router = Router();
router.get('/', (req, res) => {
    res.json({ queues: allowedQueues });
});
export default router;

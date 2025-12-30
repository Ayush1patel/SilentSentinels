/**
 * Training Service API
 * Manages continuous self-supervised learning on the server
 */
const express = require('express');
const router = express.Router();
const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

// Training state
let trainingStatus = {
    isActive: false,
    model_version: 0,
    total_samples: 0,
    samples_accepted: 0,
    queue_size: 0,
    latest_metrics: null,
    last_update: null
};

// Queue for incoming samples
const sampleQueue = [];
const MAX_QUEUE_SIZE = 1000;

/**
 * POST /api/training/add-sample
 * Add a new sample to the training queue
 */
router.post('/add-sample', async (req, res) => {
    try {
        const { features, confidence, label } = req.body;

        if (!features || confidence === undefined || label === undefined) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Validate features array (should be 521-dimensional YAMNet scores)
        if (!Array.isArray(features) || features.length !== 521) {
            return res.status(400).json({ error: 'Invalid features array' });
        }

        // Add to queue
        if (sampleQueue.length < MAX_QUEUE_SIZE) {
            sampleQueue.push({
                features,
                confidence,
                label,
                timestamp: new Date().toISOString()
            });

            trainingStatus.total_samples++;
            trainingStatus.queue_size = sampleQueue.length;

            return res.json({
                success: true,
                queue_size: sampleQueue.length,
                total_samples: trainingStatus.total_samples
            });
        } else {
            return res.status(507).json({ error: 'Queue full' });
        }
    } catch (error) {
        console.error('Error adding sample:', error);
        return res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/training/trigger
 * Manually trigger model retraining
 */
router.post('/trigger', async (req, res) => {
    try {
        if (trainingStatus.isActive) {
            return res.status(409).json({ error: 'Training already in progress' });
        }

        if (sampleQueue.length < 10) {
            return res.status(400).json({ error: 'Not enough samples (minimum 10)' });
        }

        // Start training in background
        trainingStatus.isActive = true;
        triggerBackgroundTraining();

        return res.json({
            success: true,
            message: 'Training started',
            samples_count: sampleQueue.length
        });
    } catch (error) {
        console.error('Error triggering training:', error);
        trainingStatus.isActive = false;
        return res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/training/status
 * Get current training status and metrics
 */
router.get('/status', (req, res) => {
    res.json(trainingStatus);
});

/**
 * GET /api/training/metrics
 * Get latest F² score and performance metrics
 */
router.get('/metrics', async (req, res) => {
    try {
        const metricsPath = path.join(__dirname, '../custom_model_training/metrics_log.json');

        try {
            const data = await fs.readFile(metricsPath, 'utf-8');
            const metricsHistory = JSON.parse(data);
            const latestMetrics = metricsHistory[metricsHistory.length - 1];

            res.json({
                latest: latestMetrics,
                history: metricsHistory
            });
        } catch (fileError) {
            res.json({ latest: null, history: [] });
        }
    } catch (error) {
        console.error('Error reading metrics:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Background training function
 * Runs Python training script
 */
function triggerBackgroundTraining() {
    console.log(`🔄 Starting background training with ${sampleQueue.length} samples...`);

    // Save queue to file for Python script
    const queuePath = path.join(__dirname, '../custom_model_training/training_queue.json');
    fs.writeFile(queuePath, JSON.stringify(sampleQueue, null, 2))
        .then(() => {
            // Run Python training script
            const pythonPath = 'python';
            const scriptPath = path.join(__dirname, '../custom_model_training/train_from_queue.py');

            const pythonProcess = spawn(pythonPath, [scriptPath]);

            let stdout = '';
            let stderr = '';

            pythonProcess.stdout.on('data', (data) => {
                stdout += data.toString();
                console.log(`[Training] ${data.toString().trim()}`);
            });

            pythonProcess.stderr.on('data', (data) => {
                stderr += data.toString();
                console.error(`[Training Error] ${data.toString().trim()}`);
            });

            pythonProcess.on('close', (code) => {
                trainingStatus.isActive = false;
                trainingStatus.last_update = new Date().toISOString();

                if (code === 0) {
                    console.log('✅ Training completed successfully');
                    trainingStatus.model_version++;

                    // Clear queue
                    sampleQueue.length = 0;
                    trainingStatus.queue_size = 0;

                    // Try to read updated metrics
                    readLatestMetrics();
                } else {
                    console.error(`❌ Training failed with code ${code}`);
                    console.error(stderr);
                }
            });
        })
        .catch(error => {
            console.error('Error saving queue:', error);
            trainingStatus.isActive = false;
        });
}

/**
 * Read latest metrics from file
 */
async function readLatestMetrics() {
    try {
        const metricsPath = path.join(__dirname, '../custom_model_training/metrics_log.json');
        const data = await fs.readFile(metricsPath, 'utf-8');
        const metricsHistory = JSON.parse(data);
        trainingStatus.latest_metrics = metricsHistory[metricsHistory.length - 1];
    } catch (error) {
        console.log('Could not read metrics:', error.message);
    }
}

module.exports = router;

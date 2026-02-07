/**
 * Device Sync Scheduler Service
 * Handles background synchronization of connected devices every hour
 */

const cron = require('node-cron');
const { DeviceConnection, SYNC_STATUS } = require('../models/DeviceConnection');
const deviceSyncService = require('./deviceSync.service');
const logger = require('../utils/logger');

let schedulerJob = null;
let isRunning = false;

/**
 * Process all devices due for sync
 */
const processDeviceSync = async () => {
    if (isRunning) {
        logger.info('Device sync already in progress, skipping...');
        return;
    }

    isRunning = true;
    const startTime = Date.now();

    try {
        // Get devices due for sync
        const devices = await DeviceConnection.getDevicesDueForSync();

        if (devices.length === 0) {
            logger.debug('No devices due for sync');
            return;
        }

        logger.info(`Starting device sync for ${devices.length} device(s)`);

        let successCount = 0;
        let failCount = 0;

        // Process each device
        for (const device of devices) {
            try {
                await deviceSyncService.syncDevice(device._id);
                successCount++;
                logger.info(`Synced device ${device._id} for patient ${device.patient?.patientId || device.patient}`);
            } catch (error) {
                failCount++;
                logger.error(`Failed to sync device ${device._id}:`, error.message);
            }

            // Small delay between syncs to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        const duration = Date.now() - startTime;
        logger.info(`Device sync completed: ${successCount} success, ${failCount} failed (${duration}ms)`);
    } catch (error) {
        logger.error('Device sync scheduler error:', error);
    } finally {
        isRunning = false;
    }
};

/**
 * Start the device sync scheduler
 * Runs every hour at minute 0
 */
const startScheduler = () => {
    if (schedulerJob) {
        logger.warn('Device sync scheduler already running');
        return;
    }

    // Run every hour at minute 0 (e.g., 1:00, 2:00, 3:00, etc.)
    schedulerJob = cron.schedule('0 * * * *', async () => {
        logger.info('Hourly device sync triggered');
        await processDeviceSync();
    }, {
        scheduled: true,
        timezone: 'Asia/Kolkata', // IST timezone
    });

    logger.info('Device sync scheduler started (runs every hour)');

    // Also run once on startup after a delay to catch any pending syncs
    setTimeout(async () => {
        logger.info('Running initial device sync check...');
        await processDeviceSync();
    }, 10000); // Wait 10 seconds after startup
};

/**
 * Stop the scheduler
 */
const stopScheduler = () => {
    if (schedulerJob) {
        schedulerJob.stop();
        schedulerJob = null;
        logger.info('Device sync scheduler stopped');
    }
};

/**
 * Get scheduler status
 */
const getSchedulerStatus = async () => {
    const pendingDevices = await DeviceConnection.countDocuments({
        isConnected: true,
        'syncConfig.enabled': true,
        'lastSync.status': { $in: [SYNC_STATUS.PENDING, SYNC_STATUS.FAILED] },
    });

    const connectedDevices = await DeviceConnection.countDocuments({
        isConnected: true,
    });

    const nextSync = await DeviceConnection.findOne({
        isConnected: true,
        'syncConfig.enabled': true,
    }).sort({ nextSyncAt: 1 }).select('nextSyncAt');

    return {
        isRunning: !!schedulerJob,
        isSyncing: isRunning,
        connectedDevices,
        pendingDevices,
        nextScheduledSync: nextSync?.nextSyncAt || null,
    };
};

/**
 * Force sync all devices (admin function)
 */
const forceSyncAll = async () => {
    // Reset all next sync times to now
    await DeviceConnection.updateMany(
        { isConnected: true, 'syncConfig.enabled': true },
        { $set: { nextSyncAt: new Date() } }
    );

    // Trigger sync
    await processDeviceSync();

    return { message: 'Force sync initiated for all devices' };
};

module.exports = {
    startScheduler,
    stopScheduler,
    getSchedulerStatus,
    forceSyncAll,
    processDeviceSync,
};

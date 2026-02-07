/**
 * Smart Care Nudge Controller - Phase 2
 * With effectiveness tracking endpoints
 */
const asyncHandler = require('../../utils/asyncHandler');
const careNudgeService = require('../../services/patient/careNudge.service');

// @desc    Get active care nudges
// @route   GET /api/v1/patient/nudges
// @access  Private (Patient)
exports.getNudges = asyncHandler(async (req, res) => {
    const nudges = await careNudgeService.getActiveNudges(req.patient._id);

    // Mark all fetched nudges as viewed
    await Promise.all(
        nudges.map(n => careNudgeService.markNudgeViewed(n._id))
    );

    res.status(200).json({
        success: true,
        count: nudges.length,
        data: nudges,
    });
});

// @desc    Respond to a nudge (done/dismissed) with feedback
// @route   PUT /api/v1/patient/nudges/:id/respond
// @access  Private (Patient)
exports.respondToNudge = asyncHandler(async (req, res) => {
    const { status, feedback } = req.body; // status: 'done' or 'dismissed', feedback: optional string

    if (!['done', 'dismissed'].includes(status)) {
        return res.status(400).json({ success: false, error: 'Invalid status. Use "done" or "dismissed".' });
    }

    const nudge = await careNudgeService.respondToNudge(req.params.id, status, feedback);

    if (!nudge) {
        return res.status(404).json({ success: false, error: 'Nudge not found' });
    }

    res.status(200).json({
        success: true,
        data: nudge,
    });
});

// @desc    Track when user clicks the action button on a nudge
// @route   PUT /api/v1/patient/nudges/:id/action-click
// @access  Private (Patient)
exports.trackActionClick = asyncHandler(async (req, res) => {
    const nudge = await careNudgeService.trackActionClick(req.params.id);

    if (!nudge) {
        return res.status(404).json({ success: false, error: 'Nudge not found' });
    }

    res.status(200).json({
        success: true,
        data: nudge,
    });
});

// @desc    Track when user completes the intended action from a nudge
// @route   PUT /api/v1/patient/nudges/:id/action-completed
// @access  Private (Patient)
exports.trackActionCompleted = asyncHandler(async (req, res) => {
    const nudge = await careNudgeService.trackActionCompleted(req.params.id);

    if (!nudge) {
        return res.status(404).json({ success: false, error: 'Nudge not found' });
    }

    res.status(200).json({
        success: true,
        data: nudge,
    });
});

// @desc    Submit feedback on a nudge (helpful/not helpful)
// @route   PUT /api/v1/patient/nudges/:id/feedback
// @access  Private (Patient)
exports.submitFeedback = asyncHandler(async (req, res) => {
    const { feedback } = req.body; // 'helpful' or 'not_helpful'

    if (!['helpful', 'not_helpful'].includes(feedback)) {
        return res.status(400).json({ success: false, error: 'Invalid feedback. Use "helpful" or "not_helpful".' });
    }

    const CareNudge = require('../../models/CareNudge');
    const nudge = await CareNudge.findByIdAndUpdate(
        req.params.id,
        { 'effectiveness.feedback': feedback },
        { new: true }
    );

    if (!nudge) {
        return res.status(404).json({ success: false, error: 'Nudge not found' });
    }

    res.status(200).json({
        success: true,
        data: nudge,
    });
});

// @desc    Get nudge effectiveness analytics
// @route   GET /api/v1/patient/nudges/analytics
// @access  Private (Patient)
exports.getEffectivenessAnalytics = asyncHandler(async (req, res) => {
    const stats = await careNudgeService.getEffectivenessStats(req.patient._id);

    res.status(200).json({
        success: true,
        data: stats,
    });
});

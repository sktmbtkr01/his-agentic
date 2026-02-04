/**
 * Care Nudge Controller
 */
const asyncHandler = require('../../utils/asyncHandler');
const careNudgeService = require('../../services/patient/careNudge.service');

// @desc    Get active care nudges
// @route   GET /api/v1/patient/nudges
// @access  Private (Patient)
exports.getNudges = asyncHandler(async (req, res) => {
    const nudges = await careNudgeService.getActiveNudges(req.patient._id);

    res.status(200).json({
        success: true,
        count: nudges.length,
        data: nudges
    });
});

// @desc    Respond to a nudge
// @route   PUT /api/v1/patient/nudges/:id/respond
// @access  Private (Patient)
exports.respondToNudge = asyncHandler(async (req, res) => {
    const { status } = req.body; // 'done' or 'dismissed'

    if (!['done', 'dismissed'].includes(status)) {
        return res.status(400).json({ success: false, error: 'Invalid status' });
    }

    const nudge = await careNudgeService.respondToNudge(req.params.id, status);

    if (!nudge) {
        return res.status(404).json({ success: false, error: 'Nudge not found' });
    }

    res.status(200).json({
        success: true,
        data: nudge
    });
});

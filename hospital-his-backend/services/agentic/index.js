/**
 * Agentic Tools Index
 * 
 * This exports all the agentic tools for the Wellness Agent V2.
 * 
 * ARCHITECTURE OVERVIEW:
 * 
 * ┌─────────────────────────────────────────────────────────────────┐
 * │                   AGENTIC NUDGE SYSTEM V2                       │
 * ├─────────────────────────────────────────────────────────────────┤
 * │                                                                 │
 * │  ┌─────────────────────────────────────────────────────────┐   │
 * │  │          WellnessAgentOrchestrator                       │   │
 * │  │       (Coordinates the entire flow)                      │   │
 * │  └─────────────────────────────────────────────────────────┘   │
 * │                            │                                    │
 * │     ┌──────────────────────┼──────────────────────┐            │
 * │     │                      │                      │            │
 * │     ▼                      ▼                      ▼            │
 * │  ┌──────────┐       ┌────────────┐        ┌───────────┐       │
 * │  │ Context  │  ───► │   Risk     │  ───►  │   Nudge   │       │
 * │  │  Tool    │       │ Assessment │        │ Selection │       │
 * │  │          │       │   Tool     │        │  (ML)     │       │
 * │  │ Extracts │       │ Identifies │        │ Scores &  │       │
 * │  │ Features │       │  Concerns  │        │  Picks    │       │
 * │  └──────────┘       └────────────┘        └───────────┘       │
 * │                                                │               │
 * │                      ┌─────────────────────────┘               │
 * │                      ▼                                         │
 * │               ┌────────────┐        ┌───────────────┐         │
 * │               │  Message   │  ───►  │   Outcome     │         │
 * │               │ Generation │        │   Tracking    │         │
 * │               │   (LLM)    │        │   (Learning)  │         │
 * │               │            │        │               │         │
 * │               │ Writes     │        │ Logs events   │         │
 * │               │ Personalized│       │ for ML        │         │
 * │               └────────────┘        └───────────────┘         │
 * │                                                                │
 * └─────────────────────────────────────────────────────────────────┘
 * 
 * USAGE:
 * 
 * const { Orchestrator } = require('./services/agentic');
 * const result = await Orchestrator.runNudgeAgent(patientId);
 * 
 * Or individual tools:
 * 
 * const { ContextTool, RiskAssessmentTool } = require('./services/agentic');
 * const context = await ContextTool.execute(patientId);
 * const risks = RiskAssessmentTool.execute(context.features);
 */

const ContextTool = require('./ContextTool');
const RiskAssessmentTool = require('./RiskAssessmentTool');
const NudgeSelectionTool = require('./NudgeSelectionTool');
const MessageGenerationTool = require('./MessageGenerationTool');
const OutcomeTrackingTool = require('./OutcomeTrackingTool');
const Orchestrator = require('./WellnessAgentOrchestrator');

module.exports = {
    // Main orchestrator (primary entry point)
    Orchestrator,
    WellnessAgentOrchestrator: Orchestrator,
    
    // Individual tools (for testing/custom flows)
    ContextTool,
    RiskAssessmentTool,
    NudgeSelectionTool,
    MessageGenerationTool,
    OutcomeTrackingTool,
    
    // Convenience function
    runNudgeAgent: (patientId, options) => Orchestrator.runNudgeAgent(patientId, options),
};

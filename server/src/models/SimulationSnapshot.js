import mongoose from 'mongoose';

/**
 * SimulationSnapshot captures persistent point-in-time snapshots of a civilization
 * for long-term historical records, rollbacks, and recovery without mutating the main World document.
 */
export const SimulationSnapshotSchema = new mongoose.Schema(
  {
    worldId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'World',
      required: true,
      index: true,
    },
    tick: {
      type: Number,
      required: true,
      index: true,
    },
    label: {
      type: String,
      trim: true,
      default: 'auto_checkpoint',
    },
    simulatedTime: {
      type: Date,
      default: Date.now,
    },
    metrics: {
      population: { type: Number, default: 0 },
      employed: { type: Number, default: 0 },
      gdp: { type: Number, default: 0 },
      treasury: { type: Number, default: 0 },
      satisfaction: { type: Number, default: 100 },
      health: { type: Number, default: 100 },
    },
    resources: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({}),
    },
    economy: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({}),
    },
    agentCount: {
      type: Number,
      default: 0,
    },
    buildingCount: {
      type: Number,
      default: 0,
    },
    rawStateSummary: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({}),
    },
  },
  {
    timestamps: true,
  }
);

SimulationSnapshotSchema.index({ worldId: 1, tick: -1 });

export const SimulationSnapshot = mongoose.model('SimulationSnapshot', SimulationSnapshotSchema);


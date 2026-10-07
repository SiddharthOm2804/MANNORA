import mongoose from 'mongoose';

/**
 * MemoryRecord subdocument schema representing individual cognitive/experiential memories.
 */
export const MemoryRecordSchema = new mongoose.Schema(
  {
    memoryId: {
      type: String,
      required: [true, 'Memory identifier is required'],
      trim: true,
    },
    event: {
      type: String,
      required: [true, 'Memory event or context description is required'],
      trim: true,
      maxlength: [1000, 'Memory event cannot exceed 1000 characters'],
    },
    importance: {
      type: Number,
      default: 0.5,
      min: [0, 'Importance score cannot be less than 0'],
      max: [1, 'Importance score cannot exceed 1'],
    },
    tick: {
      type: Number,
      default: 0,
      min: [0, 'Simulation tick cannot be negative'],
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({}),
    },
  },
  { _id: true }
);

/**
 * Trait subdocument schema capturing deterministic personality, behavioral, and socio-economic attributes.
 */
export const TraitSchema = new mongoose.Schema(
  {
    rationality: {
      type: Number,
      default: 0.5,
      min: [0, 'Trait values must be between 0 and 1'],
      max: [1, 'Trait values must be between 0 and 1'],
    },
    ambition: {
      type: Number,
      default: 0.5,
      min: [0, 'Trait values must be between 0 and 1'],
      max: [1, 'Trait values must be between 0 and 1'],
    },
    riskTolerance: {
      type: Number,
      default: 0.5,
      min: [0, 'Trait values must be between 0 and 1'],
      max: [1, 'Trait values must be between 0 and 1'],
    },
    socialAffinity: {
      type: Number,
      default: 0.5,
      min: [0, 'Trait values must be between 0 and 1'],
      max: [1, 'Trait values must be between 0 and 1'],
    },
    productivity: {
      type: Number,
      default: 0.5,
      min: [0, 'Trait values must be between 0 and 1'],
      max: [1, 'Trait values must be between 0 and 1'],
    },
    openness: {
      type: Number,
      default: 0.5,
      min: [0, 'Trait values must be between 0 and 1'],
      max: [1, 'Trait values must be between 0 and 1'],
    },
    conscientiousness: {
      type: Number,
      default: 0.5,
      min: [0, 'Trait values must be between 0 and 1'],
      max: [1, 'Trait values must be between 0 and 1'],
    },
    adaptability: {
      type: Number,
      default: 0.5,
      min: [0, 'Trait values must be between 0 and 1'],
      max: [1, 'Trait values must be between 0 and 1'],
    },
  },
  { _id: false }
);

/**
 * Agent Location subdocument schema.
 */
export const AgentLocationSchema = new mongoose.Schema(
  {
    x: {
      type: Number,
      default: 50,
    },
    y: {
      type: Number,
      default: 50,
    },
    cityId: {
      type: String,
      default: null,
      trim: true,
    },
    sector: {
      type: String,
      default: 'Core Sector',
      trim: true,
    },
  },
  { _id: false }
);

/**
 * Dynamic Agent State subdocument schema.
 */
export const AgentStateSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ['active', 'idle', 'working', 'resting', 'migrating', 'deceased'],
      default: 'active',
    },
    health: {
      type: Number,
      default: 100,
      min: [0, 'Health cannot fall below 0'],
      max: [100, 'Health cannot exceed 100'],
    },
    happiness: {
      type: Number,
      default: 100,
      min: [0, 'Happiness cannot fall below 0'],
      max: [100, 'Happiness cannot exceed 100'],
    },
    energy: {
      type: Number,
      default: 100,
      min: [0, 'Energy cannot fall below 0'],
      max: [100, 'Energy cannot exceed 100'],
    },
    wealth: {
      type: Number,
      default: 50,
      min: [0, 'Wealth cannot be negative'],
    },
    currentAction: {
      type: String,
      default: 'IDLE',
      trim: true,
    },
    location: {
      type: AgentLocationSchema,
      default: () => ({}),
    },
  },
  { _id: false }
);

/**
 * Primary Agent Mongoose Schema.
 * Represents an individual citizen/agent entity belonging to a specific World.
 */
export const AgentSchema = new mongoose.Schema(
  {
    agentId: {
      type: String,
      required: [true, 'Agent ID is required'],
      trim: true,
    },
    worldId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'World',
      required: [true, 'World reference ID is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Agent name is required'],
      trim: true,
      minlength: [2, 'Agent name must be at least 2 characters'],
      maxlength: [100, 'Agent name cannot exceed 100 characters'],
    },
    role: {
      type: String,
      enum: ['CITIZEN', 'MERCHANT', 'GOVERNOR', 'ENGINEER', 'OBSERVER', 'SCIENTIST'],
      default: 'CITIZEN',
      trim: true,
    },
    state: {
      type: AgentStateSchema,
      default: () => ({}),
    },
    traits: {
      type: TraitSchema,
      default: () => ({}),
    },
    memoryRecords: {
      type: [MemoryRecordSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for memory record count
AgentSchema.virtual('memoryCount').get(function () {
  return this.memoryRecords ? this.memoryRecords.length : 0;
});

// Indexes for fast lookup within a world
AgentSchema.index({ worldId: 1, agentId: 1 }, { unique: true });
AgentSchema.index({ worldId: 1, role: 1 });
AgentSchema.index({ worldId: 1, 'state.status': 1 });
AgentSchema.index({ createdAt: -1 });

export const Agent = mongoose.models.Agent || mongoose.model('Agent', AgentSchema);
export default Agent;

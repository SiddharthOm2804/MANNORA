import mongoose from 'mongoose';

const CitySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'City name is required'],
      trim: true,
    },
    population: {
      type: Number,
      default: 0,
      min: [0, 'City population cannot be negative'],
    },
    isCapital: {
      type: Boolean,
      default: false,
    },
    coordinates: {
      x: { type: Number, default: 50 },
      y: { type: Number, default: 50 },
    },
    specialization: {
      type: String,
      default: 'General Industrial & Residential',
      trim: true,
    },
  },
  { _id: true }
);

const GeographySchema = new mongoose.Schema(
  {
    biome: {
      type: String,
      default: 'Cybernetic Basin',
      trim: true,
    },
    terrain: {
      type: String,
      default: 'Mixed Terraces & Plains',
      trim: true,
    },
    climate: {
      type: String,
      default: 'Regulated Microclimate',
      trim: true,
    },
    landArea: {
      type: Number,
      default: 10000, // sq km
    },
    waterPercentage: {
      type: Number,
      default: 30, // 0 - 100
      min: 0,
      max: 100,
    },
  },
  { _id: false }
);

const ResourcesSchema = new mongoose.Schema(
  {
    energy: {
      type: Number,
      default: 5000,
      min: 0,
    },
    minerals: {
      type: Number,
      default: 2500,
      min: 0,
    },
    water: {
      type: Number,
      default: 5000,
      min: 0,
    },
    agriculture: {
      type: Number,
      default: 3000,
      min: 0,
    },
    technology: {
      type: Number,
      default: 1000,
      min: 0,
    },
  },
  { _id: false }
);

const EconomyConfigurationSchema = new mongoose.Schema(
  {
    startingMoney: {
      type: Number,
      required: [true, 'Starting capital is required'],
      default: 500000,
      min: [0, 'Starting money cannot be negative'],
    },
    currencyName: {
      type: String,
      default: 'Neural Credits',
      trim: true,
    },
    currencySymbol: {
      type: String,
      default: 'NC',
      trim: true,
    },
    taxRate: {
      type: Number,
      default: 0.15,
      min: 0,
      max: 1,
    },
    industries: {
      type: [String],
      default: ['Energy', 'Manufacturing', 'Advanced Technology'],
    },
  },
  { _id: false }
);

const GovernmentConfigurationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: [true, 'Government type is required'],
      default: 'Technocracy',
      trim: true,
    },
    stabilityIndex: {
      type: Number,
      default: 85,
      min: 0,
      max: 100,
    },
    corruptionIndex: {
      type: Number,
      default: 10,
      min: 0,
      max: 100,
    },
    regulatoryStrictness: {
      type: Number,
      default: 60,
      min: 0,
      max: 100,
    },
  },
  { _id: false }
);

const SimulationSettingsSchema = new mongoose.Schema(
  {
    speed: {
      type: Number,
      default: 1,
      min: 0.1,
      max: 10,
    },
    tickRate: {
      type: Number,
      default: 10,
      min: 1,
      max: 60,
    },
    startingDate: {
      type: Date,
      default: () => new Date('2085-01-01T00:00:00.000Z'),
    },
    seed: {
      type: Number,
      default: () => Math.floor(Math.random() * 90000000) + 10000000,
    },
    currentTick: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ['initialized', 'running', 'paused', 'completed'],
      default: 'initialized',
    },
  },
  { _id: false }
);

const WorldSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'World designation name is required'],
      trim: true,
      minlength: [3, 'World name must be at least 3 characters'],
      maxlength: [100, 'World name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    population: {
      type: Number,
      required: [true, 'Total population count is required'],
      min: [1, 'Population must be at least 1 citizen'],
      default: 1000,
    },
    geography: {
      type: GeographySchema,
      default: () => ({}),
    },
    resources: {
      type: ResourcesSchema,
      default: () => ({}),
    },
    cities: {
      type: [CitySchema],
      default: [],
    },
    economyConfiguration: {
      type: EconomyConfigurationSchema,
      default: () => ({}),
    },
    governmentConfiguration: {
      type: GovernmentConfigurationSchema,
      default: () => ({}),
    },
    simulationSettings: {
      type: SimulationSettingsSchema,
      default: () => ({}),
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for city count
WorldSchema.virtual('cityCount').get(function () {
  return this.cities ? this.cities.length : 0;
});

// Index for fast search and listing
WorldSchema.index({ name: 1 });
WorldSchema.index({ createdAt: -1 });

export const World = mongoose.model('World', WorldSchema);
export default World;

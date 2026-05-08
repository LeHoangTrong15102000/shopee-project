import mongoose, { Schema } from 'mongoose'

interface ISearchHistory {
  user: mongoose.Types.ObjectId
  keyword: string
  searchCount: number
  lastSearched: Date
  resultsCount?: number
  createdAt: Date
  updatedAt: Date
}

const SearchHistorySchema = new Schema<ISearchHistory>(
  {
    user: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'users',
      required: true,
      index: true,
    },
    keyword: {
      type: String,
      required: true,
      maxlength: 200,
      trim: true,
    },
    searchCount: {
      type: Number,
      default: 1,
      min: 1,
    },
    resultsCount: {
      type: Number,
      default: null,
    },
    lastSearched: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  },
)

// Compound unique index: user + keyword
SearchHistorySchema.index({ user: 1, keyword: 1 }, { unique: true })

// Index for sorting by lastSearched
SearchHistorySchema.index({ user: 1, lastSearched: -1 })

// Indexes for admin search analytics aggregations
SearchHistorySchema.index({ keyword: 1, createdAt: -1 })
SearchHistorySchema.index({ createdAt: -1 })
SearchHistorySchema.index({ searchCount: -1 })

export const SearchHistoryModel = mongoose.model<ISearchHistory>(
  'search_histories',
  SearchHistorySchema,
)

export { ISearchHistory }

import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

// Define types
interface Tier {
  id: string;
  name: string;
  description: string;
  spendThreshold: number;
  cardDesign: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface TierState {
  tiers: Tier[];
  selectedTier: Tier | null;
  isLoading: boolean;
  error: string | null;
}

// Initial state
const initialState: TierState = {
  tiers: [],
  selectedTier: null,
  isLoading: false,
  error: null,
};

// Async thunks
export const fetchTiers = createAsyncThunk(
  "tiers/fetchTiers",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get("/api/v1/tiers");
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch tiers"
      );
    }
  }
);

export const fetchTierById = createAsyncThunk(
  "tiers/fetchTierById",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/api/v1/tiers/${id}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch tier"
      );
    }
  }
);

export const createTier = createAsyncThunk(
  "tiers/createTier",
  async (
    tierData: Omit<Tier, "id" | "createdAt" | "updatedAt">,
    { rejectWithValue }
  ) => {
    try {
      const response = await axios.post("/api/v1/tiers", tierData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create tier"
      );
    }
  }
);

export const updateTier = createAsyncThunk(
  "tiers/updateTier",
  async (
    { id, tierData }: { id: string; tierData: Partial<Tier> },
    { rejectWithValue }
  ) => {
    try {
      const response = await axios.put(`/api/v1/tiers/${id}`, tierData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update tier"
      );
    }
  }
);

export const deleteTier = createAsyncThunk(
  "tiers/deleteTier",
  async (id: string, { rejectWithValue }) => {
    try {
      await axios.delete(`/api/v1/tiers/${id}`);
      return id;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete tier"
      );
    }
  }
);

// Create slice
const tierSlice = createSlice({
  name: "tiers",
  initialState,
  reducers: {
    clearSelectedTier: (state) => {
      state.selectedTier = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Tiers
      .addCase(fetchTiers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        fetchTiers.fulfilled,
        (state, action: PayloadAction<Tier[]>) => {
          state.isLoading = false;
          state.tiers = action.payload;
        }
      )
      .addCase(fetchTiers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Fetch Tier By Id
      .addCase(fetchTierById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        fetchTierById.fulfilled,
        (state, action: PayloadAction<Tier>) => {
          state.isLoading = false;
          state.selectedTier = action.payload;
        }
      )
      .addCase(fetchTierById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Create Tier
      .addCase(createTier.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        createTier.fulfilled,
        (state, action: PayloadAction<Tier>) => {
          state.isLoading = false;
          state.tiers.push(action.payload);
        }
      )
      .addCase(createTier.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Update Tier
      .addCase(updateTier.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        updateTier.fulfilled,
        (state, action: PayloadAction<Tier>) => {
          state.isLoading = false;
          const index = state.tiers.findIndex(
            (tier) => tier.id === action.payload.id
          );
          if (index !== -1) {
            state.tiers[index] = action.payload;
          }
          if (
            state.selectedTier &&
            state.selectedTier.id === action.payload.id
          ) {
            state.selectedTier = action.payload;
          }
        }
      )
      .addCase(updateTier.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Delete Tier
      .addCase(deleteTier.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        deleteTier.fulfilled,
        (state, action: PayloadAction<string>) => {
          state.isLoading = false;
          state.tiers = state.tiers.filter(
            (tier) => tier.id !== action.payload
          );
          if (
            state.selectedTier &&
            state.selectedTier.id === action.payload
          ) {
            state.selectedTier = null;
          }
        }
      )
      .addCase(deleteTier.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearSelectedTier, clearError } = tierSlice.actions;

export default tierSlice.reducer;

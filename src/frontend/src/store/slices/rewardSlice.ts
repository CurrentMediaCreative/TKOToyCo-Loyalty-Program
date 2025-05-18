import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

// Define types
interface Reward {
  id: string;
  name: string;
  description: string;
  rewardType: string;
  rewardValue: any;
  tierId: string;
  isActive: boolean;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
}

interface RewardState {
  rewards: Reward[];
  selectedReward: Reward | null;
  isLoading: boolean;
  error: string | null;
}

// Initial state
const initialState: RewardState = {
  rewards: [],
  selectedReward: null,
  isLoading: false,
  error: null,
};

// Async thunks
export const fetchRewards = createAsyncThunk(
  "rewards/fetchRewards",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get("/api/v1/rewards");
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch rewards"
      );
    }
  }
);

export const fetchRewardById = createAsyncThunk(
  "rewards/fetchRewardById",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/api/v1/rewards/${id}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch reward"
      );
    }
  }
);

export const createReward = createAsyncThunk(
  "rewards/createReward",
  async (
    rewardData: Omit<Reward, "id" | "createdAt" | "updatedAt">,
    { rejectWithValue }
  ) => {
    try {
      const response = await axios.post("/api/v1/rewards", rewardData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create reward"
      );
    }
  }
);

export const updateReward = createAsyncThunk(
  "rewards/updateReward",
  async (
    { id, rewardData }: { id: string; rewardData: Partial<Reward> },
    { rejectWithValue }
  ) => {
    try {
      const response = await axios.put(`/api/v1/rewards/${id}`, rewardData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update reward"
      );
    }
  }
);

export const deleteReward = createAsyncThunk(
  "rewards/deleteReward",
  async (id: string, { rejectWithValue }) => {
    try {
      await axios.delete(`/api/v1/rewards/${id}`);
      return id;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete reward"
      );
    }
  }
);

// Create slice
const rewardSlice = createSlice({
  name: "rewards",
  initialState,
  reducers: {
    clearSelectedReward: (state) => {
      state.selectedReward = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Rewards
      .addCase(fetchRewards.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        fetchRewards.fulfilled,
        (state, action: PayloadAction<Reward[]>) => {
          state.isLoading = false;
          state.rewards = action.payload;
        }
      )
      .addCase(fetchRewards.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Fetch Reward By Id
      .addCase(fetchRewardById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        fetchRewardById.fulfilled,
        (state, action: PayloadAction<Reward>) => {
          state.isLoading = false;
          state.selectedReward = action.payload;
        }
      )
      .addCase(fetchRewardById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Create Reward
      .addCase(createReward.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        createReward.fulfilled,
        (state, action: PayloadAction<Reward>) => {
          state.isLoading = false;
          state.rewards.push(action.payload);
        }
      )
      .addCase(createReward.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Update Reward
      .addCase(updateReward.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        updateReward.fulfilled,
        (state, action: PayloadAction<Reward>) => {
          state.isLoading = false;
          const index = state.rewards.findIndex(
            (reward) => reward.id === action.payload.id
          );
          if (index !== -1) {
            state.rewards[index] = action.payload;
          }
          if (
            state.selectedReward &&
            state.selectedReward.id === action.payload.id
          ) {
            state.selectedReward = action.payload;
          }
        }
      )
      .addCase(updateReward.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Delete Reward
      .addCase(deleteReward.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        deleteReward.fulfilled,
        (state, action: PayloadAction<string>) => {
          state.isLoading = false;
          state.rewards = state.rewards.filter(
            (reward) => reward.id !== action.payload
          );
          if (
            state.selectedReward &&
            state.selectedReward.id === action.payload
          ) {
            state.selectedReward = null;
          }
        }
      )
      .addCase(deleteReward.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearSelectedReward, clearError } = rewardSlice.actions;

export default rewardSlice.reducer;

import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

// Define types
interface Customer {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  birthDate: string;
  loyaltyTierId: string;
  loyaltyPoints: number;
  totalSpent: number;
  lastPurchaseDate: string;
  createdAt: string;
  updatedAt: string;
}

interface CustomerState {
  customers: Customer[];
  selectedCustomer: Customer | null;
  isLoading: boolean;
  error: string | null;
}

// Initial state
const initialState: CustomerState = {
  customers: [],
  selectedCustomer: null,
  isLoading: false,
  error: null,
};

// Async thunks
export const fetchCustomers = createAsyncThunk(
  "customers/fetchCustomers",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get("/api/v1/customers");
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch customers"
      );
    }
  }
);

export const fetchCustomerById = createAsyncThunk(
  "customers/fetchCustomerById",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/api/v1/customers/${id}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch customer"
      );
    }
  }
);

export const createCustomer = createAsyncThunk(
  "customers/createCustomer",
  async (
    customerData: Omit<Customer, "id" | "createdAt" | "updatedAt">,
    { rejectWithValue }
  ) => {
    try {
      const response = await axios.post("/api/v1/customers", customerData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create customer"
      );
    }
  }
);

export const updateCustomer = createAsyncThunk(
  "customers/updateCustomer",
  async (
    { id, customerData }: { id: string; customerData: Partial<Customer> },
    { rejectWithValue }
  ) => {
    try {
      const response = await axios.put(`/api/v1/customers/${id}`, customerData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update customer"
      );
    }
  }
);

export const deleteCustomer = createAsyncThunk(
  "customers/deleteCustomer",
  async (id: string, { rejectWithValue }) => {
    try {
      await axios.delete(`/api/v1/customers/${id}`);
      return id;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete customer"
      );
    }
  }
);

// Create slice
const customerSlice = createSlice({
  name: "customers",
  initialState,
  reducers: {
    clearSelectedCustomer: (state) => {
      state.selectedCustomer = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Customers
      .addCase(fetchCustomers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        fetchCustomers.fulfilled,
        (state, action: PayloadAction<Customer[]>) => {
          state.isLoading = false;
          state.customers = action.payload;
        }
      )
      .addCase(fetchCustomers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Fetch Customer By Id
      .addCase(fetchCustomerById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        fetchCustomerById.fulfilled,
        (state, action: PayloadAction<Customer>) => {
          state.isLoading = false;
          state.selectedCustomer = action.payload;
        }
      )
      .addCase(fetchCustomerById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Create Customer
      .addCase(createCustomer.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        createCustomer.fulfilled,
        (state, action: PayloadAction<Customer>) => {
          state.isLoading = false;
          state.customers.push(action.payload);
        }
      )
      .addCase(createCustomer.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Update Customer
      .addCase(updateCustomer.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        updateCustomer.fulfilled,
        (state, action: PayloadAction<Customer>) => {
          state.isLoading = false;
          const index = state.customers.findIndex(
            (customer) => customer.id === action.payload.id
          );
          if (index !== -1) {
            state.customers[index] = action.payload;
          }
          if (
            state.selectedCustomer &&
            state.selectedCustomer.id === action.payload.id
          ) {
            state.selectedCustomer = action.payload;
          }
        }
      )
      .addCase(updateCustomer.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Delete Customer
      .addCase(deleteCustomer.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        deleteCustomer.fulfilled,
        (state, action: PayloadAction<string>) => {
          state.isLoading = false;
          state.customers = state.customers.filter(
            (customer) => customer.id !== action.payload
          );
          if (
            state.selectedCustomer &&
            state.selectedCustomer.id === action.payload
          ) {
            state.selectedCustomer = null;
          }
        }
      )
      .addCase(deleteCustomer.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearSelectedCustomer, clearError } = customerSlice.actions;

export default customerSlice.reducer;

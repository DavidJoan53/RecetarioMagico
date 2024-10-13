import { createAsyncThunk, createSlice } from "@reduxjs/toolkit"
import { RootState } from "../store";

interface NavigationState {
	isNewGroupOpen: boolean;
}

export const initialState: NavigationState = {
	isNewGroupOpen: false,
}

export const sharedExtraReducers = (builder) => {}

export const navigationSlice = createSlice({
	name: "navigation",
  initialState,
  extraReducers: sharedExtraReducers,
  reducers: {
		setIsNewGroupOpen: (state, action) => {
			state.isNewGroupOpen = action.payload
		}
	},
})

export const { setIsNewGroupOpen } = navigationSlice.actions

export default navigationSlice.reducer

// ------------------SELECTORS-------------
export const selectIsNewGroupOpen = (state: RootState) => state.navigation.isNewGroupOpen
import { configureStore } from '@reduxjs/toolkit';

const placeholderReducer = (state = {}) => state;

export const store = configureStore({
  reducer: {
    app: placeholderReducer
  }
});

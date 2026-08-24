import { configureStore } from '@reduxjs/toolkit';

import { temperatureApi } from '../api/temperatureApi';

export const store = configureStore({
  reducer: {
    [temperatureApi.reducerPath]: temperatureApi.reducer,
  },

  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(temperatureApi.middleware),
});

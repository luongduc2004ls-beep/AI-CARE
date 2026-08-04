import { getData, saveData } from "./localStorageService";

// ============================
// Storage Configuration
// ============================

const ACTIVITIES_STORAGE_KEY = "ai-care-activities";

// ============================
// Read Functions
// ============================

const getActivities = () => {
  const storedActivities = getData(ACTIVITIES_STORAGE_KEY);

  return Array.isArray(storedActivities) ? storedActivities : [];
};

// ============================
// Activity Functions
// ============================

const addActivity = (type, medicineName) => {
  const newActivity = {
    id: `${Date.now()}-${Math.random()}`,
    type,
    medicineName,
    createdAt: new Date().toISOString(),
  };
  const updatedActivities = [newActivity, ...getActivities()];

  saveData(ACTIVITIES_STORAGE_KEY, updatedActivities);
  return updatedActivities;
};

export { addActivity, getActivities };

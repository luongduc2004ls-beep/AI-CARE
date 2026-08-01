// Storage layer: this file only reads, writes, removes, and clears browser storage.

const getData = (key) => {
  try {
    const storedValue = localStorage.getItem(key);

    return storedValue ? JSON.parse(storedValue) : null;
  } catch (error) {
    console.error(`Unable to read LocalStorage key: ${key}`, error);
    return null;
  }
};

const saveData = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error(`Unable to save LocalStorage key: ${key}`, error);
    return false;
  }
};

const removeData = (key) => {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Unable to remove LocalStorage key: ${key}`, error);
    return false;
  }
};

const clearAll = () => {
  try {
    localStorage.clear();
    return true;
  } catch (error) {
    console.error("Unable to clear LocalStorage", error);
    return false;
  }
};

export { getData, saveData, removeData, clearAll };

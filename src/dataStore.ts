import { DataStore } from './interface';

let data: DataStore = {
  users: [],
  quizzes: [],
  quizzesTrash: [],
  sessions: [],
  recentUserId: 1,
  recentQuizId: 1,
  recentQuestionId: 1,
  recentAnswerId: 1,
  usedSessionNumbers: [],
};

/**
 * Retrieves the current state of the data store.
 *
 * @returns {DataStore} The current data stored in the DataStore object.
 */
function getData(): DataStore {
  return data;
}

/**
 * Updates the data store with new data.
 *
 * @param {DataStore} newData - The new data to be stored, replacing the existing data.
 */
function setData(newData: DataStore) {
  data = newData;
}

export { getData, setData };

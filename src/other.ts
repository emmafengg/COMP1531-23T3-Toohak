// by group AERO 18/9/2023

import { getData, setData } from './dataStore';
import { EmptyObjectReturn } from './interface';
import { removeCSV } from './support';

/**
 * Reset the state of the application back to the start.
 * Also remove all saved CSV file.
 *
 * @param -no parameters
 * @returns {EmptyObjectReturn} -empty object
 */
export function clear(): EmptyObjectReturn {
  const data = getData();

  data.users = [];
  data.quizzes = [];
  data.quizzesTrash = [];
  data.sessions = [];
  data.recentUserId = 1;
  data.recentQuizId = 1;
  data.recentQuestionId = 1;
  data.recentAnswerId = 1;
  data.usedSessionNumbers = [];

  removeCSV();

  setData(data);
  return {};
}

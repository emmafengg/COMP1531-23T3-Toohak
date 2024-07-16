// Functions with adminQuizList, adminQuizCreate,
// adminQuizDescriptionUpdate, adminQuizRemove,
// adminQuizInfo and adminQuizDescriptionUpdate
//
// By group AERO
// From 18/9/23

import { getData, setData } from './dataStore';
import { Quiz, SingleErrorObject, SessionState } from './interface';
import {
  EmptyObjectReturn, ErrorObject, AdminQuizCreateReturn, AdminTrashQuizzesReturn,
  AdminQuizInfoReturn, AdminQuizInfoReturnV2, AdminQuizListReturn
} from './interface';
import {
  tokenCheck, quizNameCheck, quizNameLengthCheck, quizDescriptionLengthCheck, quizFindCheck,
  forbiddenCheck, trashForbiddenCheck, thumbnailValidCheck, THUMBNAIL_INVALID_ERROR
} from './support';
import { QUIZ_NAME_ERROR, QUIZ_DESCRIPTION_ERROR, QUIZ_NAME_LENGTH_ERROR } from './support';

/**
 * Function that creates new quiz for given user and returns its quizId
 *
 * @param {string} token - identifier for the admin user
 * @param {string} name - name of the quiz
 * @param {string} description - describes quiz
 * @returns {AdminQuizCreateReturn | SingleErrorObject} quizId (success) or error string
 */
export function adminQuizCreate(token: string, name: string, description: string): AdminQuizCreateReturn | SingleErrorObject {
  if (!quizNameCheck(name)) {
    return QUIZ_NAME_ERROR;
  } else if (!quizNameLengthCheck(name)) {
    return QUIZ_NAME_LENGTH_ERROR;
  } else if (!quizDescriptionLengthCheck(description)) {
    return QUIZ_DESCRIPTION_ERROR;
  }

  const data = getData();
  const user = tokenCheck(token);
  // inside array finds the quiz name that matches up with given one
  // if values satisfy will return the value in if statement and therefore return error msg
  if (data.quizzes.find((quiz) => quiz.name === name && quiz.authUserId === user.authUserId)) {
    return { error: 'name of quiz has already been used' };
  }

  // increment the quizId as set in dataStore
  data.recentQuizId += 1;

  const quizId = data.recentQuizId;

  // set timeCreated and LastEdited to current time
  const timeCreated = Math.floor(Date.now() / 1000);
  const timeLastEdited = timeCreated;

  // assign new quiz userId used for adminQuizList function
  const newQuiz: Quiz = {
    authUserId: user.authUserId,
    quizId,
    name,
    timeCreated,
    timeLastEdited,
    description,
    numQuestions: 0,
    questions: [],
    questionsTrash: [],
    duration: 0,
  };

  // add newQuiz to array
  data.quizzes.push(newQuiz);
  setData(data);

  // return the new quizId
  return {
    quizId,
  };
}

/**
 * Creates a new quiz for an admin user based on provided name and description.
 * Validates the quiz name and description, checks for existing quizzes with the same name,
 * and then adds the new quiz to the data store. Returns the new quiz ID or an error object.
 *
 * @param {string} token - Admin user's authentication token.
 * @param {string} name - Name of the new quiz.
 * @param {string} description - Description of the new quiz.
 * @returns {AdminQuizCreateReturn | SingleErrorObject} - The new quiz ID on success or an error object on failure.
 */
export function adminQuizCreateV2(token: string, name: string, description: string): AdminQuizCreateReturn | SingleErrorObject {
  if (!quizNameCheck(name)) {
    return QUIZ_NAME_ERROR;
  } else if (!quizNameLengthCheck(name)) {
    return QUIZ_NAME_LENGTH_ERROR;
  } else if (!quizDescriptionLengthCheck(description)) {
    return QUIZ_DESCRIPTION_ERROR;
  }

  const data = getData();
  const user = tokenCheck(token);
  // inside array finds the quiz name that matches up with given one
  // if values satisfy will return the value in if statement and therefore return error msg
  if (data.quizzes.find((quiz) => quiz.name === name && quiz.authUserId === user.authUserId)) {
    return { error: 'name of quiz has already been used' };
  }

  // increment the quizId as set in dataStore
  data.recentQuizId += 1;

  const quizId = data.recentQuizId;

  // set timeCreated and LastEdited to current time
  const timeCreated = Math.floor(Date.now() / 1000);
  const timeLastEdited = timeCreated;
  // set default thumbnail
  const thumbnailUrl = '';

  // assign new quiz userId used for adminQuizList function
  const newQuiz: Quiz = {
    authUserId: user.authUserId,
    quizId,
    name,
    timeCreated,
    timeLastEdited,
    description,
    numQuestions: 0,
    questions: [],
    questionsTrash: [],
    duration: 0,
    thumbnailUrl,
  };

  // add newQuiz to array
  data.quizzes.push(newQuiz);
  setData(data);

  // return the new quizId
  return {
    quizId,
  };
}

/**
 * Function that given a particular quiz, removes the quiz.
 *
 * @param {integer} quizId - unique identifier for the quiz
 * @returns {EmptyObjectReturn} - empty object (success)
 */
export function adminQuizRemove(quizId: number): EmptyObjectReturn {
  const data = getData();
  const quiz = quizFindCheck(quizId);

  // find the remove quizzes index
  quiz.timeLastEdited = Math.floor(Date.now() / 1000);

  // move quiz to be deleted into trash array
  data.quizzesTrash.push(quiz);

  // refilter the quiz array to exclude the deleted quiz
  data.quizzes = data.quizzes.filter(q => q !== quiz);

  setData(data);

  return {};
}

/**
 * Removes a specified quiz from the active quizzes list. Checks for any active sessions
 * associated with the quiz and moves the quiz to a 'trash' array if no active sessions are found.
 * Updates the last edited time of the quiz and updates the data store.
 * Returns an empty object on successful removal or an error object if conditions are not met.
 *
 * @param {number} quizId - The ID of the quiz to be removed.
 * @returns {EmptyObjectReturn | SingleErrorObject} - An empty object for success, or an error object for failure.
 */
export function adminQuizRemoveV2(quizId: number): EmptyObjectReturn | SingleErrorObject {
  const data = getData();
  const quiz = quizFindCheck(quizId);

  const activeSessions = data.sessions.filter(session =>
    session.info.metadata.quizId === quizId && session.info.state !== SessionState.END
  );

  if (activeSessions.length > 0) {
    return { error: 'All sessions for this quiz must be in END state' };
  }
  // find the remove quizzes index
  quiz.timeLastEdited = Math.floor(Date.now() / 1000);

  // move quiz to be deleted into trash array
  data.quizzesTrash.push(quiz);

  // refilter the quiz array to exclude the deleted quiz
  data.quizzes = data.quizzes.filter(q => q !== quiz);

  setData(data);

  return {};
}

/**
 * Function that retrieve quizzes that are currently in the trash for the logged in user.
 *
 * @param {string} token - identifier for the admin user
 * @returns {AdminTrashQuizzesReturn} - object containing  trashed quizzes or an error object
 */
export function adminQuizViewTrash(token: string): AdminTrashQuizzesReturn {
  const data = getData();
  const user = tokenCheck(token);

  // access trashed array, filter array to new one based on user ownership
  // copy over quizId and name keys only to new array
  const trashedQuizzes = data.quizzesTrash
    .filter(q => q.authUserId === user.authUserId)
    .map(q => ({ quizId: q.quizId, name: q.name }));

  // return list of new quizzes
  return {
    quizzes: trashedQuizzes
  };
}

/**
 * Function that permanently delete specific quizzes currently sitting in the trash.
 *
 * @param {number[]} quizIds - array of unique identifiers for the quizzes to be deleted
 * @returns {EmptyObjectReturn | SingleErrorObject} an empty object (success) or an object with error details
 */
export function adminQuizTrashEmpty(quizIds: number[]): EmptyObjectReturn | SingleErrorObject {
  const data = getData();
  // Check if any of the provided quizIds exist in the list of non-trashed quizzes
  // If any of the quizIds exist in the main quiz list, return an error
  if (quizIds.some(quizId => !data.quizzesTrash.find(q => q.quizId === quizId))) {
    return {
      error: 'One or more of the QuizIds are not currently in trash'
    };
  }

  // Remove quizzes from trash
  data.quizzesTrash = data.quizzesTrash.filter(q => !quizIds.includes(q.quizId));

  setData(data);

  return {};
}

/**
 * Function to get all of the relevant information about the current quiz.
 *
 * @param {string} token - identifier for the admin user
 * @param {integer} quizId - unique identifier for the quiz
 * @returns {ErrorObject | AdminQuizInfoReturn} object - quizId, name, timeCreated, timeLastEdit,
 *                                              description, numQuestions, questions, duration
 */
export function adminQuizInfo(token: string, quizId: number): ErrorObject | AdminQuizInfoReturn {
  const user = tokenCheck(token);
  const quizOwn = forbiddenCheck(quizId, user) || trashForbiddenCheck(quizId, user);

  // filter questions to include only following keys
  // eliminated time and quizId keys
  const filteredQuestions = quizOwn.questions.map(question => ({
    questionId: question.questionId,
    question: question.question,
    duration: question.duration,
    points: question.points,
    answers: question.answers
  }));

  return {
    quizId: quizOwn.quizId,
    name: quizOwn.name,
    timeCreated: quizOwn.timeCreated,
    timeLastEdited: quizOwn.timeLastEdited,
    description: quizOwn.description,
    numQuestions: quizOwn.numQuestions,
    questions: filteredQuestions,
    duration: quizOwn.duration,
  };
}

// ///////////////////////////////////////////////////////////////////////
// //////////////////////////// V2 adminQuizInfo /////////////////////////
// vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv
/**
 * Function to get all of the relevant information about the current quiz.
 *
 * @param {string} token - identifier for the admin user
 * @param {integer} quizId - unique identifier for the quiz
 * @returns {ErrorObject | AdminQuizInfoReturnV2} object - quizId, name, timeCreated, timeLastEdit,
 *                                                description, numQuestions, questions, duration
 * */
export function adminQuizInfoV2(token: string, quizId: number): ErrorObject | AdminQuizInfoReturnV2 {
  const user = tokenCheck(token);
  const quizOwn = forbiddenCheck(quizId, user) || trashForbiddenCheck(quizId, user);

  // filter questions to include only following keys
  // eliminated time and quizId keys
  const filteredQuestions = quizOwn.questions.map(question => ({
    questionId: question.questionId,
    question: question.question,
    duration: question.duration,
    points: question.points,
    answers: question.answers,
    thumbnailUrl: question.thumbnailUrl
  }));

  return {
    quizId: quizOwn.quizId,
    name: quizOwn.name,
    timeCreated: quizOwn.timeCreated,
    timeLastEdited: quizOwn.timeLastEdited,
    description: quizOwn.description,
    numQuestions: quizOwn.numQuestions,
    questions: filteredQuestions,
    duration: quizOwn.duration,
    thumbnailUrl: quizOwn.thumbnailUrl,
  };
}

// ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// //////////////////////////// V2 adminQuizInfo /////////////////////////
// ///////////////////////////////////////////////////////////////////////
/**
 * Function to update the name of the relevant quiz.
 *
 * @param {string} token - identifier for the admin user
 * @param {integer} quizId - unique identifier for the quiz
 * @param {string} name - name of the user
 * @returns {EmptyObjectReturn | SingleErrorObject} - empty object (success) or error string (failure)
 */
export function adminQuizNameUpdate(token: string, quizId: number, name: string): EmptyObjectReturn | SingleErrorObject {
  const data = getData();
  const user = tokenCheck(token);
  const quiz = quizFindCheck(quizId);

  // error if not a valid quiz
  if (!quizNameCheck(name)) {
    // if name has invalid characters
    return QUIZ_NAME_ERROR;
  } else if (!quizNameLengthCheck(name)) {
    // if name is not between 3-30 characters long
    return QUIZ_NAME_LENGTH_ERROR;
  }

  // error if name is already used by the current logged in user for another quiz
  const isNameUsed = data.quizzes.some(q =>
    q.authUserId === user.authUserId && q.quizId !== quizId && q.name === name
  );

  if (isNameUsed) {
    return { error: 'Name is already used for another quiz of the user' };
  }

  // update quiz name with new name
  quiz.name = name;
  // change time edited to current time
  quiz.timeLastEdited = Math.floor(Date.now() / 1000);

  setData(data);

  return {};
}

/**
 * Function that provides a list of all quizzes that are owned by the currently logged in user.
 *
 * @param {integer} token - identifier for the admin user
 * @returns {AdminQuizListReturn} returns list of all quizzes
 */
export function adminQuizList(token: string): AdminQuizListReturn {
  const data = getData();
  // check dataStore to see if token is valid/registered - return true if registered
  const user = tokenCheck(token);

  // filter through all quizzes to find corresponding with usderId
  const quizList = data.quizzes
    .filter(quiz => quiz.authUserId === user.authUserId)
    // map quiz to another array, with only quizId and name keys
    .map(quiz => ({ quizId: quiz.quizId, name: quiz.name }));

  // return array of objects
  return { quizzes: quizList };
}

/**
 * Function updates the description of the relevant quiz.
 *
 * @param {integer} quizId - unique identifier for the quiz
 * @param {string} description - description of the quiz
 * @returns { EmptyObjectReturn | SingleErrorObject } - return empty object (success) or
 */
export function adminQuizDescriptionUpdate(quizId: number, description: string): EmptyObjectReturn | SingleErrorObject {
  const data = getData();
  // finds corresponding quiz to quizId
  const quiz = quizFindCheck(quizId);

  if (!quizDescriptionLengthCheck(description)) {
    // if length of description is more than 100 characters - return error
    return QUIZ_DESCRIPTION_ERROR;
  }

  // overwrite description
  quiz.description = description;
  // update time last edited to current time
  quiz.timeLastEdited = Math.floor(Date.now() / 1000);

  setData(data);

  return {};
}

/**
 * Function that transfers a quiz from the token user to a target user that is identified by their email
 * @param {string} token - identifier for the admin user
 * @param {number} quizId - unique identifier for the quiz
 * @param {string} userEmail - email of target user
 * @returns {EmptyObjectReturn | SingleErrorObject} return empty object in success, error in failure
 */
export function adminQuizTransfer(token: string, quizId: number, userEmail: string): EmptyObjectReturn | SingleErrorObject {
  const data = getData();
  const tokenUser = tokenCheck(token);
  const quiz = quizFindCheck(quizId);

  // check if user with provided email provided exists
  const targetUser = data.users.find((user) => user.email === userEmail);
  if (!targetUser) {
    return { error: ' the provided email is not registered ' };
  }

  // check if email provided is email of token user
  if (tokenUser.email === userEmail) {
    return { error: ' the provided email is your own ' };
  }

  // check if target user already has a quiz of that name
  // find quiz owned by target user that has the name of the quiz wanting to be transferred
  const quizOwn = forbiddenCheck(quizId, tokenUser);
  const sameQuizNameIndex = data.quizzes.find(q => (q.authUserId === targetUser.authUserId) && (q.name === quizOwn.name));
  if (sameQuizNameIndex) {
    return { error: ' the target user already has a quiz of that name ' };
  }

  // transfer ownership of quiz
  quiz.authUserId = targetUser.authUserId;
  // edit time quiz last edited to current time
  quiz.timeLastEdited = Math.floor(Date.now() / 1000);

  setData(data);

  return {};
}

// ///////////////////////////////////////////////////////////////////////
// ///////////////////////// V2 adminQuizTransfer ////////////////////////
// vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv
/**
 * Transfers quiz ownership to a specified user, ensuring the target user exists and does not own a quiz with the same name.
 * It validates user authenticity and quiz ownership before proceeding with the transfer.
 *
 * @param {string} token - User's auth token.
 * @param {number} quizId - ID of the quiz to transfer.
 * @param {string} userEmail - Email of the target user.
 * @returns {EmptyObjectReturn | SingleErrorObject} - Result of the transfer operation.
 */
export function adminQuizTransferV2(token: string, quizId: number, userEmail: string): EmptyObjectReturn | SingleErrorObject {
  const data = getData();
  const tokenUser = tokenCheck(token);
  const quiz = quizFindCheck(quizId);

  // check if user with provided email provided exists
  const targetUser = data.users.find((user) => user.email === userEmail);
  if (!targetUser) {
    return { error: ' the provided email is not registered ' };
  }

  // check if email provided is email of token user
  if (tokenUser.email === userEmail) {
    return { error: ' the provided email is your own ' };
  }

  // check if target user already has a quiz of that name
  // find quiz owned by target user that has the name of the quiz wanting to be transferred
  const quizOwn = forbiddenCheck(quizId, tokenUser);
  const sameQuizNameIndex = data.quizzes.find(q => (q.authUserId === targetUser.authUserId) && (q.name === quizOwn.name));
  if (sameQuizNameIndex) {
    return { error: ' the target user already has a quiz of that name ' };
  }

  const session = data.sessions.find(s => s.info.metadata.quizId === quizId && s.info.state !== SessionState.END);
  if (session) {
    return { error: 'All sessions for this quiz must be in END state' };
  }

  // transfer ownership of quiz
  quiz.authUserId = targetUser.authUserId;
  // edit time quiz last edited to current time
  quiz.timeLastEdited = Math.floor(Date.now() / 1000);

  setData(data);

  return {};
}

/**
 * Function that restores previously trashed quiz for user
 *
 * @param {string} token - identifier for the admin user
 * @param {integer} quizId - unique identifier for the quiz
 * @returns {EmptyObjectReturn | SingleErrorObject} return empty object in success or error string in failure
 */
export function adminQuizRemoveRestore (token: string, quizId: number): EmptyObjectReturn | SingleErrorObject {
  const data = getData();
  const tokenUser = tokenCheck(token);

  // find an active quiz that matches the quizId
  const quizActive = data.quizzes.find((quiz) => quiz.quizId === quizId);
  // find a quiz that matches the quizId and is owned by token user
  const quizTrashOwn = data.quizzesTrash.find(q => (q.authUserId === tokenUser.authUserId) && (q.quizId === quizId));

  // check if quizId refers to an active quiz owned by the user
  if (quizActive) {
    return { error: ' the quiz id specified is active - not in the trash ' };
  }

  // check name of quiz to be restored isn't the same as any currently active quizzes owned by the person
  // finds quizzes where the name is the same as the trashed quiz and are active
  const checkActiveNameExists = data.quizzes.find(q => (q.name === quizTrashOwn.name));
  // if they did find an active quiz with the same name...
  if (checkActiveNameExists) {
    return {
      error: ' an active quiz with the same name as quiz attempting to be restored exists '
    };
  }

  // add the quiz from trash into the active quizzes array
  data.quizzes.push(quizTrashOwn);

  // filter out the quiz from the trash that has that quiz id
  const newQuizzesTrashArr = data.quizzesTrash.filter(q => q.quizId !== quizId);
  data.quizzesTrash = newQuizzesTrashArr;

  const findRestoredQuiz = data.quizzes.find(q => (q.quizId === quizId) && (q.authUserId === tokenUser.authUserId));

  // set time of last edit to now
  findRestoredQuiz.timeLastEdited = Math.floor(Date.now() / 1000);

  // set the data
  setData(data);

  return {};
}

/**
 * Function that updates the thumbnail of the quiz
 * @param {integer} quizId - unique identifier for the quiz
 * @param {imgUrl} imgUrl - the URL of the new thumbnail image
 * @returns {EmptyObjectReturn | SingleErrorObject} return empty object in success or error string in failure
 */
export function adminQuizThumbnailUpdate(quizId: number, imgUrl: string): EmptyObjectReturn | SingleErrorObject {
  const data = getData();
  const quiz = quizFindCheck(quizId);

  if (!thumbnailValidCheck(imgUrl)) {
    return THUMBNAIL_INVALID_ERROR;
  }

  // update thumbnailUrl to imgUrl
  quiz.thumbnailUrl = imgUrl;

  // update time last edited to current time
  quiz.timeLastEdited = Math.floor(Date.now() / 1000);

  setData(data);

  return {};
}

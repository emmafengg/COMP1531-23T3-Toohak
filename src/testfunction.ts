import request from 'sync-request-curl';
import { port, url } from './config.json';
import { IncomingHttpHeaders } from 'http';
import { HttpVerb } from 'sync-request-curl';
import { CreateQuestionInput, PlayerChatMessageInput } from './interface';

const SERVER_URL = `${url}:${port}`;

// Helpers
/**
 * request helper function
 * @param method
 * @param path
 * @param body
 * @param headers
 * @returns
 */

export const requestHelper = (
  method: HttpVerb,
  path: string,
  body: object = {},
  headers: IncomingHttpHeaders = {}
) => {
  const url = SERVER_URL + path;
  if (['GET', 'DELETE'].includes(method.toUpperCase())) {
    return request(method, url, { qs: body, headers });
  } else {
    return request(method, url, { json: body, headers });
  }
};

/// ////////////////////////////////////////////////////////////////////////////
/// ///////////////////////////// AUTH /////////////////////////////////////////
/// ////////////////////////////////////////////////////////////////////////////

/**
 * Registers a new admin in the system by sending a POST request to the
 * '/v1/admin/auth/register' endpoint.
 * @param email
 * @param password
 * @param nameFirst
 * @param nameLast
 * @returns
 */
export const requestAdminAuthRegister = (email: string, password: string, nameFirst: string, nameLast: string) => {
  const res = requestHelper('POST', '/v1/admin/auth/register', { email, password, nameFirst, nameLast });
  return { object: JSON.parse(res.body.toString()), status: res.statusCode };
};

/**
 * Logs in an admin by sending a POST request to the '/v1/admin/auth/login'
 * endpoint.
 * @param email
 * @param password
 * @returns
 */
export const requestAdminAuthLogin = (email: string, password: string) => {
  const res = requestHelper('POST', '/v1/admin/auth/login', { email, password });
  return { object: JSON.parse(res.body.toString()), status: res.statusCode };
};

/**
 * Retrieves details of an admin user by sending a GET request to the
 * '/v1/admin/user/details' endpoint.
 * @param token
 * @returns
 */
export const requestAdminUserDetails = (token: string) => {
  const res = requestHelper('GET', '/v1/admin/user/details', { token });
  return { object: JSON.parse(res.body.toString()), status: res.statusCode };
};

/**
 * Logs out an admin user by sending a POST request to the
 * '/v1/admin/auth/logout' endpoint.
 * @param token
 * @returns
 */
export const requestAdminAuthLogout = (token: string) => {
  const res = requestHelper('POST', '/v1/admin/auth/logout', { token });
  return { object: JSON.parse(res.body.toString()), status: res.statusCode };
};

/**
 * Updates the password of an admin user by sending a PUT request to the
 * '/v1/admin/user/password' endpoint.
 * @param token
 * @param oldPassword
 * @param newPassword
 * @returns
 */
export const requestAdminPasswordUpdate = (token: string, oldPassword: string, newPassword: string) => {
  const res = requestHelper('PUT', '/v1/admin/user/password', { token, oldPassword, newPassword });
  return { object: JSON.parse(res.body.toString()), status: res.statusCode };
};

/**
 * Updates the details of an admin user by sending a PUT request to the
 * '/v1/admin/user/details' endpoint.
 * @param token
 * @param email
 * @param nameFirst
 * @param nameLast
 * @returns
 */
export const requestAdminUserDetailsUpdate = (token: string, email: string, nameFirst: string, nameLast: string) => {
  const res = requestHelper('PUT', '/v1/admin/user/details', { token, email, nameFirst, nameLast });
  return { object: JSON.parse(res.body.toString()), status: res.statusCode };
};

/// ============================== V2 ==========================================

export const requestAdminUserDetailsV2 = (token: string) => {
  const res = requestHelper('GET', '/v2/admin/user/details', {}, { token });
  return { object: JSON.parse(res.body.toString()), status: res.statusCode };
};

export const requestAdminAuthLogoutV2 = (token: string) => {
  const res = requestHelper('POST', '/v2/admin/auth/logout', {}, { token });
  return { object: JSON.parse(res.body.toString()), status: res.statusCode };
};

export const requestAdminPasswordUpdateV2 = (token: string, oldPassword: string, newPassword: string) => {
  const res = requestHelper('PUT', '/v2/admin/user/password', { oldPassword, newPassword }, { token });
  return { object: JSON.parse(res.body.toString()), status: res.statusCode };
};

export const requestAdminUserDetailsUpdateV2 = (token: string, email: string, nameFirst: string, nameLast: string) => {
  const res = requestHelper('PUT', '/v2/admin/user/details', { email, nameFirst, nameLast }, { token });
  return { object: JSON.parse(res.body.toString()), status: res.statusCode };
};

/// ////////////////////////////////////////////////////////////////////////////
/// ///////////////////////////// QUIZ /////////////////////////////////////////
/// ////////////////////////////////////////////////////////////////////////////

/**
 * Retrieves a list of quizzes associated with an admin user by sending a
 * GET request to the '/v1/admin/quiz/list' endpoint.
 * @param token
 * @returns
 */
export const requestAdminQuizList = (token: string) => {
  const res = requestHelper('GET', '/v1/admin/quiz/list', { token });
  return { object: JSON.parse(res.body.toString()), status: res.statusCode };
};

/**
 * Updates the name of an existing quiz by sending a PUT request to the
 * '/v1/admin/quiz/{quizId}/name' endpoint.
 * @param token
 * @param quizId
 * @param name
 * @returns
 */
export const requestAdminQuizNameUpdate = (token: string, quizId: number, name: string) => {
  const res = requestHelper('PUT', `/v1/admin/quiz/${quizId}/name`, { token, name });
  return { object: JSON.parse(res.body.toString()), status: res.statusCode };
};

/**
 * Creates a new quiz by sending a POST request to the '/v1/admin/quiz' endpoint.
 * @param token
 * @param name
 * @param description
 * @returns
 */
export const requestAdminQuizCreate = (token: string, name: string, description: string) => {
  const res = requestHelper('POST', '/v1/admin/quiz', { token, name, description });
  return { object: JSON.parse(res.body.toString()), status: res.statusCode };
};

/**
 * Removes an existing quiz by sending a DELETE request to the
 * '/v1/admin/quiz/{quizId}' endpoint.
 * @param token
 * @param quizId
 * @returns
 */
export const requestAdminQuizRemove = (token: string, quizId: number) => {
  const res = requestHelper('DELETE', `/v1/admin/quiz/${quizId}`, { token });
  return { object: JSON.parse(res.body.toString()), status: res.statusCode };
};

/**
 * Retrieves a list of quizzes in the trash for an admin user by sending a GET request
 * to the '/v1/admin/quiz/trash' endpoint.
 * @param token
 * @returns
 */
export const requestAdminQuizViewTrash = (token: string) => {
  const res = requestHelper('GET', '/v1/admin/quiz/trash', { token });
  return { object: JSON.parse(res.body.toString()), status: res.statusCode };
};

/**
 * Empties the trash for specific quizzes by sending a DELETE request to the
 * '/v1/admin/quiz/trash/empty' endpoint.
 * @param token
 * @param quizIds
 * @returns
 */
export const requestAdminTrashEmpty = (token: string, quizIds: number[]) => {
  const res = requestHelper('DELETE', '/v1/admin/quiz/trash/empty', { token, quizIds: JSON.stringify(quizIds) });
  return { object: JSON.parse(res.body.toString()), status: res.statusCode };
};

/**
 * Retrieves information about a specific quiz by sending a GET request to the
 * '/v1/admin/quiz/{quizId}' endpoint.
 * @param token
 * @param quizId
 * @returns
 */
export const requestAdminQuizInfo = (token: string, quizId: number) => {
  const res = requestHelper('GET', `/v1/admin/quiz/${quizId}`, { token });
  return { object: JSON.parse(res.body.toString()), status: res.statusCode };
};

/**
 * Updates the description of a specific quiz by sending a PUT request to the
 * '/v1/admin/quiz/{quizId}/description' endpoint.
 * @param quizid
 * @param token
 * @param description
 * @returns
 */
export const requestAdminQuizDescriptionUpdate = (quizid: number, token: string, description: string) => {
  const res = requestHelper('PUT', `/v1/admin/quiz/${quizid}/description`, { token, description });
  return { object: JSON.parse(res.body.toString()), status: res.statusCode };
};

/**
 * Transfers ownership of a specific quiz to another user by sending a POST
 * request to the '/v1/admin/quiz/{quizId}/transfer' endpoint.
 * @param token
 * @param quizId
 * @param userEmail
 * @returns
 */
export const requestAdminQuizTransfer = (token: string, quizId: number, userEmail: string) => {
  const res = requestHelper('POST', `/v1/admin/quiz/${quizId}/transfer`, { token, userEmail });
  return { object: JSON.parse(res.body.toString()), status: res.statusCode };
};

/**
 * Restores a specific quiz from the trash by sending a POST request to the
 * '/v1/admin/quiz/{quizId}/restore' endpoint.
 * @param token
 * @param quizId
 * @returns
 */
export const requestAdminQuizRemoveRestore = (token: string, quizId: number) => {
  const res = requestHelper('POST', `/v1/admin/quiz/${quizId}/restore`, { token });
  return { object: JSON.parse(res.body.toString()), status: res.statusCode };
};

/// ============================== V2 ==========================================

/**
 * Creates a new quiz by sending a POST request to the '/v2/admin/quiz' endpoint.
 * @param token
 * @param name
 * @param description
 * @returns
 */
export const requestAdminQuizCreateV2 = (token: string, name: string, description: string) => {
  const res = requestHelper('POST', '/v2/admin/quiz', { name, description }, { token });
  return { object: JSON.parse(res.body.toString()), status: res.statusCode };
};

/**
 * Updates the description of a specific quiz by sending a PUT request to the
 * '/v2/admin/quiz/{quizId}/description' endpoint.
 * @param quizid
 * @param token
 * @param description
 * @returns
 */
export const requestAdminQuizDescriptionUpdateV2 = (quizid: number, token: string, description: string) => {
  const res = requestHelper('PUT', `/v2/admin/quiz/${quizid}/description`, { description }, { token });
  return { object: JSON.parse(res.body.toString()), status: res.statusCode };
};

/**
 * Removes an existing quiz by sending a DELETE request to the
 * '/v2/admin/quiz/{quizId}' endpoint.
 * @param token
 * @param quizId
 * @returns
 */
export const requestAdminQuizRemoveV2 = (token: string, quizId: number) => {
  const res = requestHelper('DELETE', `/v2/admin/quiz/${quizId}`, { quizId }, { token });
  return { object: JSON.parse(res.body.toString()), status: res.statusCode };
};

/**
 * Restores a specific quiz from the trash by sending a POST request to the
 * '/v1/admin/quiz/{quizId}/restore' endpoint.
 * @param token
 * @param quizId
 * @returns
 */
export const requestAdminQuizRemoveRestoreV2 = (token: string, quizId: number) => {
  const res = requestHelper('POST', `/v2/admin/quiz/${quizId}/restore`, {}, { token });
  return { object: JSON.parse(res.body.toString()), status: res.statusCode };
};

/**
 * Retrieves information about a specific quiz by sending a GET request to the
 * '/v1/admin/quiz/{quizId}' endpoint.
 * @param token
 * @param quizId
 * @returns
 */
export const requestAdminQuizInfoV2 = (token: string, quizId: number) => {
  const res = requestHelper('GET', `/v2/admin/quiz/${quizId}`, {}, { token });
  return { object: JSON.parse(res.body.toString()), status: res.statusCode };
};

/**
 * Transfers ownership of a specific quiz to another user by sending a POST
 * request to the '/v1/admin/quiz/{quizId}/transfer' endpoint.
 * @param token
 * @param quizId
 * @param userEmail
 * @returns
 */
export const requestAdminQuizTransferV2 = (token: string, quizId: number, userEmail: string) => {
  const res = requestHelper('POST', `/v2/admin/quiz/${quizId}/transfer`, { userEmail }, { token });
  return { object: JSON.parse(res.body.toString()), status: res.statusCode };
};

/**
 * Retrieves a list of quizzes in the trash for an admin user by sending a GET request
 * to the '/v2/admin/quiz/trash' endpoint.
 * @header token
 * @returns
 */
export const requestAdminQuizViewTrashV2 = (token: string) => {
  const res = requestHelper('GET', '/v2/admin/quiz/trash', {}, { token });
  return { object: JSON.parse(res.body.toString()), status: res.statusCode };
};

/**
 * Empties the trash for specific quizzes by sending a DELETE request to the
 * '/v2/admin/quiz/trash/empty' endpoint.
 * @param token
 * @param quizIds
 * @returns
 */
export const requestAdminTrashEmptyV2 = (token: string, quizIds: number[]) => {
  const res = requestHelper('DELETE', '/v2/admin/quiz/trash/empty', { quizIds: JSON.stringify(quizIds) }, { token });
  return { object: JSON.parse(res.body.toString()), status: res.statusCode };
};

/// ////////////////////////////////////////////////////////////////////////////
/// /////////////////////////// QUESTION ///////////////////////////////////////
/// ////////////////////////////////////////////////////////////////////////////

/**
 * Creates a new question for a specific quiz by sending a POST request to
 * the '/v1/admin/quiz/{quizId}/question' endpoint.
 * @param quizId
 * @param token
 * @param questionBody
 * @returns
 */
export const requestAdminQuizCreateQuestion = (quizId: number, token: string, questionBody: CreateQuestionInput) => {
  const res = requestHelper('POST', `/v1/admin/quiz/${quizId}/question`, { quizId, token, questionBody });
  return { object: JSON.parse(res.body.toString()), status: res.statusCode };
};

/**
 * Moves a question to a new position within a specific quiz by sending a PUT
 * request to the '/v1/admin/quiz/{quizId}/question/{questionId}/move' endpoint.
 * @param token
 * @param quizId
 * @param questionId
 * @param newPosition
 * @returns
 */
export const requestAdminQuizQuestionMove = (token: string, quizId: number, questionId: number, newPosition: number) => {
  const res = requestHelper('PUT', `/v1/admin/quiz/${quizId}/question/${questionId}/move`, { token, newPosition });
  return { object: JSON.parse(res.body.toString()), status: res.statusCode };
};

/**
 * Deletes a specific question from a quiz by sending a DELETE request to the
 * '/v1/admin/quiz/{quizId}/question/{questionId}' endpoint.
 * @param quizId
 * @param questionId
 * @param token
 * @returns
 */
export const requestAdminQuizDeleteQuestion = (quizId: number, questionId: number, token: string) => {
  const res = requestHelper('DELETE', `/v1/admin/quiz/${quizId}/question/${questionId}`, { token });
  return { object: JSON.parse(res.body.toString()), status: res.statusCode };
};

/**
 * Updates the details of a specific question within a quiz by sending a
 * PUT request to the '/v1/admin/quiz/{quizId}/question/{questionId}' endpoint.
 * @param quizId
 * @param questionId
 * @param token
 * @param questionBody
 * @returns
 */
export const requestAdminQuizQuestionUpdate = (quizId: number, questionId: number, token: string, questionBody: CreateQuestionInput) => {
  const res = requestHelper('PUT', `/v1/admin/quiz/${quizId}/question/${questionId}`, { token, questionBody });
  return { object: JSON.parse(res.body.toString()), status: res.statusCode };
};

/**
 * Duplicates a specific question within a quiz by sending a POST request
 * to the '/v1/admin/quiz/{quizId}/question/{questionId}/duplicate' endpoint.
 * @param quizId
 * @param questionId
 * @param token
 * @returns
 */
export const requestAdminQuizDuplicateQuestion = (quizId: number, questionId: number, token: string) => {
  const res = requestHelper('POST', `/v1/admin/quiz/${quizId}/question/${questionId}/duplicate`, { token });
  return { object: JSON.parse(res.body.toString()), status: res.statusCode };
};

/// ============================== V2 ==========================================

/**
 * Creates a new question for a specific quiz by sending a POST request to
 * the '/v2/admin/quiz/{quizId}/question' endpoint.
 * @param quizId
 * @param token
 * @param questionBody
 * @returns
 */
export const requestAdminQuizCreateQuestionV2 = (quizId: number, token: string, questionBody: CreateQuestionInput) => {
  const res = requestHelper('POST', `/v2/admin/quiz/${quizId}/question`, { quizId, questionBody }, { token });
  return { object: JSON.parse(res.body.toString()), status: res.statusCode };
};

/**
 * Deletes a specific question from a quiz by sending a DELETE request to the
 * '/v2/admin/quiz/{quizId}/question/{questionId}' endpoint.
 * @param quizId
 * @param questionId
 * @param token
 * @returns
 */
export const requestAdminQuizDeleteQuestionV2 = (quizId: number, questionId: number, token: string) => {
  const res = requestHelper('DELETE', `/v2/admin/quiz/${quizId}/question/${questionId}`, {}, { token });
  return { object: JSON.parse(res.body.toString()), status: res.statusCode };
};

/**
* Moves a question to a new position within a specific quiz by sending a PUT
* request to the '/v1/admin/quiz/{quizId}/question/{questionId}/move' endpoint.
* @param token
* @param quizId
* @param questionId
* @param newPosition
* @returns
*/
export const requestAdminQuizQuestionMoveV2 = (token: string, quizId: number, questionId: number, newPosition: number) => {
  const res = requestHelper('PUT', `/v2/admin/quiz/${quizId}/question/${questionId}/move`, { newPosition }, { token });
  return { object: JSON.parse(res.body.toString()), status: res.statusCode };
};

/// ////////////////////////////////////////////////////////////////////////////
/// ///////////////////////////// OTHER ////////////////////////////////////////
/// ////////////////////////////////////////////////////////////////////////////

/**
 * Clear test function
 * @returns
 */
export const requestClear = () => {
  const res = requestHelper('DELETE', '/v1/clear', {});
  return { object: JSON.parse(res.body.toString()), status: res.statusCode };
};

/// ////////////////////////////////////////////////////////////////////////////
/// //////////////////////////// V2 FUNCTIONS //////////////////////////////////
/// ////////////////////////////////////////////////////////////////////////////

/**
 * Retrieves a list of quizzes associated with an admin user by sending a
 * GET request to the '/v1/admin/quiz/list' endpoint.
 * @param token
 * @returns
 */
export const requestAdminQuizListV2 = (token: string) => {
  const res = requestHelper('GET', '/v2/admin/quiz/list', {}, { token });
  return { object: JSON.parse(res.body.toString()), status: res.statusCode };
};

/**
 * Updates the name of an existing quiz by sending a PUT request to the
 * '/v1/admin/quiz/{quizId}/name' endpoint.
 * @param token
 * @param quizId
 * @param name
 * @returns
 */
export const requestAdminQuizNameUpdateV2 = (token: string, quizId: number, name: string) => {
  const res = requestHelper('PUT', `/v2/admin/quiz/${quizId}/name`, { name }, { token });
  return { object: JSON.parse(res.body.toString()), status: res.statusCode };
};

/**
 * Updates the details of a specific question within a quiz by sending a
 * PUT request to the '/v1/admin/quiz/{quizId}/question/{questionId}' endpoint.
 * @param quizId
 * @param questionId
 * @param token
 * @param questionBody
 * @returns
 */
export const requestAdminQuizQuestionUpdateV2 = (quizId: number, questionId: number, token: string, questionBody: CreateQuestionInput) => {
  const res = requestHelper('PUT', `/v2/admin/quiz/${quizId}/question/${questionId}`, { questionBody }, { token });
  return { object: JSON.parse(res.body.toString()), status: res.statusCode };
};

/**
 * Duplicates a specific question within a quiz by sending a POST request
 * to the '/v1/admin/quiz/{quizId}/question/{questionId}/duplicate' endpoint.
 * @param quizId
 * @param questionId
 * @param token
 * @returns
 */
export const requestAdminQuizDuplicateQuestionV2 = (quizId: number, questionId: number, token: string) => {
  const res = requestHelper('POST', `/v2/admin/quiz/${quizId}/question/${questionId}/duplicate`, {}, { token });
  return { object: JSON.parse(res.body.toString()), status: res.statusCode };
};

/// ////////////////////////////////////////////////////////////////////////////
/// /////////////////////////// SESSION ///////////////////////////////////////
/// ////////////////////////////////////////////////////////////////////////////

/**
 * duplicates a question and creates a session where users can play the quiz
 * sends request to the '/v1/admin/quiz/${quizId}/session/start' endpoint.
 * @param quizId - unique identifier for each quiz
 * @param autoStartNum - number of users in lobby before quiz starts
 * @param token - unique identifier for each user to hide authUserId
 * @returns
 */

export const requestAdminQuizCreateSession = (quizId: number, autoStartNum: number, token: string) => {
  const res = requestHelper('POST', `/v1/admin/quiz/${quizId}/session/start`, { autoStartNum }, { token });
  return { object: JSON.parse(res.body.toString()), status: res.statusCode };
};

/**
 * get status of particular quiz session by sending request to
 * /v1/admin/quiz/${quizId}/session/${sessionId} endpoint
 * @param quizId - unique identifier for each quiz
 * @param sessionId - unique identifier for the session started within quiz
 * @param token - unique identifier for each user to hide authUserId
 * @returns
 */

export const requestAdminQuizSessionStatus = (quizId: number, sessionId: number, token: string) => {
  const res = requestHelper('GET', `/v1/admin/quiz/${quizId}/session/${sessionId}`, {}, { token });
  return { object: JSON.parse(res.body.toString()), status: res.statusCode };
};

/**
 * Sends a GET request to retrieve the current question status for a specific player.
 * This function queries the server for the details of a particular question based on the player's ID
 * and the position of the question in the quiz.
 *
 * @param {number} playerId - The unique identifier of the player.
 * @param {number} questionPosition - The position of the question in the quiz (e.g., 1st question, 2nd question).
 * @returns An object containing the response data and status code. The response data includes details
 *          of the question such as question ID, text, duration, thumbnail URL, points, and available answers.
 *          The status code indicates the success or failure of the request.
 */
export const requestPlayerQuestionStatus = (playerId: number, questionPosition: number) => {
  const res = requestHelper('GET', `/v1/player/${playerId}/question/${questionPosition}`, {}, {});
  return { object: JSON.parse(res.body.toString()), status: res.statusCode };
};

/**
 * Makes an HTTP PUT request to submit a player's answers to a specific question in a quiz session.
 * @param {number} playerId - The unique identifier for the player submitting the answers.
 * @param {number} questionPosition - The position or identifier of the current question in the quiz.
 * @param {number[]} answerIds - An array of answer IDs that the player has selected.
 * @returns An object containing the parsed response body and the status code of the response.
 */
export const requestsubmitPlayerAnswer = (playerId: number, questionPosition: number, answerIds: number[]) => {
  const res = requestHelper('PUT', `/v1/player/${playerId}/question/${questionPosition}/answer`, { answerIds }, {});
  return { object: JSON.parse(res.body.toString()), status: res.statusCode };
};

/**
 * gets final results for all players for a completed quiz session by sending request
 * to the '/v1/admin/quiz/${quizId}/session/${sessionId}/results' endpoint.
 * @param quizId - unique identifier for each quiz
 * @param sessionId - unique identifier for the session started within quiz
 * @param token - unique identifier for each user to hide authUserId
 * @returns
 */

export const requestAdminQuizSessionResult = (quizId: number, sessionId: number, token: string) => {
  const res = requestHelper('GET', `/v1/admin/quiz/${quizId}/session/${sessionId}/results`, {}, { token });
  return { object: JSON.parse(res.body.toString()), status: res.statusCode };
};

export const requestAdminQuizSessionResultCSV = (quizId: number, sessionId: number, token: string) => {
  const res = requestHelper('GET', `/v1/admin/quiz/${quizId}/session/${sessionId}/results/csv`, {}, { token });
  return { object: JSON.parse(res.body.toString()), status: res.statusCode };
};

export const requestAdminQuizViewSessions = (token: string, quizId: number) => {
  const res = requestHelper('GET', `/v1/admin/quiz/${quizId}/sessions`, {}, { token });
  return { object: JSON.parse(res.body.toString()), status: res.statusCode };
};

export const requestAdminQuizSessionUpdate = (token: string, quizId: number, sessionId: number, action: string) => {
  const res = requestHelper('PUT', `/v1/admin/quiz/${quizId}/session/${sessionId}`, { action }, { token });
  return { object: JSON.parse(res.body.toString()), status: res.statusCode };
};

/// ////////////////////////////////////////////////////////////////////////////
/// ///////////////////////////// PLAYER ///////////////////////////////////////
/// ////////////////////////////////////////////////////////////////////////////

/**
 * allows player to join the new session that has been made by sending request to
 * the '/v1/player/join' endpoint.
 * @param sessionId - unique identifier for the session started within quiz
 * @param name - name of user that is entering the session
 * @returns
 */
export const requestPlayerJoin = (sessionId: number, name: string) => {
  const res = requestHelper('POST', '/v1/player/join', { sessionId, name }, {});
  return { object: JSON.parse(res.body.toString()), status: res.statusCode };
};

/**
 * Sends a request to retrieve the current status of a guest player in a session.
 * This function interacts with the '/v1/player/{playerid}' endpoint to obtain details
 * such as the current state of the session, the total number of questions, and the
 * current question number for the specified player.
 * @param playerId - The unique identifier of the guest player whose status is being requested.
 * @returns - object containing the response data and status code. The response data includes
 *            the session state, total number of questions, and the current question number if the
 *            player exists. If the player ID does not exist, an error message is included in the response.
 */
export const requestGetPlayerStatus = (playerId: number) => {
  const res = requestHelper('GET', `/v1/player/${playerId}`, {}, {});
  return { object: JSON.parse(res.body.toString()), status: res.statusCode };
};

/**
 * Sends a request to Send a new chat message to everyone in the session
 *
 * @param playerId - The unique identifier of the guest player whose status is being requested.
 * @param message - An object that contains the message that the player sends
 *
 * @returns
 */
export const requestPlayerSendChatMessage = (playerId: number, message: PlayerChatMessageInput) => {
  const res = requestHelper('POST', `/v1/player/${playerId}/chat`, { message }, {});
  return { object: JSON.parse(res.body.toString()), status: res.statusCode };
};

export const requestAdminPlayerSessionResult = (playerId: number) => {
  const res = requestHelper('GET', `/v1/player/${playerId}/results`, {}, {});
  return { object: JSON.parse(res.body.toString()), status: res.statusCode };
};

/**
 * Sends a request to return all messages that are in the same session as the player
 *
 * @param playerId - The unique identifier of the guest player whose status is being requested.
 *
 * @returns
 */
export const requestPlayerReturnChatMessage = (playerId: number) => {
  const res = requestHelper('GET', `/v1/player/${playerId}/chat`, {}, {});
  return { object: JSON.parse(res.body.toString()), status: res.statusCode };
};

export const requestPlayerQuestionResults = (playerId: number, questionPosition: number) => {
  const res = requestHelper('GET', `/v1/player/${playerId}/question/${questionPosition}/results`, {}, {});
  return { object: JSON.parse(res.body.toString()), status: res.statusCode };
};

/// ////////////////////////////////////////////////////////////////////////////
/// ////////////////////// OTHER ITER 3 FUNCTIONS //////////////////////////////
/// ////////////////////////////////////////////////////////////////////////////

/**
 * Sends a request to update the thumbnail of a quiz through the admin API.
 *
 * @param token - The identifier for the admin user.
 * @param quizId - The unique identifier for the quiz.
 * @param imgUrl - The URL of the new thumbnail image.
 *
 * @returns
 */
export const requestAdminQuizThumbnailUpdate = (token: string, quizId: number, imgUrl: string) => {
  const res = requestHelper('PUT', `/v1/admin/quiz/${quizId}/thumbnail`, { imgUrl }, { token });
  return { object: JSON.parse(res.body.toString()), status: res.statusCode };
};

export const requestRoot = () => {
  return requestHelper('GET', '/', {}, {});
};

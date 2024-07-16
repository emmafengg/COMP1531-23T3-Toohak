import { getData, setData } from './dataStore';
import {
  playerJoinReturn, SessionState, playerStatusReturn, PlayerChatMessageInput, PlayerAnswerRecord,
  Messages, EmptyObjectReturn, SingleErrorObject, CurrentQuestionInfo, resultInfo, ChatMessagesResponse,
  SessionAction, QuestionResultInfo
} from './interface';
import { adminQuizSessionUpdate } from './session';
import { playerNameGenerator, randomNumGenerator, checkForDuplicates } from './support';
import HTTPError from 'http-errors';

const BAD_REQUEST = 400;

/**
 * function that allows guest player to join session
 *
 * @param {number} sessionId - unique identifier for sessions started within quiz
 * @param {string} name - name of the guest player - if empty, autogenerate name
 * @returns {playerJoinReturn} - player's id
 */
export function playerJoin (sessionId: number, name: string): playerJoinReturn {
  const data = getData();
  const session = data.sessions.find((session) => session.sessionId === sessionId);

  // if session is not in lobby state - throw error
  if (!session || session.info.state !== SessionState.LOBBY) {
    throw HTTPError(BAD_REQUEST, 'session is not in lobby state');
  }

  // if name of the user is not unique - throw error
  if (session.info && session.info.players.find((player) => player.name === name)) {
    throw HTTPError(BAD_REQUEST, 'name has already been used by another player');
  }

  if (name === '') {
    name = playerNameGenerator();
  }

  const playerId = randomNumGenerator();
  const player = {
    playerId,
    name,
  };

  session.info.players.push(player);

  setData(data);

  if (session.info.players.length === session.autoStartNum) {
    adminQuizSessionUpdate(session.info.metadata.quizId, session.sessionId, SessionAction.NEXT_QUESTION);
  }

  return { playerId };
}

/**
 * Retrieves the current status of a guest player in a session, including the session state,
 * the total number of questions, and the current question number.
 *
 * @param {number} playerId - The unique identifier of the guest player.
 * @returns {playerStatusReturn} An object containing the session state, total number of questions,
 *                               and the current question number if the player exists. Throws an error
 *                               if the player ID does not exist in any session.
 * @throws {HTTPError} Throws a BAD_REQUEST error if the player ID does not exist.
 */
export function getPlayerStatus(playerId: number): playerStatusReturn {
  const data = getData();
  // find the specific session to return status
  const session = data.sessions.find(s => s.info.players.some(p => p.playerId === playerId));

  if (!session) {
    throw HTTPError(BAD_REQUEST, 'Player ID does not exist');
  }

  return {
    state: session.info.state,
    numQuestions: session.info.metadata.numQuestions,
    atQuestion: session.info.atQuestion
  };
}

/**
 * Retrieves the current question status for a specific player in a quiz session.
 * This function checks the session associated with the given player ID and retrieves
 * information about a specific question based on its position in the quiz.
 *
 * @param {number} playerId - The unique identifier of the player.
 * @param {number} questionPosition - The position of the question in the quiz,
 *                                    indicating which question to retrieve information for.
 * @returns {CurrentQuestionInfo} An object containing detailed information about the question,
 *                                including its ID, text, duration, thumbnail URL, points, and answers.
 *                                Each answer includes its ID, text, and colour.
 * @throws {HttpError} Throws an error if the player ID does not exist, if the session is in LOBBY or END state,
 *                     if the question position is not valid for the session, or if the session is not currently
 *                     on the specified question.
 */
export function getPlayerQuestionStatus(playerId: number, questionPosition: number): CurrentQuestionInfo {
  const data = getData();
  const session = data.sessions.find(session => session.info.players.some(player => player.playerId === playerId));

  if (!session) {
    throw HTTPError(BAD_REQUEST, 'Player ID does not exist');
  }

  if (questionPosition > session.info.metadata.numQuestions || questionPosition < 0) {
    throw HTTPError(BAD_REQUEST, 'Question position is not valid for the session this player is in');
  }

  if (session.info.atQuestion !== questionPosition) {
    throw HTTPError(BAD_REQUEST, 'Session is not currently on this question');
  }

  if (session.info.state === SessionState.LOBBY || session.info.state === SessionState.END) {
    throw HTTPError(BAD_REQUEST, 'Session is in LOBBY or END state');
  }

  const question = session.info.metadata.questions[questionPosition - 1];

  return {
    questionId: question.questionId,
    question: question.question,
    duration: question.duration,
    thumbnailUrl: question.thumbnailUrl,
    points: question.points,
    answers: question.answers.map(answer => ({
      answerId: answer.answerId,
      answer: answer.answer,
      colour: answer.colour
    }))
  };
}

/**
 * Handles the sending of a chat message by a player in a gaming session.
 *
 * This function first retrieves the current game session data and checks if the player exists in any session.
 * If the player does not exist, it throws an error. It then validates the length of the message to ensure it
 * is within the specified character limits. After validation, it creates a new chat message object and adds it
 * to the session's chat log. Finally, it updates the session data with the new message.
 *
 * @param {number} playerId - The unique identifier of the player sending the message.
 * @param {PlayerChatMessageInput} message - An object containing the details of the message, including the message body.
 * @returns {EmptyObjectReturn} - Returns an empty object on successful message sending
 *         or an error object if an error occurs.
 */
export function playerSendChatMessage(playerId: number, message: PlayerChatMessageInput): EmptyObjectReturn {
  const data = getData();
  const session = data.sessions.find(s => s.info.players.some(p => p.playerId === playerId));

  if (!session) {
    throw HTTPError(BAD_REQUEST, 'Player ID does not exist');
  }

  // Validate the message length
  if (message.messageBody.length < 1 || message.messageBody.length > 100) {
    throw HTTPError(BAD_REQUEST, 'Message body should be between 1 and 100 characters');
  }

  // Create a new chat message
  const newChatMessage: Messages = {
    messageBody: message.messageBody,
    playerId,
    playerName: session.info.players.find(p => p.playerId === playerId).name,
    timeSent: Math.floor(Date.now() / 1000),
  };

  // Add the message to the session's chat
  session.messages = session.messages || [];
  session.messages.push(newChatMessage);

  // Save the updated data
  setData(data);

  return {};
}

/**
 * Submits answers for a player for a specific question in a quiz session.
 *
 * @param {number} playerId - The unique identifier of the player submitting the answers.
 * @param {number} questionPosition - The position or identifier of the question within the quiz.
 * @param {number[]} answerIds - An array containing the IDs of the answers selected by the player.
 * @returns {EmptyObjectReturn} - An empty object indicating a successful operation if no errors are thrown.
 * @throws Will throw an error if any validation checks fail.
 */
export function submitPlayerAnswer(playerId: number, questionPosition: number, answerIds: number[]): EmptyObjectReturn {
  const data = getData();
  const session = data.sessions.find(s => s.info.players.some(p => p.playerId === playerId));

  if (!session) {
    throw HTTPError(BAD_REQUEST, 'Player ID does not exist');
  }

  const question = session.info.metadata.questions[questionPosition - 1];
  if (questionPosition > session.info.metadata.numQuestions || questionPosition < 1) {
    throw HTTPError(BAD_REQUEST, 'Question position is not valid for the session this player is in');
  }

  if (session.info.state !== SessionState.QUESTION_OPEN) {
    throw HTTPError(BAD_REQUEST, 'Session is not in QUESTION_OPEN state');
  }

  // Check if session is not yet up to this question
  if (questionPosition > session.info.atQuestion) {
    throw HTTPError(BAD_REQUEST, 'Session is not yet up to this question');
  }

  const validAnswerIds = question.answers.map(a => a.answerId);
  if (!answerIds.every(id => validAnswerIds.includes(id))) {
    throw HTTPError(BAD_REQUEST, 'Answer IDs are not valid for this question');
  }

  if (answerIds.length > 1) {
    // Check for duplicate answer IDs
    if (checkForDuplicates(answerIds)) {
      throw HTTPError(BAD_REQUEST, 'Duplicate answer IDs provided');
    }
  }

  // Check if less than 1 answer ID was submitted
  if (answerIds.length < 1) {
    throw HTTPError(BAD_REQUEST, 'Less than 1 answer ID was submitted');
  }
  const questionId = session.info.metadata.questions[questionPosition - 1].questionId;
  const answerTime = Math.floor(Date.now() / 1000);
  const playerAnswerRecord: PlayerAnswerRecord = {
    playerId,
    questionId,
    answerIds,
    answerTime
  };

  if (!session.playerAnswer) {
    session.playerAnswer = [];
  }

  session.playerAnswer.push(playerAnswerRecord);

  setData(data);

  return {};
}

/**
 * get the final results for a whole session a player is playing in
 *
 * @param {number} playerId - unique identifier for player
 * @returns {resultInfo} - session result which the player is in
 */
export function adminPlayerSessionResult (playerId: number): resultInfo {
  const data = getData();

  // find the session the player is in
  const findPlayersSession = data.sessions.find(s => s.info.players.find(p => p.playerId === playerId));
  if (!findPlayersSession) {
    throw HTTPError(BAD_REQUEST, 'playerid cannot be found');
  }

  // check session is in FINAL_RESULTS state
  if (findPlayersSession.info.state !== SessionState.FINAL_RESULTS) {
    throw HTTPError(BAD_REQUEST, 'session that player is in is not in FINAL_RESULTS stage');
  }

  return findPlayersSession.results;
}

export function playerReturnChatMessage(playerId: number): ChatMessagesResponse | SingleErrorObject {
  const data = getData();
  const session = data.sessions.find(s => s.info.players.some(p => p.playerId === playerId));

  if (!session) {
    throw HTTPError(BAD_REQUEST, 'Player ID does not exist');
  }

  // Map the chat messages to the response format
  const chatMessagesResponse: ChatMessagesResponse = {
    messages: session.messages.map(message => ({
      messageBody: message.messageBody,
      playerId: message.playerId,
      playerName: message.playerName,
      timeSent: message.timeSent,
    })),
  };

  return chatMessagesResponse;
}

/**
 * Retrieves the results of a specific question answered by a player in a game session.
 *
 * This function starts by fetching the current game session data. It then locates the session
 * associated with the given player ID. If the player is not found in any session, an error is thrown.
 * The function also validates the question position to ensure it's within the session's question range.
 * Additional checks include verifying if the session is in the 'ANSWER_SHOW' state and if the session
 * has progressed to the specified question. If any of these checks fail, an appropriate error is thrown.
 * If all checks pass, the function returns the results for the specified question.
 *
 * @param {number} playerId - The unique identifier of the player whose question results are being queried.
 * @param {number} questionPosition - The position (or index) of the question within the session.
 * @returns {QuestionResultInfo} - The results of the specified question for the player's session.
 */
export const playerQuestionResults = (playerId: number, questionPosition: number): QuestionResultInfo => {
  const data = getData();

  const playerSession = data.sessions.find(s => s.info.players.find(p => p.playerId === playerId));
  if (!playerSession) {
    throw HTTPError(BAD_REQUEST, 'Player ID does not exist');
  } else if (questionPosition > playerSession.info.metadata.numQuestions || questionPosition < 0) {
    throw HTTPError(BAD_REQUEST, 'question position is not valid for the session');
  } else if (playerSession.info.state !== SessionState.ANSWER_SHOW) {
    throw HTTPError(BAD_REQUEST, 'Session is not in ANSWER_SHOW state');
  } else if (questionPosition > playerSession.info.atQuestion) {
    throw HTTPError(BAD_REQUEST, 'session is not yet up to this question');
  }

  return playerSession.results.questionResults[playerSession.info.atQuestion - 1];
};

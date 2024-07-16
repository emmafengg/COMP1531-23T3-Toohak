import { getData, setData } from './dataStore';
import {
  AdminQuizCreateSession, SessionQuiz, SessionState, SessionQuizInfo, SessionStatusReturn, resultInfo,
  sessionResultsCSVReturn, AdminQuizViewSessionsReturn, SessionAction, ResultCSVInfo, RankInfo, EmptyObjectReturn
} from './interface';
import { convertResultToCSV, randomNumGenerator, sessionIdCheck, checkSessionAction, scoreCalculate } from './support';
import HTTPError from 'http-errors';
import deepcopy from 'deepcopy';
import fs from 'fs';
import path from 'path';
import { port, url } from './config.json';
import { v4 as uuidv4 } from 'uuid';

const SERVER_URL = `${url}:${port}`;
const BAD_REQUEST = 400;

const INVALID_SESSION_ID_STR = 'Session Id does not refer to a valid session within this quiz';
const SESSION_NOT_END_STR = 'Session is not in FINAL_RESULTS state';

let skipCountdownId: ReturnType<typeof setTimeout>;
let questionOpenId: ReturnType<typeof setTimeout>;

/**
 * Function that creates new session for given user under owned quiz and returns its sessionId
 *
 * @param {number} quizId - identifier for the quiz
 * @param {number} autoStartNum - number of people to autostart quiz
 * @returns {AdminQuizCreateSession} sessionId (success) or error string
 */
export function adminQuizCreateSession(quizId: number, autoStartNum: number): AdminQuizCreateSession {
  const data = getData();

  // if the autoStartNum more than 50 - throw error
  if (autoStartNum > 50) {
    throw HTTPError(BAD_REQUEST, 'autoStartNum is greater than 50');
  }

  // if there are more than 10 sessions that are not in END state - throw error
  if (data.sessions && data.sessions.filter((sessions) => sessions.info.state !== 'END').length >= 10) {
    throw HTTPError(BAD_REQUEST, 'more than 10 sessions not in END state exist');
  }

  // find quiz with matching quizId
  const quizObject = data.quizzes.find((q) => q.quizId === quizId);

  // if there are no questions in the quiz - throw error
  if (quizObject.questions.length === 0) {
    throw HTTPError(BAD_REQUEST, 'given quiz does not have any questions in it');
  }

  const quizMetaData = deepcopy(quizObject);

  const sessionInfo: SessionQuizInfo = {
    state: SessionState.LOBBY,
    // as currently in lobby - set question to 0
    atQuestion: 0,
    // no players have been added yet
    players: [],
    // copy quiz over to session
    metadata: quizMetaData,
  };

  // using randomNumGenerator to generate sessionId
  const sessionId = randomNumGenerator();

  const session: SessionQuiz = {
    sessionId,
    autoStartNum,
    timeCreated: Math.floor(Date.now() / 1000),
    info: sessionInfo,
    results: {
      usersRankedByScore: [],
      questionResults: [],
    },
    resultsCSV: []
  };

  // add new session to the array of sessions
  data.sessions.push(session);

  setData(data);

  return { sessionId };
}

/**
 * Retrieves the status details of a specified quiz session.
 *
 * @param {number} quizId - The unique identifier of the quiz.
 * @param {number} sessionId - The unique identifier of the session.
 * @returns {SessionStatusReturn} - Returns the session details after cleaning up (removing sensitive or unnecessary information).
 *                                  Throws an HTTP error if the session ID is invalid or the corresponding session cannot be found.
 */
export const adminQuizSessionStatus = (quizId: number, sessionId: number): SessionStatusReturn => {
  const data = getData();
  // Check if the session ID is valid
  const session = sessionIdCheck(quizId, sessionId);
  if (!session) {
    // Throw an error if the session is invalid
    throw HTTPError(BAD_REQUEST, INVALID_SESSION_ID_STR);
  }

  // Deep copy the session info to avoid modifying the original data directly
  const sessionDetail = deepcopy(session.info);

  // Remove unnecessary information
  delete sessionDetail.metadata.authUserId;
  delete sessionDetail.metadata.questionsTrash;
  sessionDetail.metadata.questions.forEach(question => {
    delete question.quizId;
    delete question.timeCreated;
    delete question.timeLastEdited;
  });

  const sessionCopy: SessionStatusReturn = {
    ...sessionDetail,
    players: sessionDetail.players
      .map(player => player.name)
      .sort((a, b) => a.localeCompare(b))
  };

  setData(data);
  // Return the processed session details
  return sessionCopy;
};

/**
 * Retrieves the results of a specified quiz session.
 *
 * @param {number} quizId - The unique identifier of the quiz.
 * @param {number} sessionId - The unique identifier of the session.
 * @returns {resultInfo} - Returns the results of the session.
 *                         Throws an HTTP error if the session ID is invalid,
 *                         the corresponding session cannot be found, or if the session has not yet ended.
 */
export const adminQuizSessionResults = (quizId: number, sessionId: number): resultInfo => {
  const data = getData();
  // Check if the session ID is valid
  const session = sessionIdCheck(quizId, sessionId);

  if (!session) {
    // Throw an error if the session is invalid
    throw HTTPError(BAD_REQUEST, INVALID_SESSION_ID_STR);
  } else if (session.info.state !== SessionState.FINAL_RESULTS) {
    // Throw an error if the session has not yet ended
    throw HTTPError(BAD_REQUEST, SESSION_NOT_END_STR);
  }

  setData(data);
  // Return the session results
  return session.results;
};

/**
 * Retrieves the results of a specified quiz session by CSV format.
 *
 * @param {number} quizId - The unique identifier of the quiz.
 * @param {number} sessionId - The unique identifier of the session.
 * @returns {sessionResultsCSVReturn} - a url of server to save the result by CSV format
 */
export const adminQuizSessionResultsCSV = (quizId: number, sessionId: number): sessionResultsCSVReturn => {
  const data = getData();
  // Check if the session ID is valid
  const session = sessionIdCheck(quizId, sessionId);

  if (!session) {
    // Throw an error if the session is invalid
    throw HTTPError(BAD_REQUEST, INVALID_SESSION_ID_STR);
  } else if (session.info.state !== SessionState.FINAL_RESULTS) {
    // Throw an error if the session has not yet ended
    throw HTTPError(BAD_REQUEST, SESSION_NOT_END_STR);
  }

  // Sort the session results by player name in ascending order
  session.resultsCSV.sort((a, b) => a.playerName.localeCompare(b.playerName));

  // define file name and save path
  const url = uuidv4();
  const csvPath = `${SERVER_URL}/csv/${url}.csv`;

  const csvData = convertResultToCSV(session.resultsCSV);

  const outputDir = path.join(__dirname, '../csv');

  // Save csv data to file
  fs.writeFileSync(path.join(outputDir, `${url}.csv`), csvData, { flag: 'w' });

  setData(data);
  return { url: csvPath };
};

/**
 * Retrieves lists of active and inactive sessions for a specified quiz.
 * Filters sessions based on their state and returns sorted arrays of session IDs.
 *
 * @param {number} quizId - The ID of the quiz whose sessions are being viewed.
 * @returns {AdminQuizViewSessionsReturn} - Object containing arrays of active and inactive session IDs.
 */
export const adminQuizViewSessions = (quizId: number): AdminQuizViewSessionsReturn => {
  const data = getData();

  // create an array of all the data sessions that are not ended and then extract only the sessionId
  const activeSessionsArr = data.sessions.filter(s => s.info.metadata.quizId === quizId && s.info.state !== 'END').map(s => s.sessionId);
  // similarly...
  const inactiveSessionsArr = data.sessions.filter(s => s.info.metadata.quizId === quizId && s.info.state === 'END').map(s => s.sessionId);

  // sort the sessions in ascending order
  const sortedSessions: AdminQuizViewSessionsReturn = {
    activeSessions: activeSessionsArr.sort((a, b) => a - b),
    inactiveSessions: inactiveSessionsArr.sort((a, b) => a - b),
  };

  return sortedSessions;
};

/**
 * Updates the state of a quiz session based on a specified action. Validates session ID and action,
 * then applies the action to change the session's state accordingly. Updates data store with new session state.
 * Returns an empty object on success or throws an error for invalid inputs or actions.
 *
 * @param {number} quizId - ID of the quiz associated with the session.
 * @param {number} sessionId - ID of the session to be updated.
 * @param {string} action - The action to be performed on the session.
 * @returns {EmptyObjectReturn} - An empty object upon successful update.
 */
export const adminQuizSessionUpdate = (quizId: number, sessionId: number, action: string): EmptyObjectReturn => {
  const data = getData();

  // find the session from data
  const findSession = sessionIdCheck(quizId, sessionId);
  if (!findSession) {
    throw HTTPError(BAD_REQUEST, 'session id is invalid');
  }

  if (!checkSessionAction(action)) {
    throw HTTPError(BAD_REQUEST, 'action is not a valid action enum');
  }

  if (findSession.info.state === SessionState.LOBBY) {
    if (action === SessionAction.NEXT_QUESTION) {
      // move it onto the next state
      findSession.info.state = SessionState.QUESTION_COUNTDOWN;
      // update the question we're at
      findSession.info.atQuestion += 1;

      const player = findSession.info.players
        .map(p => p.name)
        .sort((a, b) => a.localeCompare(b));
      const playerList: RankInfo[] = player
        .map(name => {
          return {
            name,
            score: 0
          };
        });
      const playerCSV: ResultCSVInfo[] = player
        .map(name => {
          return {
            playerName: name,
            questionScore: [],
            questionRank: []
          };
        });

      findSession.resultsCSV = playerCSV;
      findSession.results.usersRankedByScore = playerList;
      findSession.recentQuestionStartTime = Math.floor(Date.now() / 1000) + 3;

      // set a setTimeout to move onto QUESTION_OPEN after 3 seconds
      skipCountdownId = setTimeout(() => {
        findSession.info.state = SessionState.QUESTION_OPEN;
      }, 3000);

      // for END
    } else if (action === SessionAction.END) {
      clearTimeout(skipCountdownId);
      clearTimeout(questionOpenId);

      // move it onto the end state
      findSession.info.state = SessionState.END;
      findSession.info.atQuestion = 0;

      // for other
    } else {
      throw HTTPError(BAD_REQUEST, 'action is not valid for this session state');
    }

    // State QUESTION_COUNTDOWN
  } else if (findSession.info.state === SessionState.QUESTION_COUNTDOWN) {
    // for SKIP_COUNTdOWN
    if (action === SessionAction.SKIP_COUNTDOWN) {
      // need to clear the automatic skip to QUESTION_OPEN
      clearTimeout(skipCountdownId);
      findSession.info.state = SessionState.QUESTION_OPEN;
      findSession.recentQuestionStartTime = Math.floor(Date.now() / 1000);

      // find the duration of the question we are currently on in milliseconds
      const questionDuration: number = findSession.info.metadata.questions[findSession.info.atQuestion - 1].duration * 1000;

      // set timer to automatically skip to QUESTION_ClOSE after duration is over
      questionOpenId = setTimeout(() => {
        findSession.info.state = SessionState.QUESTION_CLOSE;
      }, questionDuration);

      // for END
    } else if (action === SessionAction.END) {
      clearTimeout(skipCountdownId);
      clearTimeout(questionOpenId);

      // move it onto the end state
      findSession.info.state = SessionState.END;
      findSession.info.atQuestion = 0;

      // for other
    } else {
      throw HTTPError(BAD_REQUEST, 'action is not valid for this session state');
    }

    // State QUESTION_OPEN
  } else if (findSession.info.state === SessionState.QUESTION_OPEN) {
    // for GO_TO_ANSWER
    if (action === SessionAction.GO_TO_ANSWER) {
      // make sure it doesn't go to QUESTION_CLOSE after 5 seconds
      clearTimeout(questionOpenId);
      scoreCalculate(sessionId);

      // move it onto the ANSWER_SHOW states
      findSession.info.state = SessionState.ANSWER_SHOW;

      // for END
    } else if (action === SessionAction.END) {
      clearTimeout(skipCountdownId);
      clearTimeout(questionOpenId);
      scoreCalculate(sessionId);

      // move it onto the end state
      findSession.info.state = SessionState.END;
      findSession.info.atQuestion = 0;

      // for other
    } else {
      throw HTTPError(BAD_REQUEST, 'action is not valid for this session state');
    }

    // State QUESTION_CLOSE
  } else if (findSession.info.state === SessionState.QUESTION_CLOSE) {
    // for GO_TO_ANSWER
    if (action === SessionAction.GO_TO_ANSWER) {
      scoreCalculate(sessionId);
      // move it onto the ANSWER_SHOW states
      findSession.info.state = SessionState.ANSWER_SHOW;

      // for NEXT_QUESTION
    } else if (action === SessionAction.NEXT_QUESTION) {
      scoreCalculate(sessionId);
      // move it onto the next state
      findSession.info.state = SessionState.QUESTION_COUNTDOWN;
      // update the question we're at
      findSession.info.atQuestion += 1;
      findSession.recentQuestionStartTime = Math.floor(Date.now() / 1000) + 3;

      // set a setTimeout to move onto QUESTION_OPEN after 3 seconds
      skipCountdownId = setTimeout(() => {
        findSession.info.state = SessionState.QUESTION_OPEN;
      }, 3000);

      // for GO_TO_FINAL_RESULTS
    } else if (action === SessionAction.GO_TO_FINAL_RESULTS) {
      scoreCalculate(sessionId);
      // move it onto the FiNAL_RESULTS states
      findSession.info.state = SessionState.FINAL_RESULTS;
      findSession.info.atQuestion = 0;

      // for END
    } else if (action === SessionAction.END) {
      scoreCalculate(sessionId);

      clearTimeout(skipCountdownId);
      clearTimeout(questionOpenId);
      // move it onto the end state
      findSession.info.state = SessionState.END;
      findSession.info.atQuestion = 0;

      // for other
    } else {
      throw HTTPError(BAD_REQUEST, 'action is not valid for this session state');
    }

    // State ANSWER_SHOW
  } else if (findSession.info.state === SessionState.ANSWER_SHOW) {
    if (action === SessionAction.NEXT_QUESTION) {
      // move it onto the next state
      findSession.info.state = SessionState.QUESTION_COUNTDOWN;
      // update the question we're at
      findSession.info.atQuestion += 1;

      // set a setTimeout to move onto QUESTION_OPEN after 3 seconds
      skipCountdownId = setTimeout(() => {
        findSession.info.state = SessionState.QUESTION_OPEN;
      }, 3000);

      // for GO_TO_FINAL_RESULTS
    } else if (action === SessionAction.GO_TO_FINAL_RESULTS) {
      // move it onto the FiNAL_RESULTS states
      findSession.info.state = SessionState.FINAL_RESULTS;
      findSession.info.atQuestion = 0;

      // for END
    } else if (action === SessionAction.END) {
      clearTimeout(skipCountdownId);
      clearTimeout(questionOpenId);

      // move it onto the end state
      findSession.info.state = SessionState.END;
      findSession.info.atQuestion = 0;

      // for other
    } else {
      throw HTTPError(BAD_REQUEST, 'action is not valid for this session state');
    }

    // State FINAL_RESULTS
  } else if (findSession.info.state === SessionState.FINAL_RESULTS) {
    if (action !== SessionAction.END) {
      throw HTTPError(BAD_REQUEST, 'action is not valid for this session state');
    } else {
      // for END
      clearTimeout(skipCountdownId);
      clearTimeout(questionOpenId);

      // move it onto the end state
      findSession.info.state = SessionState.END;
    }
  } else {
    throw HTTPError(BAD_REQUEST, 'action is not valid for this session state');
  }

  setData(data);

  return {};
};

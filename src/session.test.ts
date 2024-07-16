import {
  requestClear, requestAdminAuthRegister, requestAdminQuizCreate,
  requestAdminQuizCreateSession,
  requestAdminQuizCreateQuestionV2,
  requestAdminQuizSessionStatus,
  requestAdminQuizCreateV2,
  requestAdminQuizSessionResult,
  requestAdminQuizSessionResultCSV,
  requestAdminQuizViewSessions,
  requestAdminQuizSessionUpdate,
  requestPlayerJoin,
  requestAdminQuizInfoV2,
  requestsubmitPlayerAnswer
} from './testfunction';

import {
  CreateQuestionInput, QuizAnswer, SessionAction, SessionState
} from './interface';
import { sleepSync } from './playround.test';

const OK = 200;
const BAD_REQUEST = 400;
const UNAUTHORIZED = 401;
const FORBIDDEN = 403;

const ERROR = { error: expect.any(String) };
const colours = ['red', 'blue', 'yellow', 'green', 'brown', 'purple', 'orange'];

beforeEach(() => {
  requestClear();
});

describe('function testing: adminQuizCreateSession', () => {
  let token: string;
  let quizId: number;

  beforeEach(() => {
    requestClear();
    // registering user + quiz to use for all following test
    token = requestAdminAuthRegister('lisa.lin434@gmail.com', 'PassWord123', 'Lisa', 'Lin').object.token;
    quizId = requestAdminQuizCreateV2(token, 'lisa life', 'born in 2005').object.quizId;

    const createQuestionInput: CreateQuestionInput = {
      question: 'why am i doing this?',
      duration: 5,
      points: 4,
      answers: [
        {
          answer: 'i want good marks',
          correct: true
        },
        {
          answer: 'i wanna cry',
          correct: false
        }
      ],
      thumbnailUrl: 'https://media-cldnry.s-nbcnews.com/image/upload/t_fit-1240w,f_auto,q_auto:best/rockcms/2022-08/220805-domestic-cat-mjf-1540-382ba2.jpg'
    };
    // created question for quiz - as needed for successful session to start
    requestAdminQuizCreateQuestionV2(quizId, token, createQuestionInput);
  });

  test('valid token, but not owner of quiz', () => {
    const token2 = requestAdminAuthRegister('emma@gmail.com', 'AgnesT123', 'Hae', 'Kim').object.token;
    // quiz is owned by token not token2
    const response = requestAdminQuizCreateSession(quizId, 12, token2);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(FORBIDDEN);
  });

  test('token empty', () => {
    const response = requestAdminQuizCreateSession(quizId, 25, '');
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(UNAUTHORIZED);
  });

  test('token invalid', () => {
    // token does not exist
    const response = requestAdminQuizCreateSession(quizId, 41, (token + 100));
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(UNAUTHORIZED);
  });

  test('autoStartNum is number greater than 50', () => {
    const response = requestAdminQuizCreateSession(quizId, 51, token);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(BAD_REQUEST);
  });

  test('quiz with no questions', () => {
    // created new quiz with no questions
    const quizId2 = requestAdminQuizCreate(token, 'i just wanna sleep', 'real? frfr').object.quizId;
    const response = requestAdminQuizCreateSession(quizId2, 2, token);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(BAD_REQUEST);
  });

  test('valid creation of session', () => {
    const response = requestAdminQuizCreateSession(quizId, 3, token);
    expect(response.object).toStrictEqual({ sessionId: expect.any(Number) });
    expect(response.status).toStrictEqual(OK);
  });

  test('> 10 sessions not in end state exist', () => {
    // create 10 sessions of the same quiz
    for (let i = 0; i <= 10; i++) {
      requestAdminQuizCreateSession(quizId, 12, token);
    }
    // creating 11th one will cause an error
    const response = requestAdminQuizCreateSession(quizId, 3, token);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(BAD_REQUEST);
  });

  // if < 10 sessions are created - can still continue to create new ones
  test('valid: < 10 sessions not in end state exist', () => {
    // create 10 sessions of the same quiz
    for (let i = 0; i <= 8; i++) {
      requestAdminQuizCreateSession(quizId, 45, token);
    }
    const response = requestAdminQuizCreateSession(quizId, 3, token);
    expect(response.object).toStrictEqual({ sessionId: expect.any(Number) });
    expect(response.status).toStrictEqual(OK);
  });
});

describe('GET /v1/admin/quiz/{quizid}/session/{sessionid} test', () => {
  let token: string;
  let quizId: number;
  let questionId: number;
  let sessionId: number;
  const thumbnailUrl = 'https://media-cldnry.s-nbcnews.com/image/upload/t_fit-1240w,f_auto,q_auto:best/rockcms/2022-08/220805-domestic-cat-mjf-1540-382ba2.jpg';

  beforeEach(() => {
    requestClear();
    // registering user + quiz to use for all following test
    token = requestAdminAuthRegister('lisa.lin434@gmail.com', 'PassWord123', 'Lisa', 'Lin').object.token;
    quizId = requestAdminQuizCreateV2(token, 'lisa life', 'born in 2005').object.quizId;

    const createQuestionInput: CreateQuestionInput = {
      question: 'why am i doing this?',
      duration: 5,
      points: 4,
      answers: [
        {
          answer: 'i want good marks',
          correct: true
        },
        {
          answer: 'i wanna cry',
          correct: false
        }
      ],
      thumbnailUrl
    };
    // created question for quiz - as needed for successful session to start
    questionId = requestAdminQuizCreateQuestionV2(quizId, token, createQuestionInput).object.questionId;
    sessionId = requestAdminQuizCreateSession(quizId, 3, token).object.sessionId;
  });

  test('Empty token', () => {
    const response = requestAdminQuizSessionStatus(quizId, sessionId, '');
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(UNAUTHORIZED);
  });

  test('Invalid token', () => {
    const response = requestAdminQuizSessionStatus(quizId, sessionId, token + '1');
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(UNAUTHORIZED);
  });

  test('Invalid quiz', () => {
    const response = requestAdminQuizSessionStatus(quizId + 1, sessionId, token);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(FORBIDDEN);
  });

  test('Token not authorise for this quiz', () => {
    const newToken = requestAdminAuthRegister('newtoken@gmail.com', 'PassWord123', 'NEW', 'token').object.token;
    const response = requestAdminQuizSessionStatus(quizId, sessionId, newToken);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(FORBIDDEN);
  });

  test('Valid quiz but invalid sessionId', () => {
    const response = requestAdminQuizSessionStatus(quizId, -1, token);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(BAD_REQUEST);
  });

  test('Valid test', () => {
    const response = requestAdminQuizSessionStatus(quizId, sessionId, token);
    expect(response.status).toStrictEqual(OK);
    expect(response.object).toStrictEqual({
      state: 'LOBBY',
      atQuestion: 0,
      players: [],
      metadata: {
        quizId,
        name: 'lisa life',
        timeCreated: expect.any(Number),
        timeLastEdited: expect.any(Number),
        description: 'born in 2005',
        numQuestions: 1,
        questions: [
          {
            questionId,
            question: 'why am i doing this?',
            duration: 5,
            thumbnailUrl,
            points: 4,
            answers: [
              {
                answerId: expect.any(Number),
                answer: 'i want good marks',
                colour: expect.any(String),
                correct: true
              },
              {
                answerId: expect.any(Number),
                answer: 'i wanna cry',
                colour: expect.any(String),
                correct: false
              }
            ],
          }
        ],
        duration: expect.any(Number),
        thumbnailUrl: expect.any(String)
      }
    });
    response.object.metadata.questions.forEach((question: { answers: QuizAnswer[]; }) => {
      question.answers.forEach((answer: { colour: string; }) => {
        expect(colours).toContain(answer.colour);
      });
    });
  });
});

describe('GET /v1/admin/quiz/{quizid}/session/{sessionid}/results test', () => {
  let token: string;
  let quizId: number;
  let sessionId: number;
  const thumbnailUrl = 'https://media-cldnry.s-nbcnews.com/image/upload/t_fit-1240w,f_auto,q_auto:best/rockcms/2022-08/220805-domestic-cat-mjf-1540-382ba2.jpg';

  beforeEach(() => {
    requestClear();
    // registering user + quiz to use for all following test
    token = requestAdminAuthRegister('lisa.lin434@gmail.com', 'PassWord123', 'Lisa', 'Lin').object.token;
    quizId = requestAdminQuizCreateV2(token, 'lisa life', 'born in 2005').object.quizId;

    const createQuestionInput: CreateQuestionInput = {
      question: 'why am i doing this?',
      duration: 5,
      points: 4,
      answers: [
        {
          answer: 'i want good marks',
          correct: true
        },
        {
          answer: 'i wanna cry',
          correct: false
        }
      ],
      thumbnailUrl
    };
    // created question for quiz - as needed for successful session to start
    requestAdminQuizCreateQuestionV2(quizId, token, createQuestionInput);
    sessionId = requestAdminQuizCreateSession(quizId, 3, token).object.sessionId;
  });

  test('Empty token', () => {
    const response = requestAdminQuizSessionResult(quizId, sessionId, '');
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(UNAUTHORIZED);
  });

  test('Invalid token', () => {
    const response = requestAdminQuizSessionResult(quizId, sessionId, token + '1');
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(UNAUTHORIZED);
  });

  test('Invalid quiz', () => {
    const response = requestAdminQuizSessionResult(quizId + 1, sessionId, token);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(FORBIDDEN);
  });

  test('Token not authorise for this quiz', () => {
    const newToken = requestAdminAuthRegister('newtoken@gmail.com', 'PassWord123', 'NEW', 'token').object.token;
    const response = requestAdminQuizSessionResult(quizId, sessionId, newToken);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(FORBIDDEN);
  });

  test('Valid quiz but invalid sessionId', () => {
    const response = requestAdminQuizSessionResult(quizId, -1, token);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(BAD_REQUEST);
  });

  test('Valid quiz and session but not in FINAL_RESULTS', () => {
    const response = requestAdminQuizSessionResult(quizId, sessionId, token);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(BAD_REQUEST);
  });

  /// //////////////////////////////////////////////////////////////////////////
  /// ///////////////////// ADD MORE VALID TEST ////////////////////////////////
  /// //////////////////////////////////////////////////////////////////////////
});

describe('GET /v1/admin/quiz/{quizid}/session/{sessionid}/results/csv test', () => {
  let token: string;
  let quizId: number;
  let sessionId: number;
  const thumbnailUrl = 'https://media-cldnry.s-nbcnews.com/image/upload/t_fit-1240w,f_auto,q_auto:best/rockcms/2022-08/220805-domestic-cat-mjf-1540-382ba2.jpg';

  beforeEach(() => {
    requestClear();
    // registering user + quiz to use for all following test
    token = requestAdminAuthRegister('lisa.lin434@gmail.com', 'PassWord123', 'Lisa', 'Lin').object.token;
    quizId = requestAdminQuizCreateV2(token, 'lisa life', 'born in 2005').object.quizId;

    const createQuestionInput: CreateQuestionInput = {
      question: 'why am i doing this?',
      duration: 5,
      points: 4,
      answers: [
        {
          answer: 'i want good marks',
          correct: true
        },
        {
          answer: 'i wanna cry',
          correct: false
        }
      ],
      thumbnailUrl
    };
    // created question for quiz - as needed for successful session to start
    requestAdminQuizCreateQuestionV2(quizId, token, createQuestionInput);
    sessionId = requestAdminQuizCreateSession(quizId, 3, token).object.sessionId;
  });

  test('Empty token', () => {
    const response = requestAdminQuizSessionResultCSV(quizId, sessionId, '');
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(UNAUTHORIZED);
  });

  test('Invalid token', () => {
    const response = requestAdminQuizSessionResultCSV(quizId, sessionId, token + '1');
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(UNAUTHORIZED);
  });

  test('Invalid quiz', () => {
    const response = requestAdminQuizSessionResultCSV(quizId + 1, sessionId, token);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(FORBIDDEN);
  });

  test('Token not authorise for this quiz', () => {
    const newToken = requestAdminAuthRegister('newtoken@gmail.com', 'PassWord123', 'NEW', 'token').object.token;
    const response = requestAdminQuizSessionResultCSV(quizId, sessionId, newToken);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(FORBIDDEN);
  });

  test('Valid quiz but invalid sessionId', () => {
    const response = requestAdminQuizSessionResultCSV(quizId, -1, token);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(BAD_REQUEST);
  });

  test('Valid quiz and session but not in FINAL_RESULTS', () => {
    const response = requestAdminQuizSessionResultCSV(quizId, sessionId, token);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(BAD_REQUEST);
  });
});

/// ///////////////////////////////////////////////////////////////////////////////////////
/// ////////////////////////////// ADMIN QUIZ VIEW SESSIONS ///////////////////////////////
/// ///////////////////////////////////////////////////////////////////////////////////////
describe('function testing: adminQuizViewSessions', () => {
  let token: string;
  let quizId: number;

  beforeEach(() => {
    requestClear();
    // registering user + quiz to use for all following test
    token = requestAdminAuthRegister('emma.emma1@gmail.com', 'PassWord123', 'Yuval', 'Jason').object.token;
    quizId = requestAdminQuizCreateV2(token, 'ra ra room', 'im in me mums car').object.quizId;

    const createQuestionInput: CreateQuestionInput = {
      question: 'are all men trash?',
      duration: 5,
      points: 4,
      answers: [
        {
          answer: 'lol ofc',
          correct: true
        },
        {
          answer: 'no they are wonderful',
          correct: false
        }
      ],
      thumbnailUrl: 'https://media-cldnry.s-nbcnews.com/image/upload/t_fit-1240w,f_auto,q_auto:best/rockcms/2022-08/220805-domestic-cat-mjf-1540-382ba2.jpg'
    };

    // created question for quiz - as needed for successful session to start
    requestAdminQuizCreateQuestionV2(quizId, token, createQuestionInput);
  });

  // ===================================== UNAUTHORIZED = 401 ERROR =====================================
  test('empty token, quizid valid', () => {
    // check that empty tokens return ERROR
    const response = requestAdminQuizViewSessions('', quizId);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(UNAUTHORIZED);
  });

  test('invalid token, quizid valid', () => {
    // check that empty tokens return ERROR
    const response = requestAdminQuizViewSessions((token + '100'), quizId);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(UNAUTHORIZED);
  });

  test('empty/invalid token, invalid quizId', () => {
    // check that invalid or empty tokens return ERROR
    // despite invalid quizId
    const response1 = requestAdminQuizViewSessions((token + '100'), (quizId + 100));
    expect(response1.object).toStrictEqual(ERROR);
    expect(response1.status).toStrictEqual(UNAUTHORIZED);

    const response2 = requestAdminQuizViewSessions('', (quizId + 100));
    expect(response2.object).toStrictEqual(ERROR);
    expect(response2.status).toStrictEqual(UNAUTHORIZED);
  });

  // ======================================= FORBIDDEN = 403 ERROR =======================================
  test('valid token but quizId invalid', () => {
    // given a valid token, check that an invalid quiz id means that a FORBIDDEN ERROR is returned
    const response = requestAdminQuizViewSessions(token, (quizId + 100));
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(FORBIDDEN);
  });

  test('valid token but user specified by token not an owner of quizId', () => {
    // given a valid token, check that an invalid quiz id means that a FORBIDDEN ERROR is returned
    const token2 = requestAdminAuthRegister('lisa.lisa2@gmail.com', 'PassWord123', 'Jason', 'Yuval').object.token;
    const quizId2 = requestAdminQuizCreateV2(token2, 'ra ra room', 'im in me mums car').object.quizId;

    const response = requestAdminQuizViewSessions(token, quizId2);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(FORBIDDEN);
  });

  // ============================================= SUCCESS =============================================
  test('successfully view all sessions, check return - no sessions', () => {
    // for the quizId owned by token user, create no sessions
    const response = requestAdminQuizViewSessions(token, quizId);
    expect(response.object).toStrictEqual({
      activeSessions: [],
      inactiveSessions: [],
    });
    expect(response.status).toStrictEqual(OK);
  });

  test('successfully view all sessions, check return - one active session', () => {
    // for the quizId owned by token user, create session
    const sessionId = requestAdminQuizCreateSession(quizId, 1, token).object.sessionId;

    const response = requestAdminQuizViewSessions(token, quizId);
    expect(response.object).toStrictEqual({
      activeSessions: [sessionId],
      inactiveSessions: [],
    });
    expect(response.status).toStrictEqual(OK);
  });

  test('successfully view all sessions, check return - one inactive session', () => {
    // for the quizId owned by token user, create session
    const sessionId = requestAdminQuizCreateSession(quizId, 1, token).object.sessionId;

    requestAdminQuizSessionUpdate(token, quizId, sessionId, 'END');

    const response = requestAdminQuizViewSessions(token, quizId);
    expect(response.object).toStrictEqual({
      activeSessions: [],
      inactiveSessions: [sessionId],
    });
    expect(response.status).toStrictEqual(OK);
  });

  test('successfully view all sessions, check return - one inactive, one active session', () => {
    // for the quizId owned by token user, create two sessions
    const sessionId1 = requestAdminQuizCreateSession(quizId, 1, token).object.sessionId;
    const sessionId2 = requestAdminQuizCreateSession(quizId, 1, token).object.sessionId;

    // end the second session
    requestAdminQuizSessionUpdate(token, quizId, sessionId2, 'END');

    const response = requestAdminQuizViewSessions(token, quizId);
    expect(response.object).toStrictEqual({
      activeSessions: [sessionId1],
      inactiveSessions: [sessionId2],
    });
    expect(response.status).toStrictEqual(OK);
  });

  test('successfully view all sessions, check return - multiple inactives', () => {
    // for the quizId owned by token user, create two sessions
    const sessionId1 = requestAdminQuizCreateSession(quizId, 1, token).object.sessionId;
    const sessionId2 = requestAdminQuizCreateSession(quizId, 1, token).object.sessionId;

    // end the second session
    requestAdminQuizSessionUpdate(token, quizId, sessionId2, 'END');
    requestAdminQuizSessionUpdate(token, quizId, sessionId1, 'END');

    const response = requestAdminQuizViewSessions(token, quizId);

    if (sessionId1 > sessionId2) {
      expect(response.object).toStrictEqual({
        activeSessions: [],
        inactiveSessions: [sessionId2, sessionId1],
      });
      expect(response.status).toStrictEqual(OK);
    } else if (sessionId1 < sessionId2) {
      expect(response.object).toStrictEqual({
        activeSessions: [],
        inactiveSessions: [sessionId1, sessionId2],
      });
      expect(response.status).toStrictEqual(OK);
    }
  });

  test('successfully view all sessions, check return - multiple actives', () => {
    // for the quizId owned by token user, create two sessions
    const sessionId1 = requestAdminQuizCreateSession(quizId, 1, token).object.sessionId;
    const sessionId2 = requestAdminQuizCreateSession(quizId, 1, token).object.sessionId;

    const response = requestAdminQuizViewSessions(token, quizId);

    if (sessionId1 > sessionId2) {
      expect(response.object).toStrictEqual({
        activeSessions: [sessionId2, sessionId1],
        inactiveSessions: [],
      });
      expect(response.status).toStrictEqual(OK);
    } else if (sessionId1 < sessionId2) {
      expect(response.object).toStrictEqual({
        activeSessions: [sessionId1, sessionId2],
        inactiveSessions: [],
      });
      expect(response.status).toStrictEqual(OK);
    }
  });
});

// vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv
describe('function testing: adminQuizSessionUpdate', () => {
  let token: string;
  let quizId: number;
  let sessionId: number;
  let createQuestionInput: CreateQuestionInput;

  beforeEach(() => {
    requestClear();
    // registering user + quiz to use for all following test
    token = requestAdminAuthRegister('emma.emma1@gmail.com', 'PassWord123', 'Yuval', 'Jason').object.token;
    quizId = requestAdminQuizCreateV2(token, 'ra ra room', 'im in me mums car').object.quizId;

    createQuestionInput = {
      question: 'best aot man?',
      duration: 0.1,
      points: 4,
      answers: [
        {
          answer: 'levi',
          correct: true
        },
        {
          answer: 'eren',
          correct: true
        },
        {
          answer: 'armin',
          correct: true
        },
        {
          answer: 'jean',
          correct: false
        }
      ],
      thumbnailUrl: 'https://media-cldnry.s-nbcnews.com/image/upload/t_fit-1240w,f_auto,q_auto:best/rockcms/2022-08/220805-domestic-cat-mjf-1540-382ba2.jpg'
    };

    const createQuestionInput2: CreateQuestionInput = {
      question: 'best aot woman?',
      duration: 0.1,
      points: 4,
      answers: [
        {
          answer: 'mikasa',
          correct: true
        },
        {
          answer: 'historia',
          correct: true
        },
        {
          answer: 'sasha',
          correct: true
        },
        {
          answer: 'gabi',
          correct: false
        }
      ],
      thumbnailUrl: 'https://media-cldnry.s-nbcnews.com/image/upload/t_fit-1240w,f_auto,q_auto:best/rockcms/2022-08/220805-domestic-cat-mjf-1540-382ba2.jpg'
    };

    // created question for quiz - as needed for successful session to start
    requestAdminQuizCreateQuestionV2(quizId, token, createQuestionInput);
    requestAdminQuizCreateQuestionV2(quizId, token, createQuestionInput2);

    sessionId = requestAdminQuizCreateSession(quizId, 1, token).object.sessionId;
  });

  // ===================================== UNAUTHORIZED = 401 ERROR =====================================
  test('empty token but quizid, sessionid and answers valid', () => {
    // check that empty tokens return ERROR
    const response = requestAdminQuizSessionUpdate('', quizId, sessionId, SessionAction.NEXT_QUESTION);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(UNAUTHORIZED);
  });

  test('empty token but quizid, sessionid and answers valid', () => {
    // check that invalid tokens return ERROR
    const response = requestAdminQuizSessionUpdate((token + '100'), quizId, sessionId, SessionAction.NEXT_QUESTION);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(UNAUTHORIZED);
  });

  test('empty/invalid token, invalid quizId', () => {
    // check that invalid or empty tokens return ERROR
    // despite invalid quizId
    const response1 = requestAdminQuizSessionUpdate('', quizId + 100, sessionId, SessionAction.NEXT_QUESTION);
    expect(response1.object).toStrictEqual(ERROR);
    expect(response1.status).toStrictEqual(UNAUTHORIZED);

    const response2 = requestAdminQuizSessionUpdate((token + '100'), quizId + 100, sessionId, SessionAction.NEXT_QUESTION);
    expect(response2.object).toStrictEqual(ERROR);
    expect(response2.status).toStrictEqual(UNAUTHORIZED);
  });

  test('empty/invalid token, invalid sessionId', () => {
    // check that invalid or empty tokens return ERROR
    // despite invalid sessionId
    const response1 = requestAdminQuizSessionUpdate('', quizId, sessionId + 100, SessionAction.NEXT_QUESTION);
    expect(response1.object).toStrictEqual(ERROR);
    expect(response1.status).toStrictEqual(UNAUTHORIZED);

    const response2 = requestAdminQuizSessionUpdate((token + '100'), quizId, sessionId + 100, SessionAction.NEXT_QUESTION);
    expect(response2.object).toStrictEqual(ERROR);
    expect(response2.status).toStrictEqual(UNAUTHORIZED);
  });

  test('empty/invalid token, invalid action enum', () => {
    const response1 = requestAdminQuizSessionUpdate('', quizId, sessionId, 'random string');
    expect(response1.object).toStrictEqual(ERROR);
    expect(response1.status).toStrictEqual(UNAUTHORIZED);

    const response2 = requestAdminQuizSessionUpdate((token + '100'), quizId, sessionId, 'random string');
    expect(response2.object).toStrictEqual(ERROR);
    expect(response2.status).toStrictEqual(UNAUTHORIZED);
  });

  // ======================================= FORBIDDEN = 403 ERROR =======================================
  test('valid token but quizId invalid, everything else valid', () => {
    // given a valid token, check that an invalid quiz id means that a FORBIDDEN ERROR is returned
    const response = requestAdminQuizSessionUpdate(token, quizId + 100, sessionId, SessionAction.NEXT_QUESTION);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(FORBIDDEN);
  });

  test('valid token but user specified by token not an owner of quizId, everything else valid', () => {
    // given a valid token, check that an invalid quiz id means that a FORBIDDEN ERROR is returned
    const token2 = requestAdminAuthRegister('lisa.lisa2@gmail.com', 'PassWord123', 'Jason', 'Yuval').object.token;
    requestAdminQuizCreateV2(token2, 'ra ra room', 'im in me mums car');

    const response = requestAdminQuizSessionUpdate(token2, quizId, sessionId, SessionAction.NEXT_QUESTION);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(FORBIDDEN);
  });

  test('valid token but quizId invalid, sessionId invalid', () => {
    // given a valid token, check that an invalid quiz id means that a FORBIDDEN ERROR is returned
    // despite sessionId invalid
    const response = requestAdminQuizSessionUpdate(token, quizId + 100, sessionId + 100, SessionAction.NEXT_QUESTION);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(FORBIDDEN);
  });

  test('valid token but quizId invalid, invalid action enum', () => {
    // given a valid token, check that an invalid quiz id means that a FORBIDDEN ERROR is returned
    // despite action enum invalid
    const response = requestAdminQuizSessionUpdate(token, quizId + 100, sessionId, 'random string');
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(FORBIDDEN);
  });

  test('valid token but user specified by token not an owner of quizId, everything else valid', () => {
    // given a valid token, check that an invalid quiz id means that a FORBIDDEN ERROR is returned
    // despite sessionId invalid
    const token2 = requestAdminAuthRegister('lisa.lisa2@gmail.com', 'PassWord123', 'Jason', 'Yuval').object.token;
    requestAdminQuizCreateV2(token2, 'ra ra room', 'im in me mums car');

    const response = requestAdminQuizSessionUpdate(token2, quizId, sessionId + 100, SessionAction.NEXT_QUESTION);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(FORBIDDEN);
  });

  // ====================================== BAD_REQUEST = 400 ERROR ======================================
  test('sessionId does not refer to a valid session within the quiz', () => {
    // create a new quiz and a new session
    const quizId2 = requestAdminQuizCreateV2(token, 'woo hoo rum', 'ra ra idk lol').object.quizId;
    requestAdminQuizCreateQuestionV2(quizId2, token, createQuestionInput);
    const sessionId2 = requestAdminQuizCreateSession(quizId2, 1, token).object.sessionId;

    const response1 = requestAdminQuizSessionUpdate(token, quizId2, sessionId, SessionAction.NEXT_QUESTION);
    expect(response1.object).toStrictEqual(ERROR);
    expect(response1.status).toStrictEqual(BAD_REQUEST);

    const response2 = requestAdminQuizSessionUpdate(token, quizId, sessionId2, SessionAction.NEXT_QUESTION);
    expect(response2.object).toStrictEqual(ERROR);
    expect(response2.status).toStrictEqual(BAD_REQUEST);
  });

  test('invalid action enum', () => {
    const response = requestAdminQuizSessionUpdate(token, quizId, sessionId, 'random string');
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(BAD_REQUEST);
  });

  test('action enum cannot be applied in the current state: LOBBY STATE', () => {
    // when the session is create, it's in lobby
    // can: NEXT_QUESTION, END
    const response1 = requestAdminQuizSessionUpdate(token, quizId, sessionId, SessionAction.SKIP_COUNTDOWN);
    expect(response1.object).toStrictEqual(ERROR);
    expect(response1.status).toStrictEqual(BAD_REQUEST);

    const response2 = requestAdminQuizSessionUpdate(token, quizId, sessionId, SessionAction.GO_TO_ANSWER);
    expect(response2.object).toStrictEqual(ERROR);
    expect(response2.status).toStrictEqual(BAD_REQUEST);

    const response3 = requestAdminQuizSessionUpdate(token, quizId, sessionId, SessionAction.GO_TO_FINAL_RESULTS);
    expect(response3.object).toStrictEqual(ERROR);
    expect(response3.status).toStrictEqual(BAD_REQUEST);
  });

  // MAKE SURE WITHIN 3 SECONDS
  // so that it doesnt automatically go to QUESTION_OPEN (can SKIP_COUNTDOWN)
  test('action enum cannot be applied in the current state: QUESTION_COUNTDOWN STATE', () => {
    // get it to QUESTION_COUNTDOWN state
    // can: SKIP_COUNTDOWN, END
    requestAdminQuizSessionUpdate(token, quizId, sessionId, SessionAction.NEXT_QUESTION);

    // in three seconds it will go to QUESTION_OPEN automatically
    const response1 = requestAdminQuizSessionUpdate(token, quizId, sessionId, SessionAction.NEXT_QUESTION);
    expect(response1.object).toStrictEqual(ERROR);
    expect(response1.status).toStrictEqual(BAD_REQUEST);

    const response2 = requestAdminQuizSessionUpdate(token, quizId, sessionId, SessionAction.GO_TO_ANSWER);
    expect(response2.object).toStrictEqual(ERROR);
    expect(response2.status).toStrictEqual(BAD_REQUEST);

    const response3 = requestAdminQuizSessionUpdate(token, quizId, sessionId, SessionAction.GO_TO_FINAL_RESULTS);
    expect(response3.object).toStrictEqual(ERROR);
    expect(response3.status).toStrictEqual(BAD_REQUEST);
  });

  // MAKE SURE WITHIN 3 SECONDS
  // so that it doesnt automatically go to QUESTION_OPEN (can SKIP_COUNTDOWN)
  // MAKE SURE WITHIN QUESTION DURATION
  // so that it doesn't automatically go from between QUESTION_OPEN and QUESTION_CLOSE
  test('action enum cannot be applied in the current state: QUESTION_OPEN STATE', () => {
    // get it to QUESTION_OPEN state
    // can: GO_TO_ANSWER, END
    requestAdminQuizSessionUpdate(token, quizId, sessionId, SessionAction.NEXT_QUESTION);
    requestAdminQuizSessionUpdate(token, quizId, sessionId, SessionAction.SKIP_COUNTDOWN);

    // in question duration (5 seconds), it will go to QUESTION_CLOSE automatically
    const response1 = requestAdminQuizSessionUpdate(token, quizId, sessionId, SessionAction.NEXT_QUESTION);
    expect(response1.object).toStrictEqual(ERROR);
    expect(response1.status).toStrictEqual(BAD_REQUEST);

    const response2 = requestAdminQuizSessionUpdate(token, quizId, sessionId, SessionAction.SKIP_COUNTDOWN);
    expect(response2.object).toStrictEqual(ERROR);
    expect(response2.status).toStrictEqual(BAD_REQUEST);

    const response3 = requestAdminQuizSessionUpdate(token, quizId, sessionId, SessionAction.GO_TO_FINAL_RESULTS);
    expect(response3.object).toStrictEqual(ERROR);
    expect(response3.status).toStrictEqual(BAD_REQUEST);
  });

  // MAKE SURE WITHIN 3 SECONDS
  // so that it doesnt automatically go to QUESTION_OPEN (can SKIP_COUNTDOWN)
  test('action enum cannot be applied in the current state: QUESTION_CLOSE STATE', () => {
    // get it to QUESTION_OPEN state
    // can: NEXT_QUESTION, GO_TO_ANSWER, GO_TO_FINAL_RESULTS, END
    requestAdminQuizSessionUpdate(token, quizId, sessionId, SessionAction.NEXT_QUESTION);
    requestAdminQuizSessionUpdate(token, quizId, sessionId, SessionAction.SKIP_COUNTDOWN);

    sleepSync(105);

    const response = requestAdminQuizSessionUpdate(token, quizId, sessionId, SessionAction.SKIP_COUNTDOWN);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(BAD_REQUEST);
  });

  // MAKE SURE WITHIN 3 SECONDS
  // so that it doesnt automatically go to QUESTION_OPEN (can SKIP_COUNTDOWN)
  // MAKE SURE WITHIN QUESTION DURATION
  // so that it doesn't automatically go from between QUESTION_OPEN and QUESTION_CLOSE
  test('action enum cannot be applied in the current state: FINAL_RESULTS STATE', () => {
    // get it to FINAL_RESULTS state
    // can: END
    requestAdminQuizSessionUpdate(token, quizId, sessionId, SessionAction.NEXT_QUESTION);
    requestAdminQuizSessionUpdate(token, quizId, sessionId, SessionAction.SKIP_COUNTDOWN);
    // go from QUESTION_OPEN -> ANSWER_SHOW (make sure within 5 s)
    requestAdminQuizSessionUpdate(token, quizId, sessionId, SessionAction.GO_TO_ANSWER);
    requestAdminQuizSessionUpdate(token, quizId, sessionId, SessionAction.GO_TO_FINAL_RESULTS);

    const response1 = requestAdminQuizSessionUpdate(token, quizId, sessionId, SessionAction.NEXT_QUESTION);
    expect(response1.object).toStrictEqual(ERROR);
    expect(response1.status).toStrictEqual(BAD_REQUEST);

    const response2 = requestAdminQuizSessionUpdate(token, quizId, sessionId, SessionAction.SKIP_COUNTDOWN);
    expect(response2.object).toStrictEqual(ERROR);
    expect(response2.status).toStrictEqual(BAD_REQUEST);

    const response3 = requestAdminQuizSessionUpdate(token, quizId, sessionId, SessionAction.GO_TO_ANSWER);
    expect(response3.object).toStrictEqual(ERROR);
    expect(response3.status).toStrictEqual(BAD_REQUEST);

    const response4 = requestAdminQuizSessionUpdate(token, quizId, sessionId, SessionAction.GO_TO_FINAL_RESULTS);
    expect(response4.object).toStrictEqual(ERROR);
    expect(response4.status).toStrictEqual(BAD_REQUEST);
  });

  // MAKE SURE WITHIN 3 SECONDS
  // so that it doesnt automatically go to QUESTION_OPEN (can SKIP_COUNTDOWN)
  // MAKE SURE WITHIN QUESTION DURATION
  // so that it doesn't automatically go from between QUESTION_OPEN and QUESTION_CLOSE
  test('action enum cannot be applied in the current state: ANSWER_SHOW STATE', () => {
    // get it to ANSWER_SHOW state
    // can: GO_TO_FINAL_RESULTS, NEXT_QUESTION, END
    requestAdminQuizSessionUpdate(token, quizId, sessionId, SessionAction.NEXT_QUESTION);
    requestAdminQuizSessionUpdate(token, quizId, sessionId, SessionAction.SKIP_COUNTDOWN);
    requestAdminQuizSessionUpdate(token, quizId, sessionId, SessionAction.GO_TO_ANSWER);

    const response2 = requestAdminQuizSessionUpdate(token, quizId, sessionId, SessionAction.SKIP_COUNTDOWN);
    expect(response2.object).toStrictEqual(ERROR);
    expect(response2.status).toStrictEqual(BAD_REQUEST);

    const response3 = requestAdminQuizSessionUpdate(token, quizId, sessionId, SessionAction.GO_TO_ANSWER);
    expect(response3.object).toStrictEqual(ERROR);
    expect(response3.status).toStrictEqual(BAD_REQUEST);
  });

  test('action enum cannot be applied in the current state: END STATE', () => {
    // get it to END state
    // can: nothing
    requestAdminQuizSessionUpdate(token, quizId, sessionId, SessionAction.END);

    const response1 = requestAdminQuizSessionUpdate(token, quizId, sessionId, SessionAction.NEXT_QUESTION);
    expect(response1.object).toStrictEqual(ERROR);
    expect(response1.status).toStrictEqual(BAD_REQUEST);

    const response2 = requestAdminQuizSessionUpdate(token, quizId, sessionId, SessionAction.SKIP_COUNTDOWN);
    expect(response2.object).toStrictEqual(ERROR);
    expect(response2.status).toStrictEqual(BAD_REQUEST);

    const response3 = requestAdminQuizSessionUpdate(token, quizId, sessionId, SessionAction.GO_TO_ANSWER);
    expect(response3.object).toStrictEqual(ERROR);
    expect(response3.status).toStrictEqual(BAD_REQUEST);

    const response4 = requestAdminQuizSessionUpdate(token, quizId, sessionId, SessionAction.GO_TO_FINAL_RESULTS);
    expect(response4.object).toStrictEqual(ERROR);
    expect(response4.status).toStrictEqual(BAD_REQUEST);

    const response5 = requestAdminQuizSessionUpdate(token, quizId, sessionId, SessionAction.END);
    expect(response5.object).toStrictEqual(ERROR);
    expect(response5.status).toStrictEqual(BAD_REQUEST);
  });

  // ============================================= SUCCESS =============================================
  test('check success return: from LOBBY > END', () => {
    const response = requestAdminQuizSessionUpdate(token, quizId, sessionId, SessionAction.END);
    expect(response.object).toStrictEqual({});
    expect(response.status).toStrictEqual(OK);

    expect(requestAdminQuizSessionStatus(quizId, sessionId, token).object.state).toStrictEqual(SessionState.END);
  });

  test('check success return: from LOBBY > NEXT_QUESTION', () => {
    const response = requestAdminQuizSessionUpdate(token, quizId, sessionId, SessionAction.NEXT_QUESTION);
    expect(response.object).toStrictEqual({});
    expect(response.status).toStrictEqual(OK);

    expect(requestAdminQuizSessionStatus(quizId, sessionId, token).object.state).toStrictEqual(SessionState.QUESTION_COUNTDOWN);
  });

  // MAKE SURE WITHIN 3 SECONDS
  // so that it doesnt automatically go to QUESTION_OPEN (can SKIP_COUNTDOWN)
  test('check success return: from QUESTION_COUNTDOWN > SKIP_COUNTDOWN', () => {
    // get it to QUESTION_COUNTDOWN state
    requestAdminQuizSessionUpdate(token, quizId, sessionId, SessionAction.NEXT_QUESTION);

    const response = requestAdminQuizSessionUpdate(token, quizId, sessionId, SessionAction.SKIP_COUNTDOWN);
    expect(response.object).toStrictEqual({});
    expect(response.status).toStrictEqual(OK);

    expect(requestAdminQuizSessionStatus(quizId, sessionId, token).object.state).toStrictEqual(SessionState.QUESTION_OPEN);
  });

  // MAKE SURE WITHIN 3 SECONDS
  // so that it doesnt automatically go to QUESTION_OPEN (can SKIP_COUNTDOWN)
  test('check success return: from QUESTION_COUNTDOWN > END', () => {
    // get it to QUESTION_COUNTDOWN state
    requestAdminQuizSessionUpdate(token, quizId, sessionId, SessionAction.NEXT_QUESTION);

    const response = requestAdminQuizSessionUpdate(token, quizId, sessionId, SessionAction.END);
    expect(response.object).toStrictEqual({});
    expect(response.status).toStrictEqual(OK);

    expect(requestAdminQuizSessionStatus(quizId, sessionId, token).object.state).toStrictEqual(SessionState.END);
  });

  // MAKE SURE WITHIN 3 SECONDS
  // so that it doesnt automatically go to QUESTION_OPEN (can SKIP_COUNTDOWN)
  // MAKE SURE WITHIN QUESTION DURATION
  // so that it doesn't automatically go from between QUESTION_OPEN and QUESTION_CLOSE
  test('check success return: from QUESTION_OPEN > GO_TO_ANSWER', () => {
    // get it to QUESTION_OPEN state
    requestAdminQuizSessionUpdate(token, quizId, sessionId, SessionAction.NEXT_QUESTION);
    requestAdminQuizSessionUpdate(token, quizId, sessionId, SessionAction.SKIP_COUNTDOWN);

    // make sure within 5 seconds
    const response = requestAdminQuizSessionUpdate(token, quizId, sessionId, SessionAction.GO_TO_ANSWER);
    expect(response.object).toStrictEqual({});
    expect(response.status).toStrictEqual(OK);

    expect(requestAdminQuizSessionStatus(quizId, sessionId, token).object.state).toStrictEqual(SessionState.ANSWER_SHOW);
  });

  // MAKE SURE WITHIN 3 SECONDS
  // so that it doesnt automatically go to QUESTION_OPEN (can SKIP_COUNTDOWN)
  // MAKE SURE WITHIN QUESTION DURATION
  // so that it doesn't automatically go from between QUESTION_OPEN and QUESTION_CLOSE
  test('check success return: from QUESTION_OPEN > END', () => {
    // get it to QUESTION_OPEN state
    requestAdminQuizSessionUpdate(token, quizId, sessionId, SessionAction.NEXT_QUESTION);
    requestAdminQuizSessionUpdate(token, quizId, sessionId, SessionAction.SKIP_COUNTDOWN);

    // make sure within 5 seconds
    const response = requestAdminQuizSessionUpdate(token, quizId, sessionId, SessionAction.END);
    expect(response.object).toStrictEqual({});
    expect(response.status).toStrictEqual(OK);

    expect(requestAdminQuizSessionStatus(quizId, sessionId, token).object.state).toStrictEqual(SessionState.END);
  });

  // MAKE SURE WITHIN 3 SECONDS
  // so that it doesnt automatically go to QUESTION_OPEN (can SKIP_COUNTDOWN)
  // MAKE SURE WITHIN QUESTION DURATION
  // so that it doesn't automatically go from between QUESTION_OPEN and QUESTION_CLOSE
  test('check success return: from ANSWER_SHOW > GO_TO_FINAL_RESULTS', () => {
    // get it to ANSWER_SHOW state
    requestAdminQuizSessionUpdate(token, quizId, sessionId, SessionAction.NEXT_QUESTION);
    requestAdminQuizSessionUpdate(token, quizId, sessionId, SessionAction.SKIP_COUNTDOWN);
    requestAdminQuizSessionUpdate(token, quizId, sessionId, SessionAction.GO_TO_ANSWER);

    const response = requestAdminQuizSessionUpdate(token, quizId, sessionId, SessionAction.GO_TO_FINAL_RESULTS);
    expect(response.object).toStrictEqual({});
    expect(response.status).toStrictEqual(OK);

    expect(requestAdminQuizSessionStatus(quizId, sessionId, token).object.state).toStrictEqual(SessionState.FINAL_RESULTS);
  });

  // MAKE SURE WITHIN 3 SECONDS
  // so that it doesnt automatically go to QUESTION_OPEN (can SKIP_COUNTDOWN)
  // MAKE SURE WITHIN QUESTION DURATION
  // so that it doesn't automatically go from between QUESTION_OPEN and QUESTION_CLOSE
  test('check success return: from ANSWER_SHOW > END', () => {
    // get it to ANSWER_SHOW state
    requestAdminQuizSessionUpdate(token, quizId, sessionId, SessionAction.NEXT_QUESTION);
    requestAdminQuizSessionUpdate(token, quizId, sessionId, SessionAction.SKIP_COUNTDOWN);
    requestAdminQuizSessionUpdate(token, quizId, sessionId, SessionAction.GO_TO_ANSWER);

    const response = requestAdminQuizSessionUpdate(token, quizId, sessionId, SessionAction.END);
    expect(response.object).toStrictEqual({});
    expect(response.status).toStrictEqual(OK);

    expect(requestAdminQuizSessionStatus(quizId, sessionId, token).object.state).toStrictEqual(SessionState.END);
  });

  // MAKE SURE WITHIN 3 SECONDS
  // so that it doesnt automatically go to QUESTION_OPEN (can SKIP_COUNTDOWN)
  // MAKE SURE WITHIN QUESTION DURATION
  // so that it doesn't automatically go from between QUESTION_OPEN and QUESTION_CLOSE
  test('check success return: from ANSWER_SHOW > NEXT_QUESTION', () => {
    // get it to ANSWER_SHOW state
    requestAdminQuizSessionUpdate(token, quizId, sessionId, SessionAction.NEXT_QUESTION);
    requestAdminQuizSessionUpdate(token, quizId, sessionId, SessionAction.SKIP_COUNTDOWN);
    requestAdminQuizSessionUpdate(token, quizId, sessionId, SessionAction.GO_TO_ANSWER);

    const response = requestAdminQuizSessionUpdate(token, quizId, sessionId, SessionAction.NEXT_QUESTION);
    expect(response.object).toStrictEqual({});
    expect(response.status).toStrictEqual(OK);

    expect(requestAdminQuizSessionStatus(quizId, sessionId, token).object.state).toStrictEqual(SessionState.QUESTION_COUNTDOWN);
  });

  // MAKE SURE WITHIN 3 SECONDS
  // so that it doesnt automatically go to QUESTION_OPEN (can SKIP_COUNTDOWN)
  // MAKE SURE WITHIN QUESTION DURATION
  // so that it doesn't automatically go from between QUESTION_OPEN and QUESTION_CLOSE
  test('check FINAL_RESULTS return: from FINAL_RESULTS > END', () => {
    // get it to ANSWER_SHOW state
    requestAdminQuizSessionUpdate(token, quizId, sessionId, SessionAction.NEXT_QUESTION);
    requestAdminQuizSessionUpdate(token, quizId, sessionId, SessionAction.SKIP_COUNTDOWN);
    requestAdminQuizSessionUpdate(token, quizId, sessionId, SessionAction.GO_TO_ANSWER);
    requestAdminQuizSessionUpdate(token, quizId, sessionId, SessionAction.GO_TO_FINAL_RESULTS);

    const response = requestAdminQuizSessionUpdate(token, quizId, sessionId, SessionAction.END);
    expect(response.object).toStrictEqual({});
    expect(response.status).toStrictEqual(OK);

    expect(requestAdminQuizSessionStatus(quizId, sessionId, token).object.state).toStrictEqual(SessionState.END);
  });

  // MAKE SURE WITHIN 3 SECONDS
  // so that it doesnt automatically go to QUESTION_OPEN (can SKIP_COUNTDOWN)
  // MAKE SURE WITHIN QUESTION DURATION
  // so that it doesn't automatically go from between QUESTION_OPEN and QUESTION_CLOSE
  test('check success return: from QUESTION_CLOSE > GO_TO_ANSWER', () => {
    // get it to QUESTION_CLOSE state
    requestAdminQuizSessionUpdate(token, quizId, sessionId, SessionAction.NEXT_QUESTION);
    requestAdminQuizSessionUpdate(token, quizId, sessionId, SessionAction.SKIP_COUNTDOWN);

    sleepSync(105);

    const response = requestAdminQuizSessionUpdate(token, quizId, sessionId, SessionAction.GO_TO_ANSWER);
    expect(response.object).toStrictEqual({});
    expect(response.status).toStrictEqual(OK);

    expect(requestAdminQuizSessionStatus(quizId, sessionId, token).object.state).toStrictEqual(SessionState.ANSWER_SHOW);
  });

  // MAKE SURE WITHIN 3 SECONDS
  // so that it doesnt automatically go to QUESTION_OPEN (can SKIP_COUNTDOWN)
  // MAKE SURE WITHIN QUESTION DURATION
  // so that it doesn't automatically go from between QUESTION_OPEN and QUESTION_CLOSE
  test('check success return: from QUESTION_CLOSE > NEXT_QUESTION', () => {
    // get it to QUESTION_CLOSE state
    requestAdminQuizSessionUpdate(token, quizId, sessionId, SessionAction.NEXT_QUESTION);
    requestAdminQuizSessionUpdate(token, quizId, sessionId, SessionAction.SKIP_COUNTDOWN);

    sleepSync(105);

    const response = requestAdminQuizSessionUpdate(token, quizId, sessionId, SessionAction.NEXT_QUESTION);
    expect(response.object).toStrictEqual({});
    expect(response.status).toStrictEqual(OK);

    expect(requestAdminQuizSessionStatus(quizId, sessionId, token).object.state).toStrictEqual(SessionState.QUESTION_COUNTDOWN);
  });

  // MAKE SURE WITHIN 3 SECONDS
  // so that it doesnt automatically go to QUESTION_OPEN (can SKIP_COUNTDOWN)
  // MAKE SURE WITHIN QUESTION DURATION
  // so that it doesn't automatically go from between QUESTION_OPEN and QUESTION_CLOSE
  test('check success return: from QUESTION_CLOSE > END', () => {
    // get it to QUESTION_CLOSE state
    requestAdminQuizSessionUpdate(token, quizId, sessionId, SessionAction.NEXT_QUESTION);
    requestAdminQuizSessionUpdate(token, quizId, sessionId, SessionAction.SKIP_COUNTDOWN);

    sleepSync(105);

    const response = requestAdminQuizSessionUpdate(token, quizId, sessionId, SessionAction.END);
    expect(response.object).toStrictEqual({});
    expect(response.status).toStrictEqual(OK);

    expect(requestAdminQuizSessionStatus(quizId, sessionId, token).object.state).toStrictEqual(SessionState.END);
  });

  //  test for waiting 3 seconds for countdown
  test('check success return: from QUESTION_COUNTDOWN > SKIP_COUNTDOWN - SET TIMEOUT', () => {
  // get it to QUESTION_COUNTDOWN state
    requestAdminQuizSessionUpdate(token, quizId, sessionId, SessionAction.NEXT_QUESTION);

    sleepSync(3005);

    expect(requestAdminQuizSessionStatus(quizId, sessionId, token).object.state).toStrictEqual(SessionState.QUESTION_OPEN);
  });
});
// ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

describe('End early before all question finish', () => {
  requestClear();
  test('Finish early play round test', () => {
    const question1: CreateQuestionInput = {
      question: 'i hate this?',
      duration: 0.2,
      points: 5,
      answers: [
        {
          answer: 'lisas good at math',
          correct: false
        },
        {
          answer: 'lisa likes english',
          correct: true
        }
      ],
      thumbnailUrl: 'https://www.doglogic.com.au/dawgs/wp-content/uploads/2015/11/puppy-training-school-sydney.jpg'
    };
    const question2: CreateQuestionInput = {
      question: 'i hate this?',
      duration: 2,
      points: 6,
      answers: [
        {
          answer: 'lisas good at math',
          correct: false
        },
        {
          answer: 'lisa likes english',
          correct: true
        }
      ],
      thumbnailUrl: 'https://www.doglogic.com.au/dawgs/wp-content/uploads/2015/11/puppy-training-school-sydney.jpg'
    };
    const validEmail = 'asd@gmail.com';
    const validPassword = 'Dancing321';
    const validNameFirst = 'First';
    const validNameLast = 'Last';

    const token1 = requestAdminAuthRegister(validEmail, validPassword, validNameFirst, validNameLast).object.token;
    const quizId1 = requestAdminQuizCreateV2(token1, 'Bulling', 'Dont Do it').object.quizId;
    const questionId1 = requestAdminQuizCreateQuestionV2(quizId1, token1, question1).object.questionId;
    const questionId2 = requestAdminQuizCreateQuestionV2(quizId1, token1, question2).object.questionId;
    const sessionId = requestAdminQuizCreateSession(quizId1, 4, token1).object.sessionId;

    // Q1 False
    const answer11 = requestAdminQuizInfoV2(token1, quizId1).object.questions[0].answers[0].answerId;
    // Q1 True: point 5
    const answer12 = requestAdminQuizInfoV2(token1, quizId1).object.questions[0].answers[1].answerId;

    const playerId1 = requestPlayerJoin(sessionId, 'A').object.playerId;
    const playerId2 = requestPlayerJoin(sessionId, 'BB').object.playerId;
    const playerId3 = requestPlayerJoin(sessionId, 'CCC').object.playerId;
    requestPlayerJoin(sessionId, 'DDDD');

    expect(requestAdminQuizSessionUpdate(token1, quizId1, sessionId, SessionAction.SKIP_COUNTDOWN).object).toStrictEqual({});
    requestsubmitPlayerAnswer(playerId1, 1, [answer12]);
    requestsubmitPlayerAnswer(playerId2, 1, [answer11]);
    requestsubmitPlayerAnswer(playerId3, 1, [answer11, answer12]);
    sleepSync(250);

    expect(requestAdminQuizSessionUpdate(token1, quizId1, sessionId, SessionAction.GO_TO_FINAL_RESULTS).object).toStrictEqual({});

    const response1 = requestAdminQuizSessionStatus(quizId1, sessionId, token1);
    expect(response1.object).toStrictEqual({
      state: SessionState.FINAL_RESULTS,
      atQuestion: 0,
      players: ['A', 'BB', 'CCC', 'DDDD'],
      metadata: {
        quizId: quizId1,
        name: 'Bulling',
        timeCreated: expect.any(Number),
        timeLastEdited: expect.any(Number),
        description: 'Dont Do it',
        numQuestions: 2,
        questions: [
          {
            questionId: questionId1,
            question: 'i hate this?',
            duration: 0.2,
            thumbnailUrl: 'https://www.doglogic.com.au/dawgs/wp-content/uploads/2015/11/puppy-training-school-sydney.jpg',
            points: 5,
            answers: [
              {
                answerId: expect.any(Number),
                answer: 'lisas good at math',
                correct: false,
                colour: expect.any(String)
              },
              {
                answerId: expect.any(Number),
                answer: 'lisa likes english',
                correct: true,
                colour: expect.any(String)
              }
            ]
          },
          {
            questionId: questionId2,
            question: 'i hate this?',
            duration: 2,
            thumbnailUrl: 'https://www.doglogic.com.au/dawgs/wp-content/uploads/2015/11/puppy-training-school-sydney.jpg',
            points: 6,
            answers: [
              {
                answerId: expect.any(Number),
                answer: 'lisas good at math',
                correct: false,
                colour: expect.any(String)
              },
              {
                answerId: expect.any(Number),
                answer: 'lisa likes english',
                correct: true,
                colour: expect.any(String)
              }
            ]
          }
        ],
        duration: 2.2,
        thumbnailUrl: expect.any(String),
      }
    });
    expect(response1.status).toBe(OK);
    expect(colours).toContain(response1.object.metadata.questions[0].answers[0].colour);
    expect(colours).toContain(response1.object.metadata.questions[0].answers[1].colour);
    expect(colours).toContain(response1.object.metadata.questions[1].answers[0].colour);
    expect(colours).toContain(response1.object.metadata.questions[1].answers[1].colour);

    const response2 = requestAdminQuizSessionResult(quizId1, sessionId, token1);
    expect(response2.object).toStrictEqual({
      usersRankedByScore: [
        {
          name: 'A',
          score: 5
        },
        {
          name: 'BB',
          score: 0
        },
        {
          name: 'CCC',
          score: 0
        },
        {
          name: 'DDDD',
          score: 0
        },
      ],
      questionResults: [
        {
          questionId: questionId1,
          playersCorrectList: ['A'],
          averageAnswerTime: expect.any(Number),
          percentCorrect: 25
        }
      ]
    });
    expect(response2.status).toBe(OK);
    expect(requestAdminQuizSessionUpdate(token1, quizId1, sessionId, SessionAction.END).object).toStrictEqual({});

    const response3 = requestAdminQuizSessionStatus(quizId1, sessionId, token1);
    expect(response3.object).toStrictEqual({
      state: SessionState.END,
      atQuestion: 0,
      players: ['A', 'BB', 'CCC', 'DDDD'],
      metadata: {
        quizId: quizId1,
        name: 'Bulling',
        timeCreated: expect.any(Number),
        timeLastEdited: expect.any(Number),
        description: 'Dont Do it',
        numQuestions: 2,
        questions: [
          {
            questionId: questionId1,
            question: 'i hate this?',
            duration: 0.2,
            thumbnailUrl: 'https://www.doglogic.com.au/dawgs/wp-content/uploads/2015/11/puppy-training-school-sydney.jpg',
            points: 5,
            answers: [
              {
                answerId: expect.any(Number),
                answer: 'lisas good at math',
                correct: false,
                colour: expect.any(String)
              },
              {
                answerId: expect.any(Number),
                answer: 'lisa likes english',
                correct: true,
                colour: expect.any(String)
              }
            ]
          },
          {
            questionId: questionId2,
            question: 'i hate this?',
            duration: 2,
            thumbnailUrl: 'https://www.doglogic.com.au/dawgs/wp-content/uploads/2015/11/puppy-training-school-sydney.jpg',
            points: 6,
            answers: [
              {
                answerId: expect.any(Number),
                answer: 'lisas good at math',
                correct: false,
                colour: expect.any(String)
              },
              {
                answerId: expect.any(Number),
                answer: 'lisa likes english',
                correct: true,
                colour: expect.any(String)
              }
            ]
          }
        ],
        duration: 2.2,
        thumbnailUrl: expect.any(String),
      }
    });

    const response4 = requestAdminQuizSessionUpdate(token1, quizId1, sessionId, SessionAction.END);
    expect(response4.object).toStrictEqual(ERROR);
    expect(response4.status).toBe(BAD_REQUEST);
  });
});

import { CreateQuestionInput } from './interface';
import { SessionAction } from './playround.test';
import {
  requestClear, requestAdminAuthRegister, requestAdminQuizCreateV2, requestPlayerQuestionStatus, requestAdminQuizSessionStatus,
  requestAdminQuizCreateSession, requestPlayerJoin, requestAdminQuizCreateQuestionV2, requestsubmitPlayerAnswer, requestAdminQuizSessionUpdate,
  requestGetPlayerStatus, requestPlayerSendChatMessage, requestPlayerQuestionResults, requestAdminPlayerSessionResult, requestPlayerReturnChatMessage
} from './testfunction';

const ERROR = { error: expect.any(String) };

const OK = 200;
const BAD_REQUEST = 400;

beforeEach(() => {
  requestClear();
});

describe('function: playerJoin', () => {
  let token: string;
  let quizId: number;
  let sessionId: number;

  beforeEach(() => {
    requestClear();
    token = requestAdminAuthRegister('lisalin434@gmail.com', 'PasdsEIO34', 'Emma', 'Lisa').object.token;
    quizId = requestAdminQuizCreateV2(token, 'Bulling', 'Dont Do it').object.quizId;

    const question: CreateQuestionInput = {
      question: 'i hate this?',
      duration: 4,
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
    requestAdminQuizCreateQuestionV2(quizId, token, question);
    sessionId = requestAdminQuizCreateSession(quizId, 4, token).object.sessionId;
  });

  test('same name as existing user', () => {
    requestPlayerJoin(sessionId, 'Emma Feng');
    const response = requestPlayerJoin(sessionId, 'Emma Feng');

    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(BAD_REQUEST);
  });

  test('session is not in lobby state', () => {
    requestAdminQuizSessionUpdate(token, quizId, sessionId, 'NEXT_QUESTION');
    const response = requestPlayerJoin(sessionId, 'Lisa');
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(BAD_REQUEST);
  });

  test('guest player has successfully joined the session', () => {
    const response = requestPlayerJoin(sessionId, 'Feng');

    expect(response.object).toStrictEqual({ playerId: expect.any(Number) });
    expect(response.status).toStrictEqual(OK);
  });

  test('test player - no name has successfully joined the session', () => {
    const response = requestPlayerJoin(sessionId, '');

    expect(response.object).toStrictEqual({ playerId: expect.any(Number) });
    expect(response.status).toStrictEqual(OK);
  });
});

describe('function: getPlayerStatus', () => {
  let token: string;
  let quizId: number;
  let sessionId: number;
  let playerId: number;

  beforeEach(() => {
    requestClear();
    token = requestAdminAuthRegister('lisalin434@gmail.com', 'PasdsEIO34', 'Emma', 'Lisa').object.token;
    quizId = requestAdminQuizCreateV2(token, 'Bulling', 'Dont Do it').object.quizId;
    const question: CreateQuestionInput = {
      question: 'i hate this?',
      duration: 4,
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
    requestAdminQuizCreateQuestionV2(quizId, token, question);
    sessionId = requestAdminQuizCreateSession(quizId, 4, token).object.sessionId;
    playerId = requestPlayerJoin(sessionId, 'John Doe').object.playerId;
  });

  test('successfully retrieves player status', () => {
    const response = requestGetPlayerStatus(playerId);

    expect(response.object).toStrictEqual({
      state: 'LOBBY',
      numQuestions: expect.any(Number),
      atQuestion: expect.any(Number)
    });
    expect(response.status).toStrictEqual(OK);
  });

  test('player ID does not exist', () => {
    const response = requestGetPlayerStatus(playerId + 1000);

    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(BAD_REQUEST);
  });

  test('player status after session has ended', () => {
    requestAdminQuizSessionUpdate(token, quizId, sessionId, 'END');
    const response = requestGetPlayerStatus(playerId);

    expect(response.object).toStrictEqual({
      state: 'END',
      numQuestions: expect.any(Number),
      atQuestion: expect.any(Number)
    });
    expect(response.status).toStrictEqual(OK);
  });
});

describe('GET /v1/player/{playerid}/question/{questionposition}', () => {
  let token: string;
  let quizId: number;
  let sessionId: number;
  let playerId: number;
  let questionPosition: number;

  beforeEach(() => {
    requestClear();
    token = requestAdminAuthRegister('lisa.lin434@gmail.com', 'PasdsEIO34', 'Emma', 'Lisa').object.token;
    quizId = requestAdminQuizCreateV2(token, 'Bulling', 'Dont Do it').object.quizId;
    const question: CreateQuestionInput = {
      question: 'i hate this?',
      duration: 4,
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
    requestAdminQuizCreateQuestionV2(quizId, token, question);
    sessionId = requestAdminQuizCreateSession(quizId, 4, token).object.sessionId;
    playerId = requestPlayerJoin(sessionId, 'Emma Feng').object.playerId;
    questionPosition = requestAdminQuizSessionStatus(quizId, sessionId, token).object.atQuestion;
  });

  test('Valid request for current question information', () => {
    requestAdminQuizSessionUpdate(token, quizId, sessionId, 'NEXT_QUESTION');
    // questionPosition + 1 because session update
    const response = requestPlayerQuestionStatus(playerId, questionPosition + 1);
    expect(response.status).toStrictEqual(OK);
    expect(response.object).toMatchObject({
      questionId: expect.any(Number),
      question: expect.any(String),
      duration: expect.any(Number),
      thumbnailUrl: expect.any(String),
      points: expect.any(Number),
      answers: expect.any(Array),
    });
  });

  test('Invalid player ID', () => {
    const response = requestPlayerQuestionStatus(playerId + 1000, questionPosition);
    expect(response.status).toStrictEqual(BAD_REQUEST);
    expect(response.object).toStrictEqual(ERROR);
  });

  test('Invalid question position', () => {
    const response = requestPlayerQuestionStatus(playerId, questionPosition + 100);
    expect(response.status).toStrictEqual(BAD_REQUEST);
    expect(response.object).toStrictEqual(ERROR);
  });

  test('Session not on specified question', () => {
    const response = requestPlayerQuestionStatus(playerId, questionPosition + 1);
    expect(response.status).toStrictEqual(BAD_REQUEST);
    expect(response.object).toStrictEqual(ERROR);
  });

  test('Session in LOBBY state', () => {
    const response = requestPlayerQuestionStatus(playerId, questionPosition);
    expect(response.status).toStrictEqual(BAD_REQUEST);
    expect(response.object).toStrictEqual(ERROR);
  });

  test('Session in END state', () => {
    requestAdminQuizSessionUpdate(token, quizId, sessionId, 'END');
    const response = requestPlayerQuestionStatus(playerId, questionPosition + 1);
    expect(response.status).toStrictEqual(BAD_REQUEST);
    expect(response.object).toStrictEqual(ERROR);
  });

  test('Invalid question position - not matching total number of questions', () => {
    const totalQuestions = requestAdminQuizSessionStatus(quizId, sessionId, token).object.metadata.numQuestions;
    const response = requestPlayerQuestionStatus(playerId, totalQuestions + 1);
    expect(response.status).toStrictEqual(BAD_REQUEST);
    expect(response.object).toStrictEqual(ERROR);
  });

  test('Session not on specified question - current question mismatch', () => {
    const response = requestPlayerQuestionStatus(playerId, questionPosition);
    expect(response.status).toStrictEqual(BAD_REQUEST);
    expect(response.object).toStrictEqual(ERROR);
  });
});

describe('function: playerSendChatMessage', () => {
  let token: string;
  let quizId: number;
  let sessionId: number;
  let playerId: number;

  beforeEach(() => {
    requestClear();
    token = requestAdminAuthRegister('lisa.lin434@gmail.com', 'PasdsEIO34', 'Emma', 'Lisa').object.token;
    quizId = requestAdminQuizCreateV2(token, 'Bulling', 'Dont Do it').object.quizId;
    const question = {
      question: 'i hate this?',
      duration: 4,
      points: 5,
      answers: [
        { answer: 'lisas good at math', correct: false },
        { answer: 'lisa likes english', correct: true }
      ],
      thumbnailUrl: 'https://www.doglogic.com.au/dawgs/wp-content/uploads/2015/11/puppy-training-school-sydney.jpg'
    };
    requestAdminQuizCreateQuestionV2(quizId, token, question);
    sessionId = requestAdminQuizCreateSession(quizId, 4, token).object.sessionId;
    playerId = requestPlayerJoin(sessionId, 'John Doe').object.playerId;
  });

  test('fails to send chat message with an empty body', () => {
    const response = requestPlayerSendChatMessage(playerId, { messageBody: '' });

    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(BAD_REQUEST);
  });

  test('fails to send chat message with a long body', () => {
    const longMessage = 'a'.repeat(101);
    const response = requestPlayerSendChatMessage(playerId, { messageBody: longMessage });

    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(BAD_REQUEST);
  });

  test('fails to send chat message for a non-existent player', () => {
    const nonExistentPlayerId = playerId + 1000;
    const response = requestPlayerSendChatMessage(nonExistentPlayerId, { messageBody: 'Hello everyone!' });

    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(BAD_REQUEST);
  });

  test('sends a chat message successfully', () => {
    const messageBody = 'Hello everyone! Nice to chat.';
    const response = requestPlayerSendChatMessage(playerId, { messageBody });

    expect(response.object).toStrictEqual({});
    expect(response.status).toStrictEqual(OK);
  });

  test('Invalid playerId request return message', () => {
    const response = requestPlayerReturnChatMessage(-1);

    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(BAD_REQUEST);
  });
});

describe('submitPlayerAnswer', () => {
  let token1: string;
  let quizId1: number;
  let sessionId1: number;
  let sessionId2: number;
  let playerId1: number;
  let questionPosition1: number;
  let questionPosition2: number;
  let answerId1: number;
  let answerId2: number;
  let answerIds: number[];

  beforeEach(() => {
    token1 = requestAdminAuthRegister('lisalin434@gmail.com', 'PasdsEIO34', 'Emma', 'Lisa').object.token;
    quizId1 = requestAdminQuizCreateV2(token1, 'Bulling', 'Dont Do it').object.quizId;
    const question1: CreateQuestionInput = {
      question: 'i hate this?',
      duration: 4,
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
      duration: 4,
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
    requestAdminQuizCreateQuestionV2(quizId1, token1, question1);
    requestAdminQuizCreateQuestionV2(quizId1, token1, question2);
    sessionId1 = requestAdminQuizCreateSession(quizId1, 4, token1).object.sessionId;
    sessionId2 = requestAdminQuizCreateSession(quizId1, 4, token1).object.sessionId;
    playerId1 = requestPlayerJoin(sessionId1, 'Emma Feng').object.playerId;
    questionPosition1 = requestAdminQuizSessionStatus(quizId1, sessionId1, token1).object.atQuestion;
    questionPosition2 = requestAdminQuizSessionStatus(quizId1, sessionId2, token1).object.atQuestion;
    requestAdminQuizSessionUpdate(token1, quizId1, sessionId1, 'NEXT_QUESTION');
    requestAdminQuizSessionUpdate(token1, quizId1, sessionId2, 'NEXT_QUESTION');
    requestAdminQuizSessionUpdate(token1, quizId1, sessionId1, 'SKIP_COUNTDOWN');
    requestAdminQuizSessionUpdate(token1, quizId1, sessionId2, 'SKIP_COUNTDOWN');
    const createQuestionResponse1 = requestPlayerQuestionStatus(playerId1, questionPosition1 + 1).object;
    const createQuestionResponse2 = requestPlayerQuestionStatus(playerId1, questionPosition2 + 1).object;
    answerId1 = createQuestionResponse1.answers[0].answerId;
    answerId2 = createQuestionResponse2.answers[1].answerId;
    answerIds = [answerId1, answerId2];
  });

  test('Successful answer submission', () => {
    const response = requestsubmitPlayerAnswer(playerId1, questionPosition1 + 1, [answerId1]);
    expect(response.object).toStrictEqual({});
    expect(response.status).toStrictEqual(OK);
  });

  test('Successful multiply answers submission', () => {
    const response = requestsubmitPlayerAnswer(playerId1, questionPosition1 + 1, answerIds);
    expect(response.object).toStrictEqual({});
    expect(response.status).toStrictEqual(OK);
  });

  test('Invalid player ID', () => {
    const response = requestsubmitPlayerAnswer(playerId1 + 1000, questionPosition1 + 1, answerIds);
    expect(response.status).toStrictEqual(BAD_REQUEST);
    expect(response.object).toStrictEqual(ERROR);
  });

  test('Invalid question position', () => {
    const response = requestsubmitPlayerAnswer(playerId1, questionPosition1 + 100, answerIds);
    expect(response.status).toStrictEqual(BAD_REQUEST);
    expect(response.object).toStrictEqual(ERROR);
  });

  test('Session not in QUESTION_OPEN state', () => {
    requestAdminQuizSessionUpdate(token1, quizId1, sessionId1, 'GO_TO_ANSWER');

    const response = requestsubmitPlayerAnswer(playerId1, questionPosition1 + 1, answerIds);
    expect(response.status).toStrictEqual(BAD_REQUEST);
    expect(response.object).toStrictEqual(ERROR);
  });

  test('Answer IDs not valid for this question', () => {
    const invalidAnswerIds = [answerId1 + 99, answerId1 + 10];

    const response = requestsubmitPlayerAnswer(playerId1, questionPosition1 + 1, invalidAnswerIds);
    expect(response.status).toStrictEqual(BAD_REQUEST);
    expect(response.object).toStrictEqual({ error: 'Answer IDs are not valid for this question' });
  });

  test('Duplicate answer IDs provided', () => {
    const duplicateAnswerIds = [answerId2, answerId2];

    const response = requestsubmitPlayerAnswer(playerId1, questionPosition2 + 1, duplicateAnswerIds);
    expect(response.status).toStrictEqual(BAD_REQUEST);
    expect(response.object).toStrictEqual({ error: 'Duplicate answer IDs provided' });
  });

  test('Less than 1 answer ID submitted', () => {
    const response = requestsubmitPlayerAnswer(playerId1, questionPosition1 + 1, []);
    expect(response.status).toStrictEqual(BAD_REQUEST);
    expect(response.object).toStrictEqual({ error: 'Less than 1 answer ID was submitted' });
  });
});

describe('function: playerSendChatMessage', () => {
  let token: string;
  let quizId: number;
  let sessionId: number;
  let playerId: number;

  beforeEach(() => {
    requestClear();
    token = requestAdminAuthRegister('lisa.lin434@gmail.com', 'PasdsEIO34', 'Emma', 'Lisa').object.token;
    quizId = requestAdminQuizCreateV2(token, 'Bulling', 'Dont Do it').object.quizId;
    const question = {
      question: 'i hate this?',
      duration: 4,
      points: 5,
      answers: [
        { answer: 'lisas good at math', correct: false },
        { answer: 'lisa likes english', correct: true }
      ],
      thumbnailUrl: 'https://www.doglogic.com.au/dawgs/wp-content/uploads/2015/11/puppy-training-school-sydney.jpg'
    };
    requestAdminQuizCreateQuestionV2(quizId, token, question);
    sessionId = requestAdminQuizCreateSession(quizId, 4, token).object.sessionId;
    playerId = requestPlayerJoin(sessionId, 'John Doe').object.playerId;
  });

  test('fails to send chat message with an empty body', () => {
    const response = requestPlayerSendChatMessage(playerId, { messageBody: '' });

    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(BAD_REQUEST);
  });

  test('fails to send chat message with a long body', () => {
    const longMessage = 'a'.repeat(101);
    const response = requestPlayerSendChatMessage(playerId, { messageBody: longMessage });

    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(BAD_REQUEST);
  });

  test('fails to send chat message for a non-existent player', () => {
    const nonExistentPlayerId = playerId + 1000;
    const response = requestPlayerSendChatMessage(nonExistentPlayerId, { messageBody: 'Hello everyone!' });

    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(BAD_REQUEST);
  });

  test('sends a chat message successfully', () => {
    const messageBody = 'Hello everyone! Nice to chat.';
    const response = requestPlayerSendChatMessage(playerId, { messageBody });

    expect(response.object).toStrictEqual({});
    expect(response.status).toStrictEqual(OK);
  });
});

describe('function testing: adminPlayerSessionResult', () => {
  let token: string;
  let quizId: number;
  let sessionId: number;
  let playerId: number;

  beforeEach(() => {
    requestClear();
    token = requestAdminAuthRegister('jason.ring@gmail.com', 'RaRA101ja101', 'Emma', 'Lisa').object.token;
    quizId = requestAdminQuizCreateV2(token, 'ILoveIt', 'Your mum brr').object.quizId;

    const question: CreateQuestionInput = {
      question: 'what do you smell like?',
      duration: 4,
      points: 5,
      answers: [
        {
          answer: 'dior sauvage EWWW',
          correct: false
        },
        {
          answer: 'tom ford',
          correct: true
        }
      ],
      thumbnailUrl: 'https://www.doglogic.com.au/dawgs/wp-content/uploads/2015/11/puppy-training-school-sydney.jpg'
    };
    requestAdminQuizCreateQuestionV2(quizId, token, question);
    sessionId = requestAdminQuizCreateSession(quizId, 2, token).object.sessionId;

    // add in a player
    playerId = requestPlayerJoin(sessionId, 'Eren').object.playerId;

    // send that session to FINAL_RESULTS
    requestAdminQuizSessionUpdate(token, quizId, sessionId, SessionAction.NEXT_QUESTION); // QUESTION_COUNTDOWN
    requestAdminQuizSessionUpdate(token, quizId, sessionId, SessionAction.SKIP_COUNTDOWN); // QUESTION_OPEN
    requestAdminQuizSessionUpdate(token, quizId, sessionId, SessionAction.GO_TO_ANSWER); // ANSWERS_SHOW
    requestAdminQuizSessionUpdate(token, quizId, sessionId, SessionAction.GO_TO_FINAL_RESULTS); // FINAL_RESULTS
  });

  // ====================================== BAD_REQUEST = 400 ERROR ======================================
  test('playerId does not exist', () => {
    const response = requestAdminPlayerSessionResult(playerId + 100);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(BAD_REQUEST);
  });

  test('session is not in end state', () => {
    requestAdminQuizCreateSession(quizId, 3, token);
    const playerId2 = requestPlayerJoin(sessionId, 'Levi').object.playerId;

    const response1 = requestAdminPlayerSessionResult(playerId2);
    expect(response1.object).toStrictEqual(ERROR);
    expect(response1.status).toStrictEqual(BAD_REQUEST);

    requestAdminQuizSessionUpdate(token, quizId, sessionId, SessionAction.NEXT_QUESTION); // QUESTION_COUNTDOWN

    const response2 = requestAdminPlayerSessionResult(playerId2);
    expect(response2.object).toStrictEqual(ERROR);
    expect(response2.status).toStrictEqual(BAD_REQUEST);
  });

  // ============================================= SUCCESS =============================================
  test('check success case return', () => {
    const response = requestAdminPlayerSessionResult(playerId);

    expect(response.object).toStrictEqual({
      // list of all users who played ranked in descending order by score
      usersRankedByScore: [
        {
          name: expect.any(String),
          score: expect.any(Number),
        }
      ],
      questionResults: [
        {
          questionId: expect.any(Number),
          playersCorrectList:
            // array order in ascending order of all players' names
            expect.any(Array),
          // The average answer time for the question across all players who attempted the question.
          averageAnswerTime: expect.any(Number),
          // A percentage rounded to the nearest whole number that describes the percentage
          // of questions they got completely correct.
          percentCorrect: expect.any(Number),
        }
      ]
    });

    expect(response.status).toStrictEqual(OK);
  });
});

describe('GET /v1/player/{playerid}/question/{questionposition}/results test', () => {
  let token1: string;
  let quizId1: number;
  let sessionId1: number;
  let sessionId2: number;
  let playerId1: number;
  let questionPosition1: number;
  let questionPosition2: number;
  let numQuestions: number;

  beforeEach(() => {
    token1 = requestAdminAuthRegister('lisalin434@gmail.com', 'PasdsEIO34', 'Emma', 'Lisa').object.token;
    quizId1 = requestAdminQuizCreateV2(token1, 'Bulling', 'Dont Do it').object.quizId;
    const question1: CreateQuestionInput = {
      question: 'i hate this?',
      duration: 4,
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
      duration: 4,
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
    requestAdminQuizCreateQuestionV2(quizId1, token1, question1);
    requestAdminQuizCreateQuestionV2(quizId1, token1, question2);
    sessionId1 = requestAdminQuizCreateSession(quizId1, 4, token1).object.sessionId;
    sessionId2 = requestAdminQuizCreateSession(quizId1, 4, token1).object.sessionId;
    playerId1 = requestPlayerJoin(sessionId1, 'Emma Feng').object.playerId;
    questionPosition1 = requestAdminQuizSessionStatus(quizId1, sessionId1, token1).object.atQuestion;
    questionPosition2 = requestAdminQuizSessionStatus(quizId1, sessionId2, token1).object.atQuestion;
    requestAdminQuizSessionUpdate(token1, quizId1, sessionId1, 'NEXT_QUESTION');
    requestAdminQuizSessionUpdate(token1, quizId1, sessionId2, 'NEXT_QUESTION');
    requestAdminQuizSessionUpdate(token1, quizId1, sessionId1, 'SKIP_COUNTDOWN');
    requestAdminQuizSessionUpdate(token1, quizId1, sessionId2, 'SKIP_COUNTDOWN');
    requestPlayerQuestionStatus(playerId1, questionPosition1 + 1);
    requestPlayerQuestionStatus(playerId1, questionPosition2 + 1);
    numQuestions = requestAdminQuizSessionStatus(quizId1, sessionId1, token1).object.metadata.numQuestions;
  });

  test('Player Id not exist', () => {
    const response = requestPlayerQuestionResults(playerId1, -1);

    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(BAD_REQUEST);
  });

  test('Question position not valid', () => {
    const response = requestPlayerQuestionResults(-1, numQuestions + 10);

    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(BAD_REQUEST);
  });

  test('Session is not in ANSWER_SHOW state', () => {
    const response = requestPlayerQuestionResults(playerId1, questionPosition1 + 2);

    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(BAD_REQUEST);
  });

  test('session is not yet up to this question', () => {
    const response = requestPlayerQuestionResults(playerId1, questionPosition1 + 3);

    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(BAD_REQUEST);
  });
});

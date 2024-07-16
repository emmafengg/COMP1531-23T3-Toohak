import { CreateQuestionInput } from './interface';
import {
  requestAdminAuthRegister, requestAdminPlayerSessionResult, requestAdminQuizCreateQuestionV2, requestAdminQuizCreateSession,
  requestAdminQuizCreateV2, requestAdminQuizDeleteQuestionV2, requestAdminQuizInfoV2, requestAdminQuizSessionResult, requestAdminQuizSessionResultCSV,
  requestAdminQuizSessionStatus, requestAdminQuizSessionUpdate, requestClear, requestPlayerJoin, requestPlayerQuestionResults,
  requestPlayerReturnChatMessage, requestPlayerSendChatMessage, requestsubmitPlayerAnswer
} from './testfunction';

const ERROR = { error: expect.any(String) };

export enum SessionState {
    LOBBY = 'LOBBY',
    QUESTION_COUNTDOWN = 'QUESTION_COUNTDOWN',
    QUESTION_OPEN = 'QUESTION_OPEN',
    QUESTION_CLOSE = 'QUESTION_CLOSE',
    ANSWER_SHOW = 'ANSWER_SHOW',
    FINAL_RESULTS = 'FINAL_RESULTS',
    END = 'END'
  }
export enum SessionAction {
    NEXT_QUESTION = 'NEXT_QUESTION',
    SKIP_COUNTDOWN = 'SKIP_COUNTDOWN',
    GO_TO_ANSWER = 'GO_TO_ANSWER',
    GO_TO_FINAL_RESULTS = 'GO_TO_FINAL_RESULTS',
    END = 'END'
  }

const OK = 200;
const BAD_REQUEST = 400;

export function sleepSync(ms: number) {
  const startTime = new Date().getTime();
  while (new Date().getTime() - startTime < ms) {
    // zzzZZ - comment needed so eslint doesn't complain
  }
}

beforeAll(() => {
  requestClear();
});

describe('All over play round test', () => {
  requestClear();
  test('Full play round test', () => {
    const question1: CreateQuestionInput = {
      question: 'i hate this?',
      duration: 2,
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

    const question3: CreateQuestionInput = {
      question: 'denjis best girl is?',
      duration: 2,
      points: 4,
      answers: [
        {
          answer: 'makima',
          correct: true
        },
        {
          answer: 'reze',
          correct: true
        },
        {
          answer: 'power',
          correct: true
        }
      ],
      thumbnailUrl: 'https://www.doglogic.com.au/dawgs/wp-content/uploads/2015/11/puppy-training-school-sydney.jpg'
    };

    const question4: CreateQuestionInput = {
      question: 'do we like aki?',
      duration: 2,
      points: 10,
      answers: [
        {
          answer: 'yes',
          correct: true
        },
        {
          answer: 'lol yes',
          correct: false
        },
        {
          answer: 'zaza',
          correct: false
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
    const questionId3 = requestAdminQuizCreateQuestionV2(quizId1, token1, question3).object.questionId;
    const questionId4 = requestAdminQuizCreateQuestionV2(quizId1, token1, question4).object.questionId;

    // Q1 False
    const answer11 = requestAdminQuizInfoV2(token1, quizId1).object.questions[0].answers[0].answerId;
    // Q1 True: point 5
    const answer12 = requestAdminQuizInfoV2(token1, quizId1).object.questions[0].answers[1].answerId;

    // Q2 False
    const answer21 = requestAdminQuizInfoV2(token1, quizId1).object.questions[1].answers[0].answerId;
    // Q2 True: point 6
    const answer22 = requestAdminQuizInfoV2(token1, quizId1).object.questions[1].answers[1].answerId;

    // Q3 All True: point 4
    const answer31 = requestAdminQuizInfoV2(token1, quizId1).object.questions[2].answers[0].answerId;
    const answer32 = requestAdminQuizInfoV2(token1, quizId1).object.questions[2].answers[1].answerId;
    const answer33 = requestAdminQuizInfoV2(token1, quizId1).object.questions[2].answers[2].answerId;

    // Q4 True: point 10
    const answer41 = requestAdminQuizInfoV2(token1, quizId1).object.questions[3].answers[0].answerId;
    // Q4 False
    const answer42 = requestAdminQuizInfoV2(token1, quizId1).object.questions[3].answers[1].answerId;
    const answer43 = requestAdminQuizInfoV2(token1, quizId1).object.questions[3].answers[2].answerId;

    const sessionId = requestAdminQuizCreateSession(quizId1, 4, token1).object.sessionId;
    let res;

    // Session set, now at Lobby
    res = requestAdminQuizSessionStatus(quizId1, sessionId, token1);
    expect(res.object.state).toStrictEqual(SessionState.LOBBY);
    expect(res.status).toBe(OK);

    const playerId1 = requestPlayerJoin(sessionId, 'A').object.playerId;
    const playerId2 = requestPlayerJoin(sessionId, 'BB').object.playerId;
    const playerId3 = requestPlayerJoin(sessionId, 'CCC').object.playerId;
    const playerId4 = requestPlayerJoin(sessionId, 'DDDD').object.playerId;

    // maximum 4 player, the 5th will return error
    res = requestPlayerJoin(sessionId, 'EEEEE');
    expect(res.object).toStrictEqual(ERROR);
    expect(res.status).toBe(BAD_REQUEST);

    // Game Start, Now in first question countdown
    res = requestAdminQuizSessionStatus(quizId1, sessionId, token1);
    expect(res.object.state).toStrictEqual(SessionState.QUESTION_COUNTDOWN);
    expect(res.status).toBe(OK);
    expect(requestAdminQuizSessionUpdate(token1, quizId1, sessionId, SessionAction.SKIP_COUNTDOWN).object).toStrictEqual({});
    // Skip countdown to first question
    expect(requestAdminQuizSessionStatus(quizId1, sessionId, token1).object.state).toStrictEqual(SessionState.QUESTION_OPEN);

    // Question 1 position
    let position = 1;

    // Wrong submit position
    res = requestsubmitPlayerAnswer(playerId1, position + 2, [answer12]);
    expect(res.object).toStrictEqual(ERROR);
    expect(res.status).toBe(BAD_REQUEST);

    res = requestAdminPlayerSessionResult(playerId1);
    expect(res.object).toStrictEqual(ERROR);
    expect(res.status).toStrictEqual(BAD_REQUEST);

    res = requestAdminQuizDeleteQuestionV2(quizId1, questionId2, token1);
    expect(res.object).toStrictEqual(ERROR);
    expect(res.status).toStrictEqual(BAD_REQUEST);

    // Answer question 1
    requestsubmitPlayerAnswer(playerId1, position, [answer12]);
    sleepSync(50);
    requestsubmitPlayerAnswer(playerId2, position, [answer11]);
    sleepSync(50);
    requestsubmitPlayerAnswer(playerId3, position, [answer11, answer12]);
    sleepSync(1000);
    requestsubmitPlayerAnswer(playerId4, position, [answer12]);

    /**
     * Now score:
     *           current    rank    total
     * player1      5         1       5
     * player2      0         3       0
     * player3      0         3       0
     * player4      2.5       2       2.5
     */

    expect(requestAdminQuizSessionUpdate(token1, quizId1, sessionId, SessionAction.GO_TO_ANSWER).object).toStrictEqual({});
    expect(requestPlayerQuestionResults(playerId1, position).object).toStrictEqual({
      questionId: questionId1,
      playersCorrectList: ['A', 'DDDD'],
      averageAnswerTime: expect.any(Number),
      percentCorrect: 50,
    });

    res = requestPlayerQuestionResults(playerId1, position + 2);
    expect(res.object).toStrictEqual(ERROR);
    expect(res.status).toBe(BAD_REQUEST);

    expect(requestPlayerSendChatMessage(playerId1, { messageBody: 'I win' }).object).toStrictEqual({});

    // Goto question 2
    expect(requestAdminQuizSessionUpdate(token1, quizId1, sessionId, SessionAction.NEXT_QUESTION).object).toStrictEqual({});
    expect(requestAdminQuizSessionUpdate(token1, quizId1, sessionId, SessionAction.SKIP_COUNTDOWN).object).toStrictEqual({});
    // Answer question 2
    position++;
    requestsubmitPlayerAnswer(playerId1, position, [answer21]);
    requestsubmitPlayerAnswer(playerId2, position, [answer22]);
    sleepSync(50);
    requestsubmitPlayerAnswer(playerId3, position, [answer21, answer22]);

    /**
     * Now score:
     *           current    rank    total
     * player1      0         2       5
     * player2      6         1       6
     * player3      0         2       0
     * player4      0         2       2.5
     */

    expect(requestPlayerSendChatMessage(playerId2, { messageBody: 'No! You won\'t' }).object).toStrictEqual({});

    expect(requestAdminQuizSessionUpdate(token1, quizId1, sessionId, SessionAction.GO_TO_ANSWER).object).toStrictEqual({});
    expect(requestPlayerQuestionResults(playerId1, position).object).toStrictEqual({
      questionId: questionId2,
      playersCorrectList: ['BB'],
      averageAnswerTime: expect.any(Number),
      percentCorrect: 25,
    });

    // Goto question 3
    expect(requestAdminQuizSessionUpdate(token1, quizId1, sessionId, SessionAction.NEXT_QUESTION).object).toStrictEqual({});
    expect(requestAdminQuizSessionUpdate(token1, quizId1, sessionId, SessionAction.SKIP_COUNTDOWN).object).toStrictEqual({});
    // Answer question 3
    position++;
    requestsubmitPlayerAnswer(playerId1, position, [answer31]);
    sleepSync(50);
    requestsubmitPlayerAnswer(playerId2, position, [answer32]);
    sleepSync(50);
    requestsubmitPlayerAnswer(playerId3, position, [answer31, answer32]);
    sleepSync(50);
    requestsubmitPlayerAnswer(playerId4, position, [answer32, answer33]);

    /**
     * Now score:
     *           current    rank    total
     * player1      0         3       5
     * player2      0         1       6
     * player3      0         2       0
     * player4      0         4       2.5
     */

    expect(requestAdminQuizSessionUpdate(token1, quizId1, sessionId, SessionAction.GO_TO_ANSWER).object).toStrictEqual({});
    expect(requestPlayerQuestionResults(playerId1, position).object).toStrictEqual({
      questionId: questionId3,
      playersCorrectList: [],
      averageAnswerTime: expect.any(Number),
      percentCorrect: 0,
    });

    // Goto question 4
    expect(requestAdminQuizSessionUpdate(token1, quizId1, sessionId, SessionAction.NEXT_QUESTION).object).toStrictEqual({});
    expect(requestAdminQuizSessionUpdate(token1, quizId1, sessionId, SessionAction.SKIP_COUNTDOWN).object).toStrictEqual({});
    // Answer question 4
    position++;
    requestsubmitPlayerAnswer(playerId2, position, [answer41]);
    sleepSync(1000);
    requestsubmitPlayerAnswer(playerId3, position, [answer41]);
    sleepSync(1000);
    // over time
    requestsubmitPlayerAnswer(playerId1, position, [answer41]);
    requestsubmitPlayerAnswer(playerId4, position, [answer42, answer43]);

    /**
     * Now score:
     *           current    rank    total
     * player1      0         3       5
     * player2      10        1       16
     * player3      5         2       5
     * player4      0         3       2.5
     */

    expect(requestAdminQuizSessionUpdate(token1, quizId1, sessionId, SessionAction.GO_TO_ANSWER).object).toStrictEqual({});
    expect(requestPlayerQuestionResults(playerId1, position).object).toStrictEqual({
      questionId: questionId4,
      playersCorrectList: ['BB', 'CCC'],
      averageAnswerTime: expect.any(Number),
      percentCorrect: 50,
    });

    expect(requestPlayerSendChatMessage(playerId4, { messageBody: 'Crazzzzzy!' }).object).toStrictEqual({});

    // Goto final result
    expect(requestAdminQuizSessionUpdate(token1, quizId1, sessionId, SessionAction.GO_TO_FINAL_RESULTS).object).toStrictEqual({});
    expect(requestAdminQuizSessionResult(quizId1, sessionId, token1).object).toStrictEqual({
      usersRankedByScore: [
        {
          name: 'BB',
          score: 16
        },
        {
          name: 'A',
          score: 5
        }, {
          name: 'CCC',
          score: 5
        }, {
          name: 'DDDD',
          score: 2.5
        },
      ],
      questionResults: [
        {
          questionId: questionId1,
          playersCorrectList: ['A', 'DDDD'],
          averageAnswerTime: expect.any(Number),
          percentCorrect: 50,
        },
        {
          questionId: questionId2,
          playersCorrectList: ['BB'],
          averageAnswerTime: expect.any(Number),
          percentCorrect: 25,
        },
        {
          questionId: questionId3,
          playersCorrectList: [],
          averageAnswerTime: expect.any(Number),
          percentCorrect: 0,
        },
        {
          questionId: questionId4,
          playersCorrectList: ['BB', 'CCC'],
          averageAnswerTime: expect.any(Number),
          percentCorrect: 50,
        }
      ]
    });
    expect(requestAdminQuizSessionResultCSV(quizId1, sessionId, token1).object).toStrictEqual({ url: expect.any(String) });
    expect(requestAdminPlayerSessionResult(playerId1)).toStrictEqual(requestAdminQuizSessionResult(quizId1, sessionId, token1));
    expect(requestAdminPlayerSessionResult(playerId1)).toStrictEqual(requestAdminPlayerSessionResult(playerId2));
    expect(requestAdminPlayerSessionResult(playerId1)).toStrictEqual(requestAdminPlayerSessionResult(playerId3));
    expect(requestAdminPlayerSessionResult(playerId1)).toStrictEqual(requestAdminPlayerSessionResult(playerId4));
    expect(requestPlayerReturnChatMessage(playerId3).object).toStrictEqual({
      messages: [
        {
          messageBody: 'I win',
          playerId: playerId1,
          playerName: 'A',
          timeSent: expect.any(Number)
        },
        {
          messageBody: 'No! You won\'t',
          playerId: playerId2,
          playerName: 'BB',
          timeSent: expect.any(Number)
        },
        {
          messageBody: 'Crazzzzzy!',
          playerId: playerId4,
          playerName: 'DDDD',
          timeSent: expect.any(Number)
        },
      ]
    });
  });

  afterAll(() => {
    requestClear();
  });
});

import { CreateQuestionInput } from './interface';
import { sleepSync } from './playround.test';
import {
  requestClear, requestAdminQuizQuestionMove, requestAdminQuizQuestionUpdate,
  requestAdminQuizCreateQuestion, requestAdminAuthRegister, requestAdminQuizCreate,
  requestAdminQuizDeleteQuestion, requestAdminQuizDuplicateQuestion, requestAdminQuizInfo
} from './testfunction';

const ERROR = { error: expect.any(String) };

const OK = 200;
const BAD_REQUEST = 400;
const UNAUTHORIZED = 401;
const FORBIDDEN = 403;

beforeEach(() => {
  requestClear();
});

/// ///////////////////////////////////////////////////////////////////////////////////////
/// /////////////////////////////ADMIN QUIZ QUESTION CREATE////////////////////////////////
/// ///////////////////////////////////////////////////////////////////////////////////////

describe('adminQuizCreateQuestion tests', () => {
  // variables to be used in following testing
  let token: string;
  let quizId: number;
  let questionInput: CreateQuestionInput;

  beforeEach(() => {
    requestClear();

    // register a user and create a quiz for them
    token = requestAdminAuthRegister('lisa.lin@yahoo.com', 'verysafe123', 'Pete', 'Smith').object.token;
    quizId = requestAdminQuizCreate(token, 'lisa', 'about me').object.quizId;

    // create a question to input into adminQuizCreateQuestion
    questionInput = {
      question: 'Who is the Monarch of England?',
      duration: 4,
      points: 5,
      answers: [
        {
          answer: 'Prince Charles',
          correct: true
        },
        {
          answer: 'Queen Elizabeth',
          correct: true
        },
        {
          answer: 'Lisa Lin',
          correct: false
        }
      ]
    };
  });

  test('token - empty or invalid (not valid logged in user session)', () => {
    // check response when the token is invalid
    const response = requestAdminQuizCreateQuestion(quizId, (token + 100), questionInput);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(UNAUTHORIZED);
  });

  test('token - valid but not the owner of the quiz', () => {
    // create another user
    const token2 = requestAdminAuthRegister('emma.feng@gmail.com', 'password23', 'Emma', 'Feng').object.token;
    // check response when the user is not an owner of the quiz
    const response = requestAdminQuizCreateQuestion(quizId, token2, questionInput);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(FORBIDDEN);
  });

  test('quizId - does not refer to valid quiz', () => {
    // check response for where the quiz id is invalid
    const response = requestAdminQuizCreateQuestion((quizId + 100), token, questionInput);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(FORBIDDEN);
  });

  test.each([
    { question: 'sad' },
    { question: 'ho wmanywords do i have to type to get to fifty characters, i am in the library' },
  ])('invalid question string - < 5 or > 50 characters', ({ question }) => {
    // set the question to the above invalid inputs
    // where the string is less than 5 or greater than 50 characters
    questionInput.question = question;
    // check the response when the questionInput now has an invalid question
    const response = requestAdminQuizCreateQuestion(quizId, token, questionInput);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(BAD_REQUEST);
  });

  test.each([
    { question: 'five!' },
    { question: 'in between' },
    { question: 'fiftycharactersisreallynotthatlongifeelimgettingth' },
  ])('valid question string - between 5-50 characters', ({ question }) => {
    // set the question to the above valid inputs
    // tests edge cases for 5 and 50 characters exactly
    questionInput.question = question;
    // check the response for where the questionInput is valid
    const response = requestAdminQuizCreateQuestion(quizId, token, questionInput);
    expect(response.object).toStrictEqual({ questionId: expect.any(Number) });
    expect(response.status).toStrictEqual(OK);
  });

  test('invalid number of answers - more than six', () => {
    // add new answers to the answers array
    questionInput.answers.unshift({ answer: 'me', correct: false });
    questionInput.answers.unshift({ answer: 'Emma', correct: false });
    questionInput.answers.unshift({ answer: 'Philip', correct: true });
    questionInput.answers.unshift({ answer: 'Diana', correct: true });

    // check the response where there are are invalid number of answers (6)
    const response = requestAdminQuizCreateQuestion(quizId, token, questionInput);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(BAD_REQUEST);
  });

  test('invalid number of answers - less than two', () => {
    // remove two answers from the answers array
    questionInput.answers.shift();
    questionInput.answers.shift();

    // check the response where there are are invalid number of answers (< 2)
    const response = requestAdminQuizCreateQuestion(quizId, token, questionInput);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(BAD_REQUEST);
  });

  test('invalid duration - not a positive number', () => {
    // set the duration to be negative and check it returns an error
    questionInput.duration = -1;

    const response = requestAdminQuizCreateQuestion(quizId, token, questionInput);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(BAD_REQUEST);
  });

  test('invalid duration - sum of quiz durations exceeds 3 minutes', () => {
    requestAdminQuizCreateQuestion(quizId, token, questionInput);
    questionInput.duration = 30;
    // now duration should be 34
    requestAdminQuizCreateQuestion(quizId, token, questionInput);
    // now duration is 94 seconds
    questionInput.duration = 150;
    requestAdminQuizCreateQuestion(quizId, token, questionInput);

    const response = requestAdminQuizCreateQuestion(quizId, token, questionInput);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(BAD_REQUEST);
  });

  test.each([
    { points: 0 },
    { points: 12 },
  ])('invalid point allocation - less than 1, greater than 10', ({ points }) => {
    // set the points to be the invalid inputs above and check that it returns an error
    questionInput.points = points;

    const response = requestAdminQuizCreateQuestion(quizId, token, questionInput);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(BAD_REQUEST);
  });

  test.each([
    { points: 1 },
    { points: 10 },
    { points: 5 },
  ])('valid point allocation - between 1-10', ({ points }) => {
    // check for correct output where the points are correctly between 1 and 10
    questionInput.points = points;

    const response = requestAdminQuizCreateQuestion(quizId, token, questionInput);
    expect(response.object).toStrictEqual({ questionId: expect.any(Number) });
    expect(response.status).toStrictEqual(OK);
  });

  test.each([
    { answer: '' },
    { answer: 'thirtycharactersislikethetwitterlengthman' },
  ])('invalid answer length - less than 1, longer than 30 chars', ({ answer }) => {
    // set the answers to have the invalid answer lengths as above
    // ensure that it returns an error
    questionInput.answers[0].answer = answer;

    const response = requestAdminQuizCreateQuestion(quizId, token, questionInput);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(BAD_REQUEST);
  });

  test.each([
    { answer: '1' },
    { answer: 'thisisastringofthirtcharacters' },
    { answer: 'betweenthirty' }
  ])('valid answer length - between 1-30 characters', ({ answer }) => {
    // set the answers to have a valid answer length and check for valid return
    questionInput.answers[0].answer = answer;

    const response = requestAdminQuizCreateQuestion(quizId, token, questionInput);
    expect(response.object).toStrictEqual({ questionId: expect.any(Number) });
    expect(response.status).toStrictEqual(OK);
  });

  test('invalid answer strings - duplicates of each other', () => {
    // set two answers to be the same and check it returns an error
    questionInput.answers[1].answer = 'Prince Charles';
    questionInput.answers[2].answer = 'Prince Charles';

    const response = requestAdminQuizCreateQuestion(quizId, token, questionInput);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(BAD_REQUEST);
  });

  test('invalid answer corrects - no correct answers', () => {
    // sets all answers to be inccorrect (no correct answers) and check it returns an error
    questionInput.answers[0].correct = false;
    questionInput.answers[1].correct = false;

    const response = requestAdminQuizCreateQuestion(quizId, token, questionInput);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(BAD_REQUEST);
  });

  test('valid question create, test all details input datastore', () => {
    // creates a new Promise to handle asynchronous operations
    sleepSync(1005);
    requestAdminQuizCreateQuestion(quizId, token, questionInput);
    const response = requestAdminQuizInfo(token, quizId);

    // check the output of adminQuizInfo when you create a question
    expect(response.object).toStrictEqual(
      {
        quizId: quizId,
        name: 'lisa',
        timeCreated: expect.any(Number),
        timeLastEdited: expect.any(Number),
        description: 'about me',
        numQuestions: 1,
        questions: [
          {
            questionId: expect.any(Number),
            question: 'Who is the Monarch of England?',
            duration: 4,
            points: 5,
            answers: [
              {
                answer: 'Prince Charles',
                correct: true,
                answerId: expect.any(Number),
                colour: expect.any(String),
              },
              {
                answer: 'Queen Elizabeth',
                correct: true,
                answerId: expect.any(Number),
                colour: expect.any(String),
              },
              {
                answer: 'Lisa Lin',
                correct: false,
                answerId: expect.any(Number),
                colour: expect.any(String)
              }
            ]
          }
        ],
        duration: expect.any(Number),
      }
    );
    expect(response.status).toStrictEqual(OK);
    expect(Number(response.object.timeLastEdited) - Number(response.object.timeCreated)).toBeGreaterThan(0);
  });
});

/// ///////////////////////////////////////////////////////////////////////////////////////
/// ///////////////////////////////ADMIN QUIZ QUESTION MOVE////////////////////////////////
/// ///////////////////////////////////////////////////////////////////////////////////////

// ADMINQUIZQUESTIONMOVE TESTING
describe('adminQuizQuestionMove testing', () => {
  let token: string;
  let quizId: number;
  let questionId1: number;
  let questionId2: number;
  let questionInput1: CreateQuestionInput;
  let questionInput2: CreateQuestionInput;

  beforeEach(() => {
    requestClear();
    // register a new user and create a quiz for them
    token = requestAdminAuthRegister('denji.power@yahoo.com', 'makima12342', 'Himeno', 'Aki').object.token;
    quizId = requestAdminQuizCreate(token, 'csm quiz name', 'jjk dupe perhaps').object.quizId;

    // initialise two question inputs
    questionInput1 = {
      question: 'denjis best girl is?',
      duration: 4,
      points: 5,
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
      ]
    };

    questionInput2 = {
      question: 'do we like aki?',
      duration: 4,
      points: 5,
      answers: [
        {
          answer: 'yes',
          correct: true
        },
        {
          answer: 'lol yes',
          correct: true
        },
        {
          answer: 'zaza',
          correct: true
        }
      ]
    };

    questionId1 = requestAdminQuizCreateQuestion(quizId, token, questionInput1).object.questionId;
    questionId2 = requestAdminQuizCreateQuestion(quizId, token, questionInput2).object.questionId;
  });

  // ===================================== UNAUTHORIZED = 401 ERROR =====================================
  test('empty/invalid token, other parameters valid', () => {
    // check that invalid or empty tokens return ERROR
    const newPosition = 1;
    const response1 = requestAdminQuizQuestionMove(' ', quizId, questionId1, newPosition);
    expect(response1.object).toStrictEqual(ERROR);
    expect(response1.status).toStrictEqual(UNAUTHORIZED);

    const response2 = requestAdminQuizQuestionMove((token + '100'), quizId, questionId1, newPosition);
    expect(response2.object).toStrictEqual(ERROR);
    expect(response2.status).toStrictEqual(UNAUTHORIZED);
  });

  test('empty/invalid token, invalid quizId', () => {
    // check that invalid or empty tokens return ERROR
    // despite invalid quizId
    const newPosition = 1;
    const response1 = requestAdminQuizQuestionMove(' ', quizId + 100, questionId1, newPosition);
    expect(response1.object).toStrictEqual(ERROR);
    expect(response1.status).toStrictEqual(UNAUTHORIZED);

    const response2 = requestAdminQuizQuestionMove((token + '100'), quizId + 100, questionId1, newPosition);
    expect(response2.object).toStrictEqual(ERROR);
    expect(response2.status).toStrictEqual(UNAUTHORIZED);
  });

  test('empty/invalid token, invalid questionId', () => {
    // check that invalid or empty tokens return ERROR
    // despite invalid questionId
    const newPosition = 1;
    const invalidQuestionId: number = questionId1 + questionId2;
    const response1 = requestAdminQuizQuestionMove(' ', quizId, invalidQuestionId, newPosition);
    expect(response1.object).toStrictEqual(ERROR);
    expect(response1.status).toStrictEqual(UNAUTHORIZED);

    const response2 = requestAdminQuizQuestionMove((token + '100'), quizId, invalidQuestionId, newPosition);
    expect(response2.object).toStrictEqual(ERROR);
    expect(response2.status).toStrictEqual(UNAUTHORIZED);
  });

  test('empty/invalid token, invalid newPosition', () => {
    // check that invalid or empty tokens return ERROR
    // despite invalid NewPosition

    // newPosition < 0
    const response1 = requestAdminQuizQuestionMove(' ', quizId, questionId1, -1);
    expect(response1.object).toStrictEqual(ERROR);
    expect(response1.status).toStrictEqual(UNAUTHORIZED);

    const response2 = requestAdminQuizQuestionMove((token + '100'), quizId, questionId1, -1);
    expect(response2.object).toStrictEqual(ERROR);
    expect(response2.status).toStrictEqual(UNAUTHORIZED);

    // newPosition more than (number of questions - 1)
    const response3 = requestAdminQuizQuestionMove(' ', quizId, questionId1, 10000);
    expect(response3.object).toStrictEqual(ERROR);
    expect(response3.status).toStrictEqual(UNAUTHORIZED);

    const response4 = requestAdminQuizQuestionMove((token + '100'), quizId, questionId1, 2);
    expect(response4.object).toStrictEqual(ERROR);
    expect(response4.status).toStrictEqual(UNAUTHORIZED);

    // newPosition not different from current position
    const response5 = requestAdminQuizQuestionMove(' ', quizId, questionId1, 0);
    expect(response5.object).toStrictEqual(ERROR);
    expect(response5.status).toStrictEqual(UNAUTHORIZED);

    const response6 = requestAdminQuizQuestionMove((token + '100'), quizId, questionId2, 1);
    expect(response6.object).toStrictEqual(ERROR);
    expect(response6.status).toStrictEqual(UNAUTHORIZED);
  });

  // ======================================= FORBIDDEN = 403 ERROR =======================================
  test('valid token but user specified by token not an owner of quizId', () => {
    // given a valid token, check that an invalid quiz id means that a FORBIDDEN ERROR is returned
    // despite invalidities in question id and newPosition
    const newPosition = 1;
    // register a new user
    const otherToken = requestAdminAuthRegister('yuvalyuval@yahoo.com', 'jasonjason101', 'Lisa', 'Emma').object.token;

    // all other parameters valid
    const response1 = requestAdminQuizQuestionMove(otherToken, quizId, questionId1, newPosition);
    expect(response1.object).toStrictEqual(ERROR);
    expect(response1.status).toStrictEqual(FORBIDDEN);

    // question invalid
    const invalidQuestionId: number = questionId1 + questionId2;
    const response2 = requestAdminQuizQuestionMove(otherToken, quizId, invalidQuestionId, newPosition);
    expect(response2.object).toStrictEqual(ERROR);
    expect(response2.status).toStrictEqual(FORBIDDEN);

    // invalid newPosition
    // newPosition < 0
    const response3 = requestAdminQuizQuestionMove(otherToken, quizId, questionId1, -1);
    expect(response3.object).toStrictEqual(ERROR);
    expect(response3.status).toStrictEqual(FORBIDDEN);
    // newPosition more than (number of questions - 1)
    const response4 = requestAdminQuizQuestionMove(otherToken, quizId, questionId1, 2);
    expect(response4.object).toStrictEqual(ERROR);
    expect(response4.status).toStrictEqual(FORBIDDEN);
    // newPosition not different from current position
    const response5 = requestAdminQuizQuestionMove(otherToken, quizId, questionId1, 1000);
    expect(response5.object).toStrictEqual(ERROR);
    expect(response5.status).toStrictEqual(FORBIDDEN);
  });

  test('quizId invalid, other parameters valid', () => {
    // check returns error given quiz id invalid where all else is valid
    const newPosition = 1;
    const response = requestAdminQuizQuestionMove(token, (quizId + 100), questionId1, newPosition);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(FORBIDDEN);
  });

  // ====================================== BAD_REQUEST = 400 ERROR ======================================
  test('questionId does not refer to a valid question in quiz', () => {
    const newPosition = 1;
    // create new quiz
    const quizId2: number = requestAdminQuizCreate(token, 'jjk quiz name', 'csm dupe perhaps').object.quizId;
    // add question to that new quiz
    const questionId3: number = requestAdminQuizCreateQuestion(quizId2, token, questionInput1).object.questionId;

    const response = requestAdminQuizQuestionMove(token, quizId, questionId3, newPosition);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(BAD_REQUEST);
  });

  test('newPosition is invalid, other parameters valid', () => {
    // newPosition < 0
    const response1 = requestAdminQuizQuestionMove(token, quizId, questionId1, -1);
    expect(response1.object).toStrictEqual(ERROR);
    expect(response1.status).toStrictEqual(BAD_REQUEST);

    // newPosition greater than 1
    const response2 = requestAdminQuizQuestionMove(token, quizId, questionId1, 2);
    expect(response2.object).toStrictEqual(ERROR);
    expect(response2.status).toStrictEqual(BAD_REQUEST);

    // newPosition is same as current position of quiz requested to be moved
    const response3 = requestAdminQuizQuestionMove(token, quizId, questionId1, 0);
    expect(response3.object).toStrictEqual(ERROR);
    expect(response3.status).toStrictEqual(BAD_REQUEST);

    const response4 = requestAdminQuizQuestionMove(token, quizId, questionId2, 1);
    expect(response4.object).toStrictEqual(ERROR);
    expect(response4.status).toStrictEqual(BAD_REQUEST);
  });

  // ============================================= SUCCESS =============================================
  test('successfully moved quiz question: check return', () => {
    // check that function returns an empty object when a quiz question is successfully moved
    const response1 = requestAdminQuizQuestionMove(token, quizId, questionId1, 1);
    expect(response1.object).toStrictEqual({});
    expect(response1.status).toStrictEqual(OK);

    const response2 = requestAdminQuizQuestionMove(token, quizId, questionId2, 1);
    expect(response2.object).toStrictEqual({});
    expect(response2.status).toStrictEqual(OK);

    const response3 = requestAdminQuizQuestionMove(token, quizId, questionId2, 0);
    expect(response3.object).toStrictEqual({});
    expect(response3.status).toStrictEqual(OK);
  });

  // check success by checking with adminQuizInfo
  test('valid question move #1, test all details input datastore', () => {
    const detail = requestAdminQuizInfo(token, quizId);
    sleepSync(1005);
    requestAdminQuizQuestionMove(token, quizId, questionId1, 1);
    const response = requestAdminQuizInfo(token, quizId);

    expect(response.object).not.toStrictEqual(detail.object);
    expect(response.object).toStrictEqual(
      {
        quizId: quizId,
        name: 'csm quiz name',
        timeCreated: expect.any(Number),
        timeLastEdited: expect.any(Number),
        description: 'jjk dupe perhaps',
        numQuestions: 2,
        questions: [
          {
            questionId: questionId2,
            question: 'do we like aki?',
            duration: 4,
            points: 5,
            answers: [
              {
                answer: 'yes',
                correct: true,
                answerId: expect.any(Number),
                colour: expect.any(String),
              },
              {
                answer: 'lol yes',
                correct: true,
                answerId: expect.any(Number),
                colour: expect.any(String),
              },
              {
                answer: 'zaza',
                correct: true,
                answerId: expect.any(Number),
                colour: expect.any(String)
              }
            ]
          },
          {
            questionId: questionId1,
            question: 'denjis best girl is?',
            duration: 4,
            points: 5,
            answers: [
              {
                answer: 'makima',
                correct: true,
                answerId: expect.any(Number),
                colour: expect.any(String),
              },
              {
                answer: 'reze',
                correct: true,
                answerId: expect.any(Number),
                colour: expect.any(String),
              },
              {
                answer: 'power',
                correct: true,
                answerId: expect.any(Number),
                colour: expect.any(String)
              }
            ]
          }
        ],
        duration: expect.any(Number),
      }
    );
    expect(response.status).toStrictEqual(OK);
    expect(Number(response.object.timeLastEdited) - Number(response.object.timeCreated)).toBeGreaterThan(0);
  });

  test('valid question move #2', () => {
    const detail = requestAdminQuizInfo(token, quizId);
    sleepSync(1005);
    requestAdminQuizQuestionMove(token, quizId, questionId2, 0);
    const response = requestAdminQuizInfo(token, quizId);

    expect(response.object).not.toStrictEqual(detail.object);
    expect(response.object).toStrictEqual(
      {
        quizId: quizId,
        name: 'csm quiz name',
        timeCreated: expect.any(Number),
        timeLastEdited: expect.any(Number),
        description: 'jjk dupe perhaps',
        numQuestions: 2,
        questions: [
          {
            questionId: questionId2,
            question: 'do we like aki?',
            duration: 4,
            points: 5,
            answers: [
              {
                answer: 'yes',
                correct: true,
                answerId: expect.any(Number),
                colour: expect.any(String),
              },
              {
                answer: 'lol yes',
                correct: true,
                answerId: expect.any(Number),
                colour: expect.any(String),
              },
              {
                answer: 'zaza',
                correct: true,
                answerId: expect.any(Number),
                colour: expect.any(String)
              }
            ]
          },
          {
            questionId: questionId1,
            question: 'denjis best girl is?',
            duration: 4,
            points: 5,
            answers: [
              {
                answer: 'makima',
                correct: true,
                answerId: expect.any(Number),
                colour: expect.any(String),
              },
              {
                answer: 'reze',
                correct: true,
                answerId: expect.any(Number),
                colour: expect.any(String),
              },
              {
                answer: 'power',
                correct: true,
                answerId: expect.any(Number),
                colour: expect.any(String)
              }
            ]
          }
        ],
        duration: expect.any(Number),
      }
    );
    expect(response.status).toStrictEqual(OK);
    expect(Number(response.object.timeLastEdited) - Number(response.object.timeCreated)).toBeGreaterThan(0);
  });
});

/// ///////////////////////////////////////////////////////////////////////////////////////
/// /////////////////////////////ADMIN QUIZ QUESTION DELETE////////////////////////////////
/// ///////////////////////////////////////////////////////////////////////////////////////

describe('delete particular question from quiz', () => {
  let token: string;
  let quizId: number;
  let questionId: number;

  beforeEach(() => {
    requestClear();
    token = requestAdminAuthRegister('lisa.lin@yahoo.com', 'verysafe123', 'Pete', 'Smith').object.token;
    quizId = requestAdminQuizCreate(token, 'agnes', 'hammy tassie').object.quizId;

    // create questionInput
    const questionInput: CreateQuestionInput = {
      question: 'when will lisa go to bed',
      duration: 4,
      points: 5,
      answers: [
        {
          answer: '5am',
          correct: true
        },
        {
          answer: '7pm',
          correct: true
        },
        {
          answer: 'never',
          correct: true
        }
      ]
    };

    questionId = requestAdminQuizCreateQuestion(quizId, token, questionInput).object.questionId;
  });

  test('invalid token/empty token', () => {
    const response = requestAdminQuizDeleteQuestion(quizId, questionId, '');

    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(UNAUTHORIZED);
  });

  test('invalid ownership of quiz', () => {
    // create another user to test ownership of quiz
    const token2 = requestAdminAuthRegister('lisa.lin434@gmail.com', 'yippee334', 'Ali', 'Tiff').object.token;

    const response = requestAdminQuizDeleteQuestion(quizId, questionId, token2);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(FORBIDDEN);
  });

  test('invalid quizId', () => {
    const response = requestAdminQuizDeleteQuestion((quizId + 100), questionId, token);

    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(FORBIDDEN);
  });

  test('invalid questionId', () => {
    const response = requestAdminQuizDeleteQuestion(quizId, (questionId + 100), token);

    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(BAD_REQUEST);
  });

  test('invalid questionId - not valid question in this quiz', () => {
    // create another question that's not in the quiz
    const questionId2 = requestAdminQuizCreate(token, 'jesus', 'freemeof4am').object.quizId;
    const response = requestAdminQuizDeleteQuestion(quizId, questionId2, token);

    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(BAD_REQUEST);
  });

  test('valid test', () => {
    // check function returns an empty object upon success
    const response = requestAdminQuizDeleteQuestion(quizId, questionId, token);

    expect(response.object).toStrictEqual({});
    expect(response.status).toStrictEqual(OK);
  });

  test('valid question delete, test all details input datastore', () => {
    // check output with adminQuizInfo
    const detail = requestAdminQuizInfo(token, quizId);
    // create Promise for async
    sleepSync(1005);

    requestAdminQuizDeleteQuestion(quizId, questionId, token);
    const response = requestAdminQuizInfo(token, quizId);
    expect(response.object).not.toStrictEqual(detail.object);
    expect(response.object).toStrictEqual(
      {
        quizId: quizId,
        name: 'agnes',
        timeCreated: expect.any(Number),
        timeLastEdited: expect.any(Number),
        description: 'hammy tassie',
        numQuestions: 0,
        questions: [
        ],
        duration: expect.any(Number),
      }
    );
    expect(response.status).toStrictEqual(OK);
    expect(Number(response.object.timeLastEdited) - Number(response.object.timeCreated)).toBeGreaterThan(0);
  });
});

/// ///////////////////////////////////////////////////////////////////////////////////////
/// //////////////////////////ADMIN QUIZ QUESTION UPDATE///////////////////////////////////
/// ///////////////////////////////////////////////////////////////////////////////////////

describe('adminQuizQuestionUpdate error check', () => {
  let validToken: string;
  let quizId: number;
  let questionId: number;
  let questionBody: CreateQuestionInput;

  beforeEach(() => {
    requestClear();
    validToken = requestAdminAuthRegister('validemail@gmail.com', '123abc!@#', 'Jake', 'Renzella').object.token;
    quizId = requestAdminQuizCreate(validToken, 'Quiz 1', 'Quiz Description').object.quizId;
    questionBody = {
      question: 'Who is the Monarch of England?',
      duration: 4,
      points: 5,
      answers: [
        {
          answer: 'Prince Charles',
          correct: true,
        },
        {
          answer: 'Prince Jono',
          correct: false,
        },
        {
          answer: 'Prince Junchao',
          correct: false,
        },
      ],
    };
    questionId = requestAdminQuizCreateQuestion(quizId, validToken, questionBody).object.questionId;
  });

  test('error: Token is empty', () => {
    const response = requestAdminQuizQuestionUpdate(quizId, questionId, '', questionBody);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(UNAUTHORIZED);
  });

  test('error: Token is not associated with a valid user', () => {
    const response = requestAdminQuizQuestionUpdate(quizId, questionId, (validToken + 100), questionBody);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(UNAUTHORIZED);
  });

  test('error: Quiz does not belong to the user', () => {
    const otherValidToken = requestAdminAuthRegister('otheremail@gmail.com', 'password123', 'Jono', 'Liu').object.token;
    const otherQuizId = requestAdminQuizCreate(otherValidToken, 'Other Quiz', 'Other Description').object.quizId;
    const response = requestAdminQuizQuestionUpdate(otherQuizId, questionId, validToken, questionBody);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(FORBIDDEN);
  });

  test('error: Quiz ID does not refer to a valid quiz', () => {
    const response = requestAdminQuizQuestionUpdate((quizId + 100), questionId, validToken, questionBody);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(FORBIDDEN);
  });

  test('error: Question ID does not refer to a valid question in this quiz', () => {
    const response = requestAdminQuizQuestionUpdate(quizId, (questionId + 100), validToken, questionBody);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(BAD_REQUEST);
  });

  test('error: Question string length is too small and invalid', () => {
    const invalidQuestionBody = { ...questionBody, question: 'Q?' };
    const response = requestAdminQuizQuestionUpdate(quizId, questionId, validToken, invalidQuestionBody);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(BAD_REQUEST);
  });

  test('error: Question string length is too large and invalid', () => {
    const invalidQuestionBody = {
      ...questionBody,
      question: 'This is a question string that is intentionally made too long to exceed the 50 characters limit?'
    };
    const response = requestAdminQuizQuestionUpdate(quizId, questionId, validToken, invalidQuestionBody);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(BAD_REQUEST);
  });

  test('error: Number of answers is not enough and invalid', () => {
    const invalidQuestionBody = {
      ...questionBody,
      answers: [
        { answer: 'Answer 1', correct: true },
      ],
    };
    const response = requestAdminQuizQuestionUpdate(quizId, questionId, validToken, invalidQuestionBody);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(BAD_REQUEST);
  });

  test('error: Number of answers is too much and invalid', () => {
    const invalidQuestionBody = {
      ...questionBody,
      answers: [
        { answer: 'Answer 1', correct: true },
        { answer: 'Answer 2', correct: false },
        { answer: 'Answer 3', correct: false },
        { answer: 'Answer 4', correct: false },
        { answer: 'Answer 5', correct: false },
        { answer: 'Answer 6', correct: false },
        { answer: 'Answer 7', correct: false },
      ],
    };
    const response = requestAdminQuizQuestionUpdate(quizId, questionId, validToken, invalidQuestionBody);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(BAD_REQUEST);
  });

  test('error: duration is a negative number', () => {
    const invalidQuestionBody = {
      ...questionBody,
      duration: -1
    };
    const response = requestAdminQuizQuestionUpdate(quizId, questionId, validToken, invalidQuestionBody);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(BAD_REQUEST);
  });

  test('error: Sum of question durations exceeds 3 minutes', () => {
    const totalDuration = 181;
    const invalidQuestionBody = {
      ...questionBody,
      duration: totalDuration,
    };
    const response = requestAdminQuizQuestionUpdate(quizId, questionId, validToken, invalidQuestionBody);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(BAD_REQUEST);
  });

  test('error: Points awarded for the question are too much and invalid', () => {
    const invalidQuestionBody = {
      ...questionBody,
      points: 11,
    };
    const response = requestAdminQuizQuestionUpdate(quizId, questionId, validToken, invalidQuestionBody);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(BAD_REQUEST);
  });

  test('error: Points awarded for the question are not enough and invalid', () => {
    const invalidQuestionBody = {
      ...questionBody,
      points: 0,
    };
    const response = requestAdminQuizQuestionUpdate(quizId, questionId, validToken, invalidQuestionBody);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(BAD_REQUEST);
  });

  test('error: Answer length is too short and invalid', () => {
    const invalidQuestionBody = {
      ...questionBody,
      answers: [
        { answer: '', correct: true },
      ],
    };
    const response = requestAdminQuizQuestionUpdate(quizId, questionId, validToken, invalidQuestionBody);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(BAD_REQUEST);
  });

  test('error: Answer length is too long and invalid', () => {
    const invalidQuestionBody = {
      ...questionBody,
      answers: [
        { answer: 'Answer with a very long description exceeding 30 characters', correct: true },
      ],
    };
    const response = requestAdminQuizQuestionUpdate(quizId, questionId, validToken, invalidQuestionBody);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(BAD_REQUEST);
  });

  test('error: Answer strings are duplicates of one another', () => {
    const invalidQuestionBody = {
      ...questionBody,
      answers: [
        { answer: 'Answer 1', correct: true },
        { answer: 'Answer 1', correct: false },
      ],
    };
    const response = requestAdminQuizQuestionUpdate(quizId, questionId, validToken, invalidQuestionBody);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(BAD_REQUEST);
  });

  test('error: No corret answers', () => {
    const invalidQuestionBody = {
      ...questionBody,
      answers: [
        { answer: 'ghello', correct: false },
        { answer: 'egreger', correct: false },
      ]
    };
    const response = requestAdminQuizQuestionUpdate(quizId, questionId, validToken, invalidQuestionBody);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(BAD_REQUEST);
  });

  describe('adminQuizQuestionUpdate valid check', () => {
    let validToken: string;
    let quizId: number;
    let questionId: number;
    let questionBody: CreateQuestionInput;

    beforeEach(() => {
      requestClear();
      validToken = requestAdminAuthRegister('validemail@gmail.com', '123abc!@#', 'Jake', 'Renzella').object.token;
      quizId = requestAdminQuizCreate(validToken, 'Quiz 1', 'Quiz Description').object.quizId;
      questionBody = {
        question: 'Who is the Monarch of England?',
        duration: 4,
        points: 5,
        answers: [
          {
            answer: 'Prince Charles',
            correct: true,
          },
          {
            answer: 'Prince Jono',
            correct: false,
          },
          {
            answer: 'Prince Junchao',
            correct: false,
          },
        ],
      };
      questionId = requestAdminQuizCreateQuestion(quizId, validToken, questionBody).object.questionId;
    });

    test('successful question update', () => {
      const updatedQuestionData = {
        question: 'What is the capital of France?',
        duration: 10,
        points: 5,
        answers: [
          { answer: 'Paris', correct: true },
          { answer: 'Berlin', correct: false },
        ],
      };
      const result = requestAdminQuizQuestionUpdate(quizId, questionId, validToken, updatedQuestionData);
      expect(result.object).toStrictEqual({});
      expect(result.status).toStrictEqual(OK);
    });

    test('successful question update with a different question', () => {
      const updatedQuestionData = {
        question: 'What is the capital of Germany?',
        duration: 10,
        points: 5,
        answers: [
          { answer: 'Berlin', correct: true },
          { answer: 'Paris', correct: false },
        ],
      };
      const result = requestAdminQuizQuestionUpdate(quizId, questionId, validToken, updatedQuestionData);
      expect(result.object).toStrictEqual({});
      expect(result.status).toStrictEqual(OK);
    });

    test('successful question update with minimum duration', () => {
      const updatedQuestionData = {
        question: 'What is the capital of France?',
        duration: 1,
        points: 5,
        answers: [
          { answer: 'Paris', correct: true },
          { answer: 'Berlin', correct: false },
        ],
      };
      const result = requestAdminQuizQuestionUpdate(quizId, questionId, validToken, updatedQuestionData);

      expect(result.object).toStrictEqual({});
      expect(result.status).toStrictEqual(OK);
    });

    test('successful question update with maximum duration', () => {
      const updatedQuestionData = {
        question: 'What is the capital of France?',
        duration: 30,
        points: 5,
        answers: [
          { answer: 'Paris', correct: true },
          { answer: 'Berlin', correct: false },
        ],
      };
      const result = requestAdminQuizQuestionUpdate(quizId, questionId, validToken, updatedQuestionData);
      expect(result.object).toStrictEqual({});
      expect(result.status).toStrictEqual(OK);
    });

    test('successful question update with minimum points', () => {
      const updatedQuestionData = {
        question: 'What is the capital of France?',
        duration: 10,
        points: 1,
        answers: [
          { answer: 'Paris', correct: true },
          { answer: 'Berlin', correct: false },
        ],
      };
      const result = requestAdminQuizQuestionUpdate(quizId, questionId, validToken, updatedQuestionData);
      expect(result.object).toStrictEqual({});
      expect(result.status).toStrictEqual(OK);
    });

    test('successful question update with maximum points', () => {
      const updatedQuestionData = {
        question: 'What is the capital of France?',
        duration: 10,
        points: 10,
        answers: [
          { answer: 'Paris', correct: true },
          { answer: 'Berlin', correct: false },
        ],
      };
      const result = requestAdminQuizQuestionUpdate(quizId, questionId, validToken, updatedQuestionData);
      expect(result.object).toStrictEqual({});
      expect(result.status).toStrictEqual(OK);
    });

    test('successful question update with different answers', () => {
      const updatedQuestionData = {
        question: 'What is the capital of France?',
        duration: 10,
        points: 5,
        answers: [
          { answer: 'Paris', correct: true },
          { answer: 'London', correct: false },
        ],
      };
      const result = requestAdminQuizQuestionUpdate(quizId, questionId, validToken, updatedQuestionData);
      expect(result.object).toStrictEqual({});
      expect(result.status).toStrictEqual(OK);
    });

    test('successful question update with minimum answer length', () => {
      const updatedQuestionData = {
        question: 'What is the capital of France?',
        duration: 10,
        points: 5,
        answers: [
          { answer: 'A', correct: true },
          { answer: 'Paris', correct: false },
        ],
      };
      const result = requestAdminQuizQuestionUpdate(quizId, questionId, validToken, updatedQuestionData);
      expect(result.object).toStrictEqual({});
      expect(result.status).toStrictEqual(OK);
    });

    test('successful question update with maximum answer length', () => {
      const updatedQuestionData = {
        question: 'What is the capital of France?',
        duration: 10,
        points: 5,
        answers: [
          { answer: 'ParisParisParisParisParisParis', correct: true },
          { answer: 'Paris', correct: false },
        ],
      };
      const result = requestAdminQuizQuestionUpdate(quizId, questionId, validToken, updatedQuestionData);
      expect(result.object).toStrictEqual({});
      expect(result.status).toStrictEqual(OK);
    });
  });
  test('valid question update, test all details input datastore', () => {
    const updatedQuestionData = {
      question: 'What is the capital of France?',
      duration: 30,
      points: 5,
      answers: [
        { answer: 'Paris', correct: true },
        { answer: 'Berlin', correct: false },
      ],
    };
    const detail = requestAdminQuizInfo(validToken, quizId);
    sleepSync(1005);
    requestAdminQuizQuestionUpdate(quizId, questionId, validToken, updatedQuestionData);
    const response = requestAdminQuizInfo(validToken, quizId);

    expect(response.object).not.toStrictEqual(detail.object);
    expect(response.object).toStrictEqual(
      {
        quizId: quizId,
        name: 'Quiz 1',
        timeCreated: expect.any(Number),
        timeLastEdited: expect.any(Number),
        description: 'Quiz Description',
        numQuestions: 1,
        questions: [
          {
            questionId: questionId,
            question: 'What is the capital of France?',
            duration: 30,
            points: 5,
            answers: [
              {
                answer: 'Paris',
                correct: true,
                answerId: expect.any(Number),
                colour: expect.any(String),
              },
              {
                answer: 'Berlin',
                correct: false,
                answerId: expect.any(Number),
                colour: expect.any(String),
              },
            ],
          }
        ],
        duration: expect.any(Number),
      }
    );
    expect(response.status).toStrictEqual(OK);
    expect(Number(response.object.timeLastEdited) - Number(response.object.timeCreated)).toBeGreaterThan(0);
  });
});

/// ///////////////////////////////////////////////////////////////////////////////////////
/// //////////////////////////ADMIN QUIZ DUPLICATE QUESTION///////////////////////////////////
/// ///////////////////////////////////////////////////////////////////////////////////////

describe('adminQuizDuplicateQuestion error check', () => {
  let validToken: string;
  let quizId: number;
  let questionId: number;
  let questionBody: CreateQuestionInput;

  beforeEach(() => {
    requestClear();
    validToken = requestAdminAuthRegister('validemail@gmail.com', '123abc!@#', 'Jake', 'Renzella').object.token;
    quizId = requestAdminQuizCreate(validToken, 'Quiz 1', 'Quiz Description').object.quizId;
    questionBody = {
      question: 'Who is the Monarch of England?',
      duration: 4,
      points: 5,
      answers: [
        {
          answer: 'Prince Charles',
          correct: true,
        },
        {
          answer: 'Prince Jono',
          correct: false,
        },
        {
          answer: 'Prince Junchao',
          correct: false,
        },
      ],
    };
    questionId = requestAdminQuizCreateQuestion(quizId, validToken, questionBody).object.questionId;
  });

  test('error: Token is empty', () => {
    const response = requestAdminQuizDuplicateQuestion(quizId, questionId, '');
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(UNAUTHORIZED);
  });

  test('error: Token is not associated with a valid user', () => {
    const response = requestAdminQuizDuplicateQuestion(quizId, questionId, 'invalidToken');
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(UNAUTHORIZED);
  });

  test('error: Quiz does not belong to the user', () => {
    const otherValidToken = requestAdminAuthRegister('otheremail@gmail.com', 'password123', 'Jono', 'Liu').object.token;
    const otherQuizId = requestAdminQuizCreate(otherValidToken, 'Other Quiz', 'Other Description').object.quizId;
    const response = requestAdminQuizDuplicateQuestion(otherQuizId, questionId, validToken);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(FORBIDDEN);
  });

  test('error: Quiz ID does not refer to a valid quiz', () => {
    const response = requestAdminQuizDuplicateQuestion(quizId + 100, questionId, validToken);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(FORBIDDEN);
  });

  test('error: Question ID does not refer to a valid question in this quiz', () => {
    const response = requestAdminQuizDuplicateQuestion(quizId, questionId + 100, validToken);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(BAD_REQUEST);
  });

  test('error: Contains duplicate correct answers', () => {
    const invalidQuestionBody = {
      ...questionBody,
      answers: [
        { answer: 'Duplicate Answer', correct: true },
        { answer: 'Duplicate Answer', correct: true },
        { answer: 'Unique Answer', correct: false },
      ],
    };
    const response = requestAdminQuizQuestionUpdate(quizId, questionId, validToken, invalidQuestionBody);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(BAD_REQUEST);
  });

  test('error: Number of answers is invalid', () => {
    const invalidQuestionBody = {
      ...questionBody,
      answers: [{ answer: 'Only Answer', correct: true }]
    };
    const response = requestAdminQuizQuestionUpdate(quizId, questionId, validToken, invalidQuestionBody);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(BAD_REQUEST);
  });

  test('error: Sum of question durations in the quiz exceeds 3 minutes', () => {
    const invalidQuestionBody = {
      ...questionBody,
      duration: 200
    };
    const response = requestAdminQuizQuestionUpdate(quizId, questionId, validToken, invalidQuestionBody);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(BAD_REQUEST);
  });

  test('error: Points awarded for the question are invalid', () => {
    const invalidQuestionBody = {
      ...questionBody,
      points: 0
    };
    const response = requestAdminQuizQuestionUpdate(quizId, questionId, validToken, invalidQuestionBody);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(BAD_REQUEST);
  });

  test('error: Answer length is invalid', () => {
    const invalidQuestionBody = {
      ...questionBody,
      answers: [{ answer: '', correct: true }]
    };
    const response = requestAdminQuizQuestionUpdate(quizId, questionId, validToken, invalidQuestionBody);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(BAD_REQUEST);
  });

  test('error: Answer length is less than 1', () => {
    const invalidQuestionBody = {
      ...questionBody,
      answers: [
        { answer: '', correct: true },
        { answer: 'Prince Jono', correct: false },
        { answer: 'Prince Junchao', correct: false },
      ],
    };
    const response = requestAdminQuizQuestionUpdate(quizId, questionId, validToken, invalidQuestionBody);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(BAD_REQUEST);
  });

  test('error: Answer length is more than 30', () => {
    const invalidQuestionBody = {
      ...questionBody,
      answers: [
        { answer: 'A very long answer string that clearly exceeds the limit of 30 characters', correct: true },
        { answer: 'Prince Jono', correct: false },
        { answer: 'Prince Junchao', correct: false },
      ],
    };
    const response = requestAdminQuizQuestionUpdate(quizId, questionId, validToken, invalidQuestionBody);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(BAD_REQUEST);
  });
});

describe('adminQuizDuplicateQuestion valid check', () => {
  let validToken: string;
  let quizId: number;
  let questionId: number;
  let questionBody: CreateQuestionInput;

  beforeEach(() => {
    requestClear();
    validToken = requestAdminAuthRegister('validemail@gmail.com', '123abc!@#', 'Jake', 'Renzella').object.token;
    quizId = requestAdminQuizCreate(validToken, 'Quiz 1', 'Quiz Description').object.quizId;
    questionBody = {
      question: 'Who is the Monarch of England?',
      duration: 4,
      points: 5,
      answers: [
        {
          answer: 'Prince Charles',
          correct: true,
        },
        {
          answer: 'Prince Jono',
          correct: false,
        },
        {
          answer: 'Prince Junchao',
          correct: false,
        },
      ],
    };
    questionId = requestAdminQuizCreateQuestion(quizId, validToken, questionBody).object.questionId;
  });

  test('success: Duplicate question', () => {
    const response = requestAdminQuizDuplicateQuestion(quizId, questionId, validToken);
    expect(response.object).toStrictEqual({ newQuestionId: expect.any(Number) });
    expect(response.status).toStrictEqual(OK);
  });
  test('valid question create, test all details input datastore', () => {
    const detail = requestAdminQuizInfo(validToken, quizId);
    sleepSync(1005);

    requestAdminQuizDuplicateQuestion(quizId, questionId, validToken);
    const response = requestAdminQuizInfo(validToken, quizId);
    expect(response.object).not.toStrictEqual(detail.object);
    expect(response.object).toStrictEqual(
      {
        quizId: quizId,
        name: 'Quiz 1',
        timeCreated: expect.any(Number),
        timeLastEdited: expect.any(Number),
        description: 'Quiz Description',
        numQuestions: 2,
        questions: [
          {
            questionId: questionId,
            question: 'Who is the Monarch of England?',
            duration: 4,
            points: 5,
            answers: [
              {
                answer: 'Prince Charles',
                correct: true,
                answerId: expect.any(Number),
                colour: expect.any(String),
              },
              {
                answer: 'Prince Jono',
                correct: false,
                answerId: expect.any(Number),
                colour: expect.any(String),
              },
              {
                answer: 'Prince Junchao',
                correct: false,
                answerId: expect.any(Number),
                colour: expect.any(String)
              }
            ]
          },
          {
            questionId: expect.any(Number),
            question: 'Who is the Monarch of England?',
            duration: 4,
            points: 5,
            answers: [
              {
                answer: 'Prince Charles',
                correct: true,
                answerId: expect.any(Number),
                colour: expect.any(String),
              },
              {
                answer: 'Prince Jono',
                correct: false,
                answerId: expect.any(Number),
                colour: expect.any(String),
              },
              {
                answer: 'Prince Junchao',
                correct: false,
                answerId: expect.any(Number),
                colour: expect.any(String)
              }
            ]
          }
        ],
        duration: expect.any(Number),
      }
    );
    expect(response.status).toStrictEqual(OK);
    expect(Number(response.object.timeLastEdited) - Number(response.object.timeCreated)).toBeGreaterThan(0);
  });
});

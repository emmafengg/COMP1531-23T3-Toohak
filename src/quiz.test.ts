import {
  requestClear, requestAdminAuthRegister, requestAdminQuizList,
  requestAdminQuizNameUpdate, requestAdminQuizCreate, requestAdminQuizRemove, requestAdminTrashEmpty,
  requestAdminQuizViewTrash, requestAdminQuizInfo, requestAdminQuizDescriptionUpdate,
  requestAdminQuizRemoveRestore, requestAdminQuizTransfer, requestAdminQuizCreateQuestion,
  requestAdminQuizDeleteQuestion, requestAdminQuizQuestionMove, requestAdminQuizQuestionUpdate, requestAdminQuizDuplicateQuestion
} from './testfunction';

import {
  AdminQuizInfoReturn, AdminQuizInfoQuestions, CreateQuestionInput
} from './interface';
import { sleepSync } from './playround.test';
const ERROR = { error: expect.any(String) };

const OK = 200;
const BAD_REQUEST = 400;
const UNAUTHORIZED = 401;
const FORBIDDEN = 403;

beforeEach(() => {
  requestClear();
});

/// ///////////////////////////////////////////////////////////////////////////////////////
/// ////////////////////////////// ADMIN QUIZ LIST ////// /////////////////////////////////
/// ///////////////////////////////////////////////////////////////////////////////////////

describe('adminQuizList error check', () => {
  let validToken: string;

  beforeEach(() => {
    requestClear();
    validToken = requestAdminAuthRegister('validemail@gmail.com', '123abc!@#', 'Jake', 'Renzella').object.token;
  });

  // Test case for an invalid token greater than registered one
  test('error: Token is not registered', () => {
    const response = requestAdminQuizList(validToken + 100);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(UNAUTHORIZED);
  });

  // Test case for an invalid token less than registered one
  test('error: Token is not registered', () => {
    const response = requestAdminQuizList(validToken + (-100));
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(UNAUTHORIZED);
  });

  // Test case for an invalid token that is non-integer
  test('error: Token is a non-integer', () => {
    const response = requestAdminQuizList('abcd123');
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(UNAUTHORIZED);
  });

  // Test case for an empty authUserId
  test('error: Token is empty', () => {
    const response = requestAdminQuizList('');
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(UNAUTHORIZED);
  });
});

describe('adminQuizList valid check', () => {
  let validToken: string;

  beforeEach(() => {
    requestClear();
  });

  // Test case for when user has no quizzes
  test('user has no quizzes', () => {
    const response = requestAdminQuizList(validToken);
    const quizzes = response.object.quizzes;
    expect(quizzes).toHaveLength(0);
    expect(response.status).toStrictEqual(OK);
  });

  beforeEach(() => {
    validToken = requestAdminAuthRegister('validemail@gmail.com', '123abcdefg', 'Jake', 'Renzella').object.token;
  });

  // Test case for when user has one quiz
  test('user has one quiz', () => {
    const createResponse = requestAdminQuizCreate(validToken, 'My Quiz', 'Quiz Description');
    const quizId = createResponse.object.quizId;
    const listResponse = requestAdminQuizList(validToken);
    const quizzes = listResponse.object.quizzes;
    expect(quizzes).toHaveLength(1);
    expect(quizzes[0].name).toBe('My Quiz');
    expect(quizzes[0].quizId).toBe(quizId);
    expect(listResponse.status).toStrictEqual(OK);
  });

  // Test case for when user has multiple quizzes
  test('user has multiple quizzes', () => {
    const quiz1CreateResponse = requestAdminQuizCreate(validToken, 'Quiz 1', 'Description 1');
    const quiz1Id = quiz1CreateResponse.object.quizId;
    const quiz2CreateResponse = requestAdminQuizCreate(validToken, 'Quiz 2', 'Description 2');
    const quiz2Id = quiz2CreateResponse.object.quizId;
    const listResponse = requestAdminQuizList(validToken);
    const quizzes = listResponse.object.quizzes;
    expect(quizzes).toHaveLength(2);
    expect(quizzes[0].name).toBe('Quiz 1');
    expect(quizzes[0].quizId).toBe(quiz1Id);
    expect(quizzes[1].name).toBe('Quiz 2');
    expect(quizzes[1].quizId).toBe(quiz2Id);
    expect(listResponse.status).toStrictEqual(OK);
  });

  // Test case for when user has removed a quiz
  test('user has removed quiz', () => {
    const quizId: number = requestAdminQuizCreate(validToken, 'good quiz', 'free me').object.quizId;
    const listResponse = requestAdminQuizList(validToken);
    const quizzes = listResponse.object.quizzes;
    expect(quizzes).toHaveLength(1);
    expect(quizzes[0].name).toBe('good quiz');
    expect(quizzes[0].quizId).toBe(quizId);
    expect(listResponse.status).toStrictEqual(OK);
    requestAdminQuizRemove(validToken, quizId);

    const listResponse2 = requestAdminQuizList(validToken);
    const quizzes2 = listResponse2.object.quizzes;
    expect(quizzes2).toHaveLength(0);
    expect(listResponse2.status).toStrictEqual(OK);
  });
});

/// ///////////////////////////////////////////////////////////////////////////////////////
/// ////////////////////////////// ADMIN QUIZ NAME UPDATE /////////////////////////////////
/// ///////////////////////////////////////////////////////////////////////////////////////

describe('adminQuizNameUpdate error check', () => {
  let validToken: string;
  let quizId: number;
  beforeEach(() => {
    requestClear();
    validToken = requestAdminAuthRegister('validemail@gmail.com', '123abc!@#', 'Jake', 'Renzella').object.token;
    quizId = requestAdminQuizCreate(validToken, 'Quiz 1', 'Quiz Description').object.quizId;
  });

  // Test case for when token is empty
  test('error: Token is empty', () => {
    const response = requestAdminQuizNameUpdate('', quizId, 'New Quiz Name');
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(UNAUTHORIZED);
  });

  // Test case for when AuthUserId is not a valid user
  test('error: Token is not associated with a valid user', () => {
    const response = requestAdminQuizNameUpdate((validToken + 100), quizId, 'New Quiz Name');
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(UNAUTHORIZED);
  });

  // Test case for when QuizId is not a valid user
  test('error: Quiz ID does not refer to a valid quiz', () => {
    const response = requestAdminQuizNameUpdate(validToken, (quizId + 100), 'New Quiz Name');
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(FORBIDDEN);
  });

  // Test case for when Quiz ID does not refer to a quiz that this user owns
  test('error: Quiz ID does not refer to a quiz that this user owns', () => {
    const otherValidToken = requestAdminAuthRegister('anotheremail@gmail.com', '123bcd!@#', 'John', 'Doe').object.token;
    const otherQuizId = requestAdminQuizCreate(otherValidToken, 'Other Quiz', 'Other Description').object.quizId;
    const response = requestAdminQuizNameUpdate(validToken, otherQuizId, 'New Quiz Name');
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(FORBIDDEN);
  });

  // Test case for when Name contains invalid characters
  test('error: Name contains invalid characters', () => {
    const INVALID_NAME = 'Invalid Name @#$';
    const response = requestAdminQuizNameUpdate(validToken, quizId, INVALID_NAME);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(BAD_REQUEST);
  });

  // Test case for when Name is too short
  test('error: Name is too short', () => {
    const SHORT_NAME = 'B';
    const response = requestAdminQuizNameUpdate(validToken, quizId, SHORT_NAME);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(BAD_REQUEST);
  });

  // Test case for when Name is too long
  test('error: Name is too long', () => {
    const LONG_NAME = 'B'.repeat(31);
    const response = requestAdminQuizNameUpdate(validToken, quizId, LONG_NAME);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(BAD_REQUEST);
  });

  // Test case for when Name is already used by the user for another quiz
  test('error: Name is already used by the user for another quiz', () => {
    requestAdminQuizCreate(validToken, 'Duplicate Name', 'Duplicate Description');
    const response = requestAdminQuizNameUpdate(validToken, quizId, 'Duplicate Name');
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(BAD_REQUEST);
  });
});

describe('adminQuizNameUpdate valid check', () => {
  let validToken: string;
  let quizId: number;

  beforeEach(() => {
    requestClear();
    validToken = requestAdminAuthRegister('validemail@gmail.com', '123abc!@#', 'Jake', 'Renzella').object.token;
    quizId = requestAdminQuizCreate(validToken, 'Quiz 1', 'Quiz Description').object.quizId;
  });

  // Test case for a successful name update
  test('successful name update', () => {
    const newName = 'New Quiz Name';
    const result = requestAdminQuizNameUpdate(validToken, quizId, newName);
    expect(result.object).toStrictEqual({});
    expect(result.status).toStrictEqual(OK);
    const updatedQuizDetails = requestAdminQuizInfo(validToken, quizId);
    expect(updatedQuizDetails.object.name).toBe(newName);
  });

  // Test case for a successful name update with a different valid name
  test('successful name update with a different valid name', () => {
    const newName = 'Updated Quiz Name';
    const result = requestAdminQuizNameUpdate(validToken, quizId, newName);
    expect(result.object).toStrictEqual({});
    expect(result.status).toStrictEqual(OK);
    const updatedQuizDetails = requestAdminQuizInfo(validToken, quizId);
    expect(updatedQuizDetails.object.name).toBe(newName);
  });

  // Test case for a successful name update to the minimum allowed length
  test('successful name update to minimum allowed length', () => {
    const newName = 'ABC'; // Minimum length is 3
    const result = requestAdminQuizNameUpdate(validToken, quizId, newName);
    expect(result.object).toStrictEqual({});
    expect(result.status).toStrictEqual(OK);
    const updatedQuizDetails = requestAdminQuizInfo(validToken, quizId);
    expect(updatedQuizDetails.object.name).toBe(newName);
  });

  // Test case for a successful name update to the maximum allowed length
  test('successful name update to maximum allowed length', () => {
    const newName = 'A'.repeat(30);
    const result = requestAdminQuizNameUpdate(validToken, quizId, newName);
    expect(result.object).toStrictEqual({});
    expect(result.status).toStrictEqual(OK);
    const updatedQuizDetails = requestAdminQuizInfo(validToken, quizId);
    expect(updatedQuizDetails.object.name).toBe(newName);
  });

  // Test case for timestamp update
  test('successful name update timestamp', () => {
    const detail = requestAdminQuizInfo(validToken, quizId).object;
    const newName = 'A new quiz name';
    sleepSync(1005);

    const result = requestAdminQuizNameUpdate(validToken, quizId, newName);
    expect(result.object).toStrictEqual({});
    expect(result.status).toStrictEqual(OK);
    const updatedQuizDetails = requestAdminQuizInfo(validToken, quizId).object;
    expect(updatedQuizDetails).not.toStrictEqual(detail);
    expect(updatedQuizDetails).toStrictEqual({
      quizId: quizId,
      name: newName,
      timeCreated: expect.any(Number),
      timeLastEdited: expect.any(Number),
      description: 'Quiz Description',
      numQuestions: 0,
      duration: 0,
      questions: []
    });
    expect(Number(updatedQuizDetails.timeLastEdited) - Number(updatedQuizDetails.timeCreated)).toBeGreaterThan(0);
  });
});

/// ///////////////////////////////////////////////////////////////////////////////////////
/// ///////////////////////////////// ADMIN QUIZ CREATE ///////////////////////////////////
/// ///////////////////////////////////////////////////////////////////////////////////////

describe('function testing: adminQuizCreate', () => {
  let token = '0';

  // Test for invalid token input with no users.
  test('invalid token input: no users', () => {
    const response = requestAdminQuizCreate('12563', 'Lisa quiz', 'quiz about me');
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(UNAUTHORIZED);
  });

  beforeEach(() => {
    requestClear();
    // Register a user and obtain a token.
    token = requestAdminAuthRegister('lisa.lin@yahoo.com', 'verysafe123', 'Pete', 'Smith').object.token;
  });

  // Test for invalid token input with the existence of one user.
  test('invalid token input: existence of one user', () => {
    const response = requestAdminQuizCreate((token + 100), 'more quizzes', 'description');
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(UNAUTHORIZED);
  });

  // Test for valid token input with the existence of one user.
  test('valid token input: existence of one user', () => {
    const response = requestAdminQuizCreate(token, 'weekly quiz', 'the quizzes never end');
    expect(response.object).toStrictEqual({ quizId: expect.any(Number) });
    expect(response.status).toStrictEqual(OK);
  });

  // Test for invalid quiz name.
  test('invalid quiz name', () => {
    const response = requestAdminQuizCreate(token, '!@#$%^-=[];', 'when will the quizzes end');
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(BAD_REQUEST);
  });

  // Test for valid quiz names using parameterized tests.
  test.each([
    { name: 'quizname' },
    { name: 'NAMEQUIZ' },
    { name: '123457' },
    { name: 'tahook123' },
    { name: 'be5t Qu1z Nam3' },
  ])('valid quiz names', ({ name }) => {
    const response = requestAdminQuizCreate(token, name, 'free me of the quizzes');
    expect(response.object).toStrictEqual({ quizId: expect.any(Number) });
    expect(response.status).toStrictEqual(OK);
  });

  // Test for invalid length of quiz name using parameterized tests.
  test.each([
    { name: 'q' },
    { name: 'qwertyuiopasdfghjklzxcvbnmolikujyhtg' },
  ])('invalid length of quiz name', ({ name }) => {
    const response = requestAdminQuizCreate(token, name, 'another day another quiz');
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(BAD_REQUEST);
  });

  // Test for valid length of quiz name using parameterized tests.
  test.each([
    { name: 'Qui' },
    { name: 'bestquiznameyay' },
    { name: 'averyverylongquiznamethatgoes1' },
  ])('valid length of quiz name', ({ name }) => {
    const response = requestAdminQuizCreate(token, name, 'another test another quiz');
    expect(response.object).toStrictEqual({ quizId: expect.any(Number) });
    expect(response.status).toStrictEqual(OK);
  });

  // Test for a name that is already used for another quiz.
  test('name already used for another quiz', () => {
    requestAdminQuizCreate(token, 'bestquizname', 'im nearly finished quizzes');

    const response = requestAdminQuizCreate(token, 'bestquizname', 'am i nearly finished quizzes');
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(BAD_REQUEST);
  });

  // Test for a description that has more than 100 characters.
  test('description more than 100 characters', () => {
    const description = 'how many characters does someone need to type out to reach more than a hundred, rather it is a true testament of my patience and ability to count';

    const response = requestAdminQuizCreate(token, 'goodname', description);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(BAD_REQUEST);
  });

  // Test for description lengths between 0-100 characters using parameterized tests.
  test.each([
    { description: '' },
    { description: 'manymanycharactershow many characters is too many characters - when can the characters stop one day ' },
  ])('description is between 0-100 characters long', ({ description }) => {
    const response = requestAdminQuizCreate(token, 'good name', description);
    expect(response.object).toStrictEqual({ quizId: expect.any(Number) });
    expect(response.status).toStrictEqual(OK);
  });
});

/// ///////////////////////////////////////////////////////////////////////////////////////
/// ///////////////////////////////// ADMIN QUIZ REMOVE ///////////////////////////////////
/// ///////////////////////////////////////////////////////////////////////////////////////

// Check for adminQuizRemove error
describe('adminQuizRemove error check', () => {
  let token1: string;
  let quizId1: number;

  beforeEach(() => {
    requestClear();
    // Register a user and create a quiz.
    token1 = requestAdminAuthRegister('validemail@gmail.com', '123abc!@#', 'Jake', 'Renzella').object.token;
    quizId1 = requestAdminQuizCreate(token1, 'Jake', "I'm pretty handsome").object.quizId;
  });

  // Test for the error when the token is empty.
  test('1. error: Token is empty', () => {
    const response = requestAdminQuizRemove('', quizId1);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(UNAUTHORIZED);
  });

  // Test for the error when the token is invalid.
  test('2. error: Token is invalid', () => {
    const response = requestAdminQuizRemove('invalid', quizId1);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(UNAUTHORIZED);
  });

  // Test for the error when a valid token is provided, but the user is not the owner of the quiz.
  test('3. error: Valid token but user is not an owner of the quiz', () => {
    const token2 = requestAdminAuthRegister('valid@gmail.com', '123abc!@#', 'jun', 'Renzella').object.token;
    requestAdminQuizCreate(token2, 'jun', "I'm pretty handsome");
    const response = requestAdminQuizRemove(token2, quizId1);
    expect(response.object).toEqual(ERROR);
    expect(response.status).toBe(FORBIDDEN);
  });
});

// Check when adminQuizRemove parameters are valid
describe('adminQuizRemove valid check', () => {
  let token1: string;
  let quizId1: number;
  let token2: string;
  let quizId2: number;

  beforeEach(() => {
    requestClear();
    // Register users and create quizzes.
    token1 = requestAdminAuthRegister('validemail@gmail.com', '123abc!@#', 'Jake', 'Renzella').object.token;
    quizId1 = requestAdminQuizCreate(token1, 'Jake', "I'm pretty handsome").object.quizId;
    token2 = requestAdminAuthRegister('validemail2@gmail.com', '123abc!@#', 'Jason', 'Renzella').object.token;
    quizId2 = requestAdminQuizCreate(token1, 'Jason', "I'm pretty ").object.quizId;
  });

  // Test for valid parameters with only one data in the datastore.
  test('1. Valid parameters with only one data in datastore', () => {
    const response = requestAdminQuizRemove(token1, quizId1);
    expect(response.object).toEqual({});
    expect(response.status).toBe(OK);

    const Info = requestAdminQuizInfo(token1, quizId1);

    expect(Info.object).toStrictEqual({
      quizId: quizId1,
      name: 'Jake',
      timeCreated: expect.any(Number),
      timeLastEdited: expect.any(Number),
      description: "I'm pretty handsome",
      numQuestions: 0,
      questions: [],
      duration: 0
    });
    expect(Info.status).toStrictEqual(OK);
  });

  // Test for checking if the quiz is removed from the quiz list.
  test('2.Check if removed in quiz list', () => {
    const beforeList = requestAdminQuizList(token1);

    const response = requestAdminQuizRemove(token1, quizId1);
    expect(response.object).toEqual({});
    expect(response.status).toBe(OK);

    const afterList = requestAdminQuizList(token1);
    expect(afterList).not.toEqual(beforeList);
  });

  // Test to ensure that other user's quizzes remain unaffected.
  test('3. Ensure other user quizzes remain unaffected', () => {
    const initialInfoUser2 = requestAdminQuizInfo(token2, quizId2);
    requestAdminQuizRemove(token1, quizId1);
    const afterInfoUser2 = requestAdminQuizInfo(token2, quizId2);
    expect(initialInfoUser2).toEqual(afterInfoUser2);
  });

  // Test to check if the timeLastEdit is updated correctly.
  test('4. Check the timeLastEdit validity', () => {
    const response1 = requestAdminQuizInfo(token1, quizId1);

    requestAdminQuizRemove(token1, quizId1);
    requestAdminQuizRemoveRestore(token1, quizId1);
    const response2 = requestAdminQuizInfo(token1, quizId1);
    expect(response2.object.timeLastEdited).toBeGreaterThanOrEqual(response1.object.timeLastEdited);
    expect(response2.status).toStrictEqual(OK);
  });

  // Test to ensure that the quiz is in the trash after deletion.
  test('5. Ensure quiz is in the trash after deletion', () => {
    requestAdminQuizRemove(token1, quizId1);
    const response = requestAdminQuizViewTrash(token1);
    expect(response.object.quizzes).toHaveLength(1);
    expect(response.status).toBe(OK);
  });
});

// Check if remove and related function work
describe('Trash & Restore Functionality', () => {
  let token1: string;
  let quizId1: number;
  let quizId2: number;

  beforeEach(() => {
    requestClear();
    // Register a user and create two quizzes.
    token1 = requestAdminAuthRegister('validemail@gmail.com', '123abc!@#', 'Jake', 'Renzella').object.token;
    quizId1 = requestAdminQuizCreate(token1, 'Jake', "I'm pretty handsome").object.quizId;
    quizId2 = requestAdminQuizCreate(token1, 'JakeQuiz2', "Jake's second quiz").object.quizId;
  });

  // Test for restoring a quiz from the trash.
  test('1. success: Restore quiz from trash', () => {
    requestAdminQuizRemove(token1, quizId1);
    requestAdminQuizRemoveRestore(token1, quizId1);
    const restoredQuizInfo = requestAdminQuizInfo(token1, quizId1);
    expect(restoredQuizInfo.object).toEqual({
      quizId: quizId1,
      name: 'Jake',
      description: "I'm pretty handsome",
      timeCreated: expect.any(Number),
      timeLastEdited: expect.any(Number),
      numQuestions: 0,
      questions: [],
      duration: expect.any(Number),
    });
  });

  // Test for validating quizzes in the trash before and after permanent deletion.
  test('2. success: Validate quizzes in trash before and after permanent deletion', () => {
    requestAdminQuizRemove(token1, quizId1);
    requestAdminQuizRemove(token1, quizId2);
    const trashResponse1 = requestAdminQuizViewTrash(token1);
    expect(trashResponse1.object).toEqual({
      quizzes: [
        { quizId: quizId1, name: 'Jake' },
        { quizId: quizId2, name: 'JakeQuiz2' }
      ]
    });
    requestAdminTrashEmpty(token1, [quizId1, quizId2]);
    const trashResponse2 = requestAdminQuizViewTrash(token1);
    expect(trashResponse2.object).toEqual({ quizzes: [] });
  });

  // Test for validating properties of a restored quiz.
  test('3. success: Validate properties of restored quiz', () => {
    requestAdminQuizRemove(token1, quizId1);
    requestAdminQuizRemoveRestore(token1, quizId1);
    const restoredQuizInfo = requestAdminQuizInfo(token1, quizId1);
    expect(restoredQuizInfo.object.name).toBe('Jake');
    expect(restoredQuizInfo.object.description).toBe("I'm pretty handsome");
  });

  // Test for moving multiple quizzes to the trash.
  test('4. success: Multiple quizzes moved to trash', () => {
    requestAdminQuizRemove(token1, quizId1);
    requestAdminQuizRemove(token1, quizId2);
    const trashResponse = requestAdminQuizViewTrash(token1);
    expect(trashResponse.object).toEqual({
      quizzes: [
        { quizId: quizId1, name: 'Jake' },
        { quizId: quizId2, name: 'JakeQuiz2' }
      ]
    });
  });

  // Test for restoring one quiz and checking the other remains in the trash.
  test('5. success: Restore one quiz and check the other in trash', () => {
    requestAdminQuizRemove(token1, quizId1);
    requestAdminQuizRemove(token1, quizId2);
    requestAdminQuizRemoveRestore(token1, quizId1);
    const trashResponse = requestAdminQuizViewTrash(token1);
    expect(trashResponse.object).toEqual({ quizzes: [{ quizId: quizId2, name: 'JakeQuiz2' }] });
  });

  // Test for permanently deleting a quiz and checking the other remains in the trash.
  test('6. success: Permanently delete a quiz and check the other in the trash', () => {
    requestAdminQuizRemove(token1, quizId1);
    requestAdminQuizRemove(token1, quizId2);
    requestAdminTrashEmpty(token1, [quizId1]);
    const trashResponse = requestAdminQuizViewTrash(token1);
    expect(trashResponse.object).toEqual({ quizzes: [{ quizId: quizId2, name: 'JakeQuiz2' }] });
  });

  // Test for validating quiz details in the trash before and after restoration.
  test('7. success: Validate quiz details in trash before and after restoration', () => {
    requestAdminQuizRemove(token1, quizId1);
    const beforeRestore = requestAdminQuizViewTrash(token1);
    expect(beforeRestore.object).toEqual({ quizzes: [{ quizId: quizId1, name: 'Jake' }] });
    requestAdminQuizRemoveRestore(token1, quizId1);
    const afterRestore = requestAdminQuizViewTrash(token1);
    expect(afterRestore.object).toEqual({ quizzes: [] });
  });

  // Test to ensure that a quiz is not in the trash after creation.
  test('8. success: Ensure quiz is not in the trash after creation', () => {
    const trashResponse = requestAdminQuizViewTrash(token1);
    expect(trashResponse.object).toEqual({ quizzes: [] });
  });

  // Test to validate that the trash remains unaffected if a quiz removal request is invalid.
  test('9. Fail: Validate trash remains unaffected if quiz removal request is invalid', () => {
    requestAdminQuizRemove('invalid', quizId1);
    const trashResponse = requestAdminQuizViewTrash(token1);
    expect(trashResponse.object).toEqual({ quizzes: [] });
  });

  // Test to ensure that the trash is empty after clearing all quizzes.
  test('10. success: Ensure trash is empty after clearing all quizzes', () => {
    requestAdminTrashEmpty(token1, [quizId1, quizId2]);
    const trashResponse = requestAdminQuizViewTrash(token1);
    expect(trashResponse.object).toEqual({ quizzes: [] });
  });
});

// Extended AdminQuiz Functionality
describe('Extended AdminQuiz Functionality', () => {
  let token1: string;
  let token2: string;
  let quizId1: number;
  let quizId2: number;
  let quizId3: number;

  beforeEach(() => {
    requestClear();
    // Register two users and create three quizzes.
    token1 = requestAdminAuthRegister('validemail1@gmail.com', '123abc!@#', 'Jake', 'Renzella').object.token;
    token2 = requestAdminAuthRegister('validemail2@gmail.com', '123abc!@#', 'John', 'Doe').object.token;
    quizId1 = requestAdminQuizCreate(token1, 'JakeQuiz1', "Jake's first quiz").object.quizId;
    quizId2 = requestAdminQuizCreate(token1, 'JakeQuiz2', "Jake's second quiz").object.quizId;
    quizId3 = requestAdminQuizCreate(token2, 'JohnQuiz', "John's quiz").object.quizId;
  });

  // Test for moving multiple quizzes from different users to the trash.
  test('1. success: Multiple quizzes from different users in trash', () => {
    requestAdminQuizRemove(token1, quizId1);
    requestAdminQuizRemove(token2, quizId3);
    const trashResponse = requestAdminQuizViewTrash(token1);
    expect(trashResponse.object).toEqual({
      quizzes: [
        { quizId: quizId1, name: 'JakeQuiz1' }
      ]
    });
    expect(trashResponse.status).toBe(OK);
  });

  // Test for restoring a quiz by a user.
  test('2. success: Restore quiz by user', () => {
    requestAdminQuizRemove(token1, quizId1);
    requestAdminQuizRemoveRestore(token1, quizId1);
    const restoredQuizInfo = requestAdminQuizInfo(token1, quizId1);
    expect(restoredQuizInfo.object).toEqual({
      quizId: quizId1,
      name: 'JakeQuiz1',
      description: "Jake's first quiz",
      timeCreated: expect.any(Number),
      timeLastEdited: expect.any(Number),
      numQuestions: 0,
      questions: [],
      duration: expect.any(Number),
    });
    expect(restoredQuizInfo.status).toBe(OK);
  });

  // Test for clearing the trash using multiple tokens.
  test('3. success: Clear trash using multiple tokens', () => {
    requestAdminQuizRemove(token1, quizId1);
    requestAdminQuizRemove(token1, quizId2);
    requestAdminQuizRemove(token2, quizId3);
    requestAdminTrashEmpty(token1, [quizId1]);
    requestAdminTrashEmpty(token2, [quizId3]);
    const trashResponse = requestAdminQuizViewTrash(token1);
    expect(trashResponse.object).toEqual({
      quizzes: [
        { quizId: quizId2, name: 'JakeQuiz2' }
      ]
    });
    expect(trashResponse.status).toBe(OK);
  });

  // Test for attempting to restore a permanently deleted quiz.
  test('4. Fail: Trying to restore a permanently deleted quiz', () => {
    requestAdminQuizRemove(token1, quizId2);
    requestAdminTrashEmpty(token1, [quizId2]);
    const response = requestAdminQuizRemoveRestore(token1, quizId2);
    expect(response.status).toBe(FORBIDDEN);
    expect(response.object).toStrictEqual(ERROR);
  });

  // Test for ensuring no changes in the trash after an unsuccessful remove request.
  test('5. success: Ensure no changes in trash after an unsuccessful remove request', () => {
    const initialTrash = requestAdminQuizViewTrash(token1);
    expect(initialTrash.status).toBe(OK);
    requestAdminQuizRemove('invalidToken', quizId2);
    const finalTrash = requestAdminQuizViewTrash(token1);
    expect(initialTrash).toEqual(finalTrash);
    expect(finalTrash.status).toBe(OK);
  });

  // Test for ensuring no changes in the trash after an unsuccessful restore request.
  test('6. success: Ensure no changes in trash after an unsuccessful restore request', () => {
    requestAdminQuizRemove(token1, quizId2);
    const initialTrash = requestAdminQuizViewTrash(token1);
    expect(initialTrash.status).toBe(OK);
    requestAdminQuizRemoveRestore('invalidToken', quizId2);
    const finalTrash = requestAdminQuizViewTrash(token1);
    expect(initialTrash).toEqual(finalTrash);
    expect(finalTrash.status).toBe(OK);
  });

  // Test for checking the trash after deleting all quizzes from users.
  test('7. success: Check trash after deleting all quizzes from user', () => {
    requestAdminQuizRemove(token1, quizId1);
    requestAdminQuizRemove(token1, quizId2);
    requestAdminQuizRemove(token2, quizId3);
    const trashResponse1 = requestAdminQuizViewTrash(token1);
    expect(trashResponse1.object).toEqual({
      quizzes: [
        { quizId: quizId1, name: 'JakeQuiz1' },
        { quizId: quizId2, name: 'JakeQuiz2' },
      ]
    });
    expect(trashResponse1.status).toBe(OK);

    const trashResponse2 = requestAdminQuizViewTrash(token2);
    expect(trashResponse2.object).toEqual({
      quizzes: [
        { quizId: quizId3, name: 'JohnQuiz' },
      ]
    });
    expect(trashResponse2.status).toBe(OK);
  });

  // Test case for updating the timestamp.
  test('successful update timestamp', () => {
    const detail = requestAdminQuizInfo(token1, quizId1).object;
    sleepSync(1005);

    const result = requestAdminQuizRemove(token1, quizId1);
    expect(result.object).toStrictEqual({});
    expect(result.status).toStrictEqual(OK);
    const updatedQuizDetails = requestAdminQuizInfo(token1, quizId1).object;
    expect(updatedQuizDetails).not.toStrictEqual(detail);
    expect(updatedQuizDetails).toStrictEqual({
      quizId: quizId1,
      name: 'JakeQuiz1',
      timeCreated: expect.any(Number),
      timeLastEdited: expect.any(Number),
      description: "Jake's first quiz",
      numQuestions: 0,
      duration: 0,
      questions: []
    });
    expect(Number(updatedQuizDetails.timeLastEdited) - Number(updatedQuizDetails.timeCreated)).toBeGreaterThan(0);
  });
});

/// ///////////////////////////////////////////////////////////////////////////////////////
/// //////////////////////////////ADMIN QUIZ VIEW TRASH////////////////////////////////////
/// ///////////////////////////////////////////////////////////////////////////////////////

// adminQuizTrash endpoint tests
describe('adminQuizTrash endpoint tests', () => {
  let token1: string;
  let quizId1: number;
  let token2: string;

  beforeEach(() => {
    requestClear();
    token1 = requestAdminAuthRegister('validemail@gmail.com', '123abc!@#', 'Jake', 'Renzella').object.token;
    quizId1 = requestAdminQuizCreate(token1, 'Jake', "I'm pretty handsome").object.quizId;
    token2 = requestAdminAuthRegister('validemail2@gmail.com', '456def!@#', 'John', 'Doe').object.token;

    requestAdminQuizRemove(token1, quizId1);
  });

  // Test for successfully viewing quizzes in the trash for the logged-in user.
  test('1. success: View quizzes in trash for the logged-in user', () => {
    const response = requestAdminQuizViewTrash(token1);
    expect(response.object).toEqual({
      quizzes: [
        {
          quizId: quizId1,
          name: 'Jake'
        }
      ]
    });
    expect(response.status).toBe(OK);
  });

  // Test for the case where there are no quizzes in the trash for a new user.
  test('2. success: No quizzes in trash for a new user', () => {
    const response = requestAdminQuizViewTrash(token2);
    expect(response.object).toEqual({
      quizzes: []
    });
    expect(response.status).toBe(OK);
  });

  // Test for having multiple quizzes in the trash for a user.
  test('3. success: Multiple quizzes in trash for a user', () => {
    // Move another quiz of Jake to the trash
    requestAdminQuizRemove(token1, requestAdminQuizCreate(token1, 'Another Jake Quiz', 'Another description').object.quizId);

    const response = requestAdminQuizViewTrash(token1);
    expect(response.object.quizzes).toHaveLength(2);
    expect(response.status).toBe(OK);
  });

  // Test for ensuring that quizzes in the trash remain untouched when new quizzes are added.
  test('4. success: Quizzes in trash remain untouched when new quizzes are added', () => {
    requestAdminQuizCreate(token1, 'New Quiz', 'Fresh description');

    const response = requestAdminQuizViewTrash(token1);
    expect(response.object.quizzes).toHaveLength(1);
    expect(response.status).toBe(OK);
  });
});

// This is the error testing block
describe('adminQuizTrash error tests', () => {
  let token1: string;
  let quizId1: number;

  beforeEach(() => {
    // Clear the request
    requestClear();

    // Register and create a quiz, then remove it to place it in the trash
    token1 = requestAdminAuthRegister('validemail@gmail.com', '123abc!@#', 'Jake', 'Renzella').object.token;
    quizId1 = requestAdminQuizCreate(token1, 'Jake', "I'm pretty handsome").object.quizId;
    requestAdminQuizRemove(token1, quizId1);
  });

  // Test case for when the token is empty
  test('1. error: Token is empty', () => {
    const response = requestAdminQuizViewTrash('');
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toBe(UNAUTHORIZED);
  });

  // Test case for when the token is invalid
  test('2. error: Token is invalid', () => {
    const response = requestAdminQuizViewTrash('userToken');
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toBe(UNAUTHORIZED);
  });
});

// This is the main testing block for the adminQuizTrash endpoint
describe('adminQuizTrash endpoint tests', () => {
  let adminToken: string;
  let userToken: string;
  let quizId1: number;
  let quizId2: number;

  beforeEach(() => {
    requestClear();

    // Register an admin and a user, then create and remove quizzes to place them in the trash
    adminToken = requestAdminAuthRegister('adminemail@gmail.com', '123abc!@#', 'Admin', 'AdminLastName').object.token;
    userToken = requestAdminAuthRegister('useremail@gmail.com', '456def!@#', 'John', 'Doe').object.token;

    // Create and remove an admin's quiz to place it in the trash
    quizId1 = requestAdminQuizCreate(adminToken, 'Admin', "Admin's Quiz").object.quizId;
    requestAdminQuizRemove(adminToken, quizId1);

    // Create and remove a user's quiz to place it in the trash
    quizId2 = requestAdminQuizCreate(userToken, 'John', "John's Quiz").object.quizId;
    requestAdminQuizRemove(userToken, quizId2);
  });

  // Test case for when an admin can view trashed quizzes
  test('1. Admin can view trashed quizzes', () => {
    const response = requestAdminQuizViewTrash(adminToken);
    const expectedQuizzes = [
      {
        name: 'Admin',
        quizId: quizId1
      }
    ];
    expect(response.object.quizzes).toEqual(expect.arrayContaining(expectedQuizzes));
    expect(response.status).toBe(OK);
  });

  // Test case for when a user can view their own trashed quizzes
  test('2. User can view their own trashed quizzes', () => {
    const response = requestAdminQuizViewTrash(userToken);
    const expectedQuizzes = [
      {
        name: 'John',
        quizId: quizId2
      }
    ];
    expect(response.object.quizzes).toEqual(expect.arrayContaining(expectedQuizzes));
    expect(response.status).toBe(OK);
  });

  // Test case for when an admin cannot view trashed quizzes of other users
  test('3. Admin cannot view trashed quizzes of other users', () => {
    const response = requestAdminQuizViewTrash(adminToken);
    const unexpectedQuizzes = [
      {
        quizId: quizId2,
        name: "John's Quiz"
      }
    ];
    expect(response.object.quizzes).not.toEqual(expect.arrayContaining(unexpectedQuizzes));
    expect(response.status).toBe(OK);
  });

  // Test case for viewing the trash after removing and restoring a quiz
  test('view after remove and restore', () => {
    requestAdminQuizRemoveRestore(adminToken, quizId1);
    const response = requestAdminQuizViewTrash(adminToken);
    expect(response.object).toStrictEqual({ quizzes: [] });
    expect(response.status).toStrictEqual(OK);
  });
});

/// ///////////////////////////////////////////////////////////////////////////////////////
/// //////////////////////////////ADMIN QUIZ TRASH EMPTY///////////////////////////////////
/// ///////////////////////////////////////////////////////////////////////////////////////

describe('adminTrashEmpty error check', () => {
  let token1: string;
  let quizId1: number;
  let quizId2: number;

  beforeEach(() => {
    requestClear();
    token1 = requestAdminAuthRegister('validemail1@gmail.com', '123abc!@#', 'Alice', 'Brown').object.token;
    quizId1 = requestAdminQuizCreate(token1, 'Quiz1', 'First quiz').object.quizId;
    quizId2 = requestAdminQuizCreate(token1, 'Quiz2', 'Second quiz').object.quizId;
    requestAdminQuizRemove(token1, quizId1);
    requestAdminQuizRemove(token1, quizId2);
  });

  test('1.error: Token is empty', () => {
    const response = requestAdminTrashEmpty('', [quizId1, quizId2]);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(UNAUTHORIZED);
  });

  test('2.error: Token is invalid', () => {
    const response = requestAdminTrashEmpty('invalid', [quizId1, quizId2]);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(UNAUTHORIZED);
  });

  test('3. Invalid Token with special characters', () => {
    const response = requestAdminTrashEmpty('invalid$token#special', [quizId1, quizId2]);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toBe(UNAUTHORIZED);
  });

  test('4. Valid token but no quizIds provided', () => {
    const response = requestAdminTrashEmpty(token1, []);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toBe(FORBIDDEN);
  });

  test('5. Valid token but all quizIds are invalid', () => {
    const response = requestAdminTrashEmpty(token1, [quizId1 + 100, quizId2 + 100]);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toBe(FORBIDDEN);
  });

  test('6. Valid token but some quizIds are invalid', () => {
    const response = requestAdminTrashEmpty(token1, [quizId1, quizId2 + 100]);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toBe(FORBIDDEN);
  });

  test('7. Valid token and quizIds but one of the quizzes is not owned by the user', () => {
    const token2 = requestAdminAuthRegister('validemail2@gmail.com', '123abc!@#', 'Bob', 'Smith').object.token;
    const quizId3 = requestAdminQuizCreate(token2, 'Quiz3', 'Third quiz').object.quizId;
    requestAdminQuizRemove(token2, quizId3);

    const response = requestAdminTrashEmpty(token1, [quizId1, quizId3]);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toBe(FORBIDDEN);
  });

  test('8. Valid parameters but all quizzes already permanently deleted', () => {
    requestAdminTrashEmpty(token1, [quizId1, quizId2]); // Permanently delete both quizzes
    const response = requestAdminTrashEmpty(token1, [quizId1, quizId2]); // Try to delete them again
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toBe(FORBIDDEN);
  });

  test('9. Valid parameters however quizId is not currently in trash', () => {
    const activeQuiz = requestAdminQuizCreate(token1, 'quiz', 'good quiz').object.quizId;

    const response = requestAdminTrashEmpty(token1, [quizId1, activeQuiz]);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toBe(BAD_REQUEST);
  });
});

// check when adminTrashEmpty parameters are valid
describe('adminQuizTrashEmpty valid scenarios', () => {
  let token1: string;
  let quizId1: number;
  let quizId2: number;
  let quizId3: number;

  beforeEach(() => {
    requestClear();
    token1 = requestAdminAuthRegister('validemail1@gmail.com', '123abc!@#', 'Alice', 'Brown').object.token;
    quizId1 = requestAdminQuizCreate(token1, 'Quiz1', 'First quiz').object.quizId;
    quizId2 = requestAdminQuizCreate(token1, 'Quiz2', 'Second quiz').object.quizId;
    quizId3 = requestAdminQuizCreate(token1, 'Quiz3', 'Third quiz').object.quizId;

    requestAdminQuizRemove(token1, quizId1);
    requestAdminQuizRemove(token1, quizId2);
    requestAdminQuizRemove(token1, quizId3);
  });

  test('1. Valid parameters with a single quiz in trash', () => {
    const response = requestAdminTrashEmpty(token1, [quizId1]);
    expect(response.object).toEqual({});
    expect(response.status).toBe(OK);
  });

  test('2. Valid parameters with multiple quizzes in trash', () => {
    const response = requestAdminTrashEmpty(token1, [quizId1, quizId2, quizId3]);
    expect(response.object).toEqual({});
    expect(response.status).toBe(OK);
  });

  test('3. Valid parameters, delete quizzes one by one', () => {
    let response = requestAdminTrashEmpty(token1, [quizId1]);
    expect(response.object).toEqual({});
    expect(response.status).toBe(OK);

    response = requestAdminTrashEmpty(token1, [quizId2]);
    expect(response.object).toEqual({});
    expect(response.status).toBe(OK);

    response = requestAdminTrashEmpty(token1, [quizId3]);
    expect(response.object).toEqual({});
    expect(response.status).toBe(OK);
  });

  test('4. Valid parameters, delete a quiz and then attempt to delete it again with another quiz', () => {
    let response = requestAdminTrashEmpty(token1, [quizId1]);
    expect(response.object).toEqual({});
    expect(response.status).toBe(OK);

    response = requestAdminTrashEmpty(token1, [quizId1, quizId2]);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toBe(FORBIDDEN);
  });
});

describe('use adminQuizViewTrash to test', () => {
  let token1: string;
  let quizId1: number;
  let quizId2: number;

  beforeEach(() => {
    requestClear();
    token1 = requestAdminAuthRegister('validemail1@gmail.com', '123abc!@#', 'Alice', 'Brown').object.token;
    quizId1 = requestAdminQuizCreate(token1, 'Quiz1', 'First quiz').object.quizId;
    quizId2 = requestAdminQuizCreate(token1, 'Quiz2', 'Second quiz').object.quizId;

    requestAdminQuizRemove(token1, quizId1);
    requestAdminQuizRemove(token1, quizId2);
  });

  // Valid Scenarios
  test('1. Valid Token with quizzes in trash', () => {
    const response = requestAdminQuizViewTrash(token1);
    expect(response).toEqual({
      object: {
        quizzes: [
          { quizId: quizId1, name: 'Quiz1' },
          { quizId: quizId2, name: 'Quiz2' }
        ]
      },
      status: 200
    });
  });

  test('2. Valid Token but no quizzes in trash', () => {
    // First, remove all quizzes from the trash
    requestAdminTrashEmpty(token1, [quizId1, quizId2]);

    const response = requestAdminQuizViewTrash(token1);
    expect(response).toEqual({
      object: {
        quizzes: []
      },
      status: 200
    });
  });
});

/// ///////////////////////////////////////////////////////////////////////////////////////
/// /////////////////////////////////ADMIN QUIZ INFO///////////////////////////////////////
/// ///////////////////////////////////////////////////////////////////////////////////////

// ADMINQUIZINFO FUNCTION TESTING
// relies on adminAuthRegister and adminQuizCreate
describe('adminQuizInfo - function testing', () => {
  beforeEach(() => {
    requestClear();
  });

  // TESTS ERROR OUTPUT
  // 1  -   no users and no quizzes
  test('invalid TOKEN, invalid QUIZID: no users or quizzes', () => {
    const response = requestAdminQuizInfo('123', 123);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(UNAUTHORIZED);
  });

  // 2 -  existence of one user but invalid quiz id
  // valid user and quiz but incorrect quiz input
  test('valid TOKEN, invalid QUIZID input', () => {
    const token: string = requestAdminAuthRegister('emma@yahoo.com', 'emmalisa123', 'emma', 'lisa').object.token;
    const quizId: number = requestAdminQuizCreate(token, 'tahook123', 'painful group assignment').object.quizId;

    const response = requestAdminQuizInfo(token, quizId + 100);

    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(FORBIDDEN);
  });

  // 3 -  existence of multiple valid users but invalid quiz id
  // valid users and quiz but incorrect quiz input
  test('multiple valid TOKENS, invalid QUIZID input', () => {
    const token1: string = requestAdminAuthRegister('emma23@yahoo.com', 'emmalisa123', 'emma', 'lisa').object.token;
    requestAdminAuthRegister('abcd1@yahoo.com', 'abcddcba123', 'fnfnfnfnfn', 'lnlnlnlnln');
    const quizId: number = requestAdminQuizCreate(token1, 'tahook123', 'painful group assignment').object.quizId;

    const response = requestAdminQuizInfo(token1, quizId + 100);

    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(FORBIDDEN);
  });

  // 4 -  existence of one user and valid quiz id, but invalid user ID and quiz ID inputted
  // valid user and quiz but incorrect inputs for both
  test('invalid TOKEN, invalid QUIZID input', () => {
    const token: string = requestAdminAuthRegister('emma2@yahoo.com', 'emmalisa123', 'emma', 'lisa').object.token;
    const quizId: number = requestAdminQuizCreate(token, 'tahook123', 'painful group assignment').object.quizId;

    const response = requestAdminQuizInfo(token + '100', quizId + 100);

    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(UNAUTHORIZED);
  });

  // 5 -  existence of one user and valid quiz id, but invalid user ID inputted
  // valid user and quiz but incorrect user input
  test('invalid TOKEN, valid QUIZID input', () => {
    const token: string = requestAdminAuthRegister('emma@yahoo.com', 'emmalisa123', 'emma', 'lisa').object.token;
    const quizId: number = requestAdminQuizCreate(token, 'tahook123', 'painful group assignment').object.quizId;

    const response = requestAdminQuizInfo(token + '100', quizId);

    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(UNAUTHORIZED);
  });

  // 6 -  existence of multiple valid users but invalid quiz id
  // valid users and quizzes but inputted someone else's quiz
  test('multiple valid TOKENS, invalid QUIZID input - not owned', () => {
    const token1: string = requestAdminAuthRegister('emma@yahoo.com', 'emmalisa123', 'emma', 'lisa').object.token;
    const token2: string = requestAdminAuthRegister('abcd@yahoo.com', 'abcddcba321', 'fnfnfnfnfn', 'lnlnlnln').object.token;
    requestAdminQuizCreate(token1, 'tahook123', 'painful group assignment');
    const quizId: number = requestAdminQuizCreate(token2, 'tahook321', 'collusion haha').object.quizId;

    const response = requestAdminQuizInfo(token1, quizId);

    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(FORBIDDEN);
  });

  // TESTING CORRECT OUTPUT
  // 7 -  existence of one user and valid quiz id
  test('valid TOKEN, valid QUIZID input: one user', () => {
    const token: string = requestAdminAuthRegister('emma@yahoo.com', 'emmalisa123', 'emma', 'lisa').object.token;
    const quizId: number = requestAdminQuizCreate(token, 'tahook123', 'painful group assignment').object.quizId;

    const response = requestAdminQuizInfo(token, quizId);

    expect(response.object).toStrictEqual(
      {
        quizId: quizId,
        name: 'tahook123',
        timeCreated: expect.any(Number),
        timeLastEdited: expect.any(Number),
        description: 'painful group assignment',
        numQuestions: 0,
        questions: [],
        duration: expect.any(Number),
      }
    );
    expect(response.status).toStrictEqual(OK);
  });

  // 8 -  existence of multiple users  and valid quiz id
  test('valid TOKEN, valid QUIZID input: multiple users', () => {
    const token1: string = requestAdminAuthRegister('emma@yahoo.com', 'emmalisa123', 'emma', 'lisa').object.token;
    const quizId: number = requestAdminQuizCreate(token1, 'tahook123', 'painful group assignment').object.quizId;

    const token2: string = requestAdminAuthRegister('abcd@yahoo.com', 'abcddcba321', 'fnfnfnfnfn', 'lnlnlnlnln').object.token;
    requestAdminQuizCreate(token2, 'tahook321', 'collusion haha');

    const response = requestAdminQuizInfo(token1, quizId);

    expect(response.object).toStrictEqual(
      {
        quizId: quizId,
        name: 'tahook123',
        timeCreated: expect.any(Number),
        timeLastEdited: expect.any(Number),
        description: 'painful group assignment',
        numQuestions: 0,
        questions: [],
        duration: expect.any(Number),
      }
    );
    expect(response.status).toStrictEqual(OK);
  });
});

describe('complex tests with adminQuizInfo', () => {
  let token: string;
  let quizId: number;
  let quizObject: AdminQuizInfoReturn;

  beforeEach(() => {
    requestClear();
    token = requestAdminAuthRegister('panicking@gmail.com', 'ihatePanik2', 'name', 'last').object.token;
    quizId = requestAdminQuizCreate(token, 'help me', 'i cant help').object.quizId;
    quizObject = {
      quizId,
      name: 'help me',
      timeCreated: expect.any(Number),
      timeLastEdited: expect.any(Number),
      description: 'i cant help',
      numQuestions: 0,
      questions: [],
      duration: expect.any(Number),
    };
    const response = requestAdminQuizInfo(token, quizId);
    expect(response.object).toStrictEqual(quizObject);
    expect(response.status).toStrictEqual(OK);
  });

  test('owns one quiz, and quiz removed', () => {
    requestAdminQuizRemove(token, quizId);
    requestAdminTrashEmpty(token, [quizId]);
    const response2 = requestAdminQuizInfo(token, quizId);
    expect(response2.object).toStrictEqual(ERROR);
    expect(response2.status).toStrictEqual(FORBIDDEN);
  });

  test('quiz name updated', () => {
    requestAdminQuizNameUpdate(token, quizId, 'bettwer name');
    quizObject.name = 'bettwer name';

    const response2 = requestAdminQuizInfo(token, quizId);
    expect(response2.object).toStrictEqual(quizObject);
    expect(response2.status).toStrictEqual(OK);
  });

  test('quiz description updated', () => {
    requestAdminQuizDescriptionUpdate(quizId, token, 'new descriptioj');
    quizObject.description = 'new descriptioj';

    const response2 = requestAdminQuizInfo(token, quizId);
    expect(response2.object).toStrictEqual(quizObject);
    expect(response2.status).toStrictEqual(OK);
  });

  test('quiz transferred to another user', () => {
    const token2 = requestAdminAuthRegister('goodemail@gmail.com', 'PasshhjW132', 'name', 'bad').object.token;
    requestAdminQuizTransfer(token, quizId, 'goodemail@gmail.com');

    const response2 = requestAdminQuizInfo(token, quizId);
    expect(response2.object).toStrictEqual(ERROR);
    expect(response2.status).toStrictEqual(FORBIDDEN);

    const response3 = requestAdminQuizInfo(token2, quizId);
    expect(response3.object).toStrictEqual(quizObject);
    expect(response3.status).toStrictEqual(OK);
  });

  let questionInput: CreateQuestionInput;
  let question: AdminQuizInfoQuestions;
  let questionId: number;

  beforeEach(() => {
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

    question = {
      questionId: expect.any(Number),
      question: 'Who is the Monarch of England?',
      duration: 4,
      points: 5,
      answers: [
        {
          answerId: expect.any(Number),
          answer: 'Prince Charles',
          colour: expect.any(String),
          correct: true
        },
        {
          answerId: expect.any(Number),
          answer: 'Queen Elizabeth',
          colour: expect.any(String),
          correct: true,
        },
        {
          answerId: expect.any(Number),
          answer: 'Lisa Lin',
          colour: expect.any(String),
          correct: false
        }
      ]
    };
    quizObject.questions.push(question);
    quizObject.numQuestions = 1;

    questionId = requestAdminQuizCreateQuestion(quizId, token, questionInput).object.questionId;
  });

  test('question created', () => {
    const response = requestAdminQuizInfo(token, quizId);
    expect(response.object).toStrictEqual(quizObject);
    expect(response.status).toStrictEqual(OK);
  });

  test('question deleted', () => {
    requestAdminQuizDeleteQuestion(quizId, questionId, token);
    quizObject.questions.splice(0, 1);
    quizObject.numQuestions = 0;

    const response = requestAdminQuizInfo(token, quizId);
    expect(response.object).toStrictEqual(quizObject);
    expect(response.status).toStrictEqual(OK);
  });

  test('question moved', () => {
    const question2: CreateQuestionInput = {
      question: 'can lisa finish her tests?',
      duration: 4,
      points: 5,
      answers: [
        {
          answer: 'no',
          correct: true
        },
        {
          answer: 'yes',
          correct: true,
        },
        {
          answer: 'free me',
          correct: false
        }
      ]
    };

    const questionOutput: AdminQuizInfoQuestions = {
      questionId: expect.any(Number),
      question: 'can lisa finish her tests?',
      duration: 4,
      points: 5,
      answers: [
        {
          answerId: expect.any(Number),
          answer: 'no',
          colour: expect.any(String),
          correct: true
        },
        {
          answerId: expect.any(Number),
          answer: 'yes',
          colour: expect.any(String),
          correct: true,
        },
        {
          answerId: expect.any(Number),
          answer: 'free me',
          colour: expect.any(String),
          correct: false
        }
      ]
    };

    quizObject.questions.splice(0, 0, questionOutput);
    quizObject.numQuestions = 2;
    requestAdminQuizCreateQuestion(quizId, token, question2);
    requestAdminQuizQuestionMove(token, quizId, questionId, 1);

    const response = requestAdminQuizInfo(token, quizId);
    expect(response.object).toStrictEqual(quizObject);
    expect(response.status).toStrictEqual(OK);
  });

  test('question updated details', () => {
    questionInput.question = 'help lisa from misery?';
    questionInput.duration = 3;
    questionInput.points = 5;

    question.question = 'help lisa from misery?';
    question.duration = 3;
    question.points = 5;

    quizObject.questions = [];
    quizObject.questions.push(question);

    requestAdminQuizQuestionUpdate(quizId, questionId, token, questionInput);

    const response = requestAdminQuizInfo(token, quizId);
    expect(response.object).toStrictEqual(quizObject);
    expect(response.status).toStrictEqual(OK);
  });

  test('question duplicated', () => {
    requestAdminQuizDuplicateQuestion(quizId, questionId, token);
    quizObject.numQuestions = 2;
    quizObject.questions.push(question);

    const response2 = requestAdminQuizInfo(token, quizId);
    expect(response2.object).toStrictEqual(quizObject);
    expect(response2.status).toStrictEqual(OK);
  });
});

/// ///////////////////////////////////////////////////////////////////////////////////////
/// //////////////////////////ADMIN QUIZ DESCRIPTION UPDATE////////////////////////////////
/// ///////////////////////////////////////////////////////////////////////////////////////

describe('function testing: adminQuizDescriptionUpdate', () => {
  beforeEach(() => {
    requestClear();
  });

  test('invalid AuthUserId input: no users', () => {
    const response = requestAdminQuizDescriptionUpdate(562088, '456325', 'quiz about who');
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(UNAUTHORIZED);
  });

  let quizId: number;
  let token: string;

  beforeEach(() => {
    requestClear();
    token = requestAdminAuthRegister('timothee@hotmail.com', 'octopus13', 'Beth', 'Laus').object.token;
    quizId = requestAdminQuizCreate(token, 'good quiz', 'the best quiz').object.quizId;
  });

  test('invalid token input: existence of one user', () => {
    const response = requestAdminQuizDescriptionUpdate(quizId, (token + 100), 'not so good quiz');
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(UNAUTHORIZED);
  });

  test('invalid quiz input: user does not own this quiz', () => {
    const token2 = requestAdminAuthRegister('sukhesh@gmail.com', 'ostrich12', 'Mary', 'Smith').object.token;
    const response = requestAdminQuizDescriptionUpdate(quizId, token2, 'and her name was...');
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(FORBIDDEN);
  });

  test('invalid quiz input: existence of one user', () => {
    const response = requestAdminQuizDescriptionUpdate((quizId + 100), token, 'and her name was...');
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(FORBIDDEN);
  });

  test('invalid description: more than 100 characters', () => {
    const newDescription = 'there was a great war waged between the australians and the emus, and despite the long and treacherous battle';
    const response = requestAdminQuizDescriptionUpdate(quizId, token, newDescription);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(BAD_REQUEST);
  });

  test('valid AuthUserID input: existence of one user', () => {
    const response = requestAdminQuizDescriptionUpdate(quizId, token, 'not so good quiz');
    expect(response.object).toStrictEqual({});
    expect(response.status).toStrictEqual(OK);
  });

  test.each([
    { newDescription: '' },
    { newDescription: 'one dayyy we will leave this life behinddd so live a lifee that you remmmemebvererrr my father told ' },
  ])('description is between 0-100 characters long', ({ newDescription }) => {
    const response = requestAdminQuizDescriptionUpdate(quizId, token, newDescription);
    expect(response.object).toStrictEqual({});
    expect(response.status).toStrictEqual(OK);
  });

  // Test case for timestamp update
  test('successful update timestamp', () => {
    const detail = requestAdminQuizInfo(token, quizId).object;

    sleepSync(1005);
    const newDescription = 'one dayyy we will leave this life behinddd so live a lifee that you remmmemebvererrr my father told ';

    const result = requestAdminQuizDescriptionUpdate(quizId, token, newDescription);
    expect(result.object).toStrictEqual({});
    expect(result.status).toStrictEqual(OK);
    const response = requestAdminQuizInfo(token, quizId).object;
    expect(response).not.toStrictEqual(detail);
    expect(response).toStrictEqual({
      quizId: quizId,
      name: 'good quiz',
      timeCreated: expect.any(Number),
      timeLastEdited: expect.any(Number),
      description: newDescription,
      numQuestions: 0,
      duration: 0,
      questions: []
    });
    expect(Number(response.timeLastEdited) - Number(response.timeCreated)).toBeGreaterThan(0);
  });
});

/// ///////////////////////////////////////////////////////////////////////////////////////
/// /////////////////////////////////ADMIN QUIZ TRANSFER///////////////////////////////////
/// ///////////////////////////////////////////////////////////////////////////////////////

// ADMINQUIZTRANSFER TEST SUITE
describe('adminQuizTransfer testing', () => {
  let token1: string;
  let token2: string;
  let quizId1: number;
  let invalidToken: string;
  const email1 = 'emma.lisa@gmail.com';
  const email2 = 'jaja.yuyu@yahoo.com';
  const invalidEmail = email1 + email2;

  beforeEach(() => {
    requestClear();
    token1 = requestAdminAuthRegister(email1, 'verysafe123', 'Jason', 'Yuval').object.token;
    token2 = requestAdminAuthRegister(email2, 'Ilovecomp1531', 'Vally', 'Sonny').object.token;
    invalidToken = token1 + token2;

    quizId1 = requestAdminQuizCreate(token1, 'more quizzes', 'a good description').object.quizId;
  });

  // ===================================== UNAUTHORIZED = 401 ERROR =====================================
  test('empty token and empty/invalid email', () => {
    const response1 = requestAdminQuizTransfer(' ', quizId1, ' ');
    expect(response1.object).toStrictEqual(ERROR);
    expect(response1.status).toStrictEqual(UNAUTHORIZED);

    const response2 = requestAdminQuizTransfer(' ', quizId1, invalidEmail);
    expect(response2.object).toStrictEqual(ERROR);
    expect(response2.status).toStrictEqual(UNAUTHORIZED);
  });

  test('invalid token and empty/invalid email', () => {
    const response1 = requestAdminQuizTransfer(invalidToken, quizId1, ' ');
    expect(response1.object).toStrictEqual(ERROR);
    expect(response1.status).toStrictEqual(UNAUTHORIZED);

    const response2 = requestAdminQuizTransfer(invalidToken, quizId1, invalidEmail);
    expect(response2.object).toStrictEqual(ERROR);
    expect(response2.status).toStrictEqual(UNAUTHORIZED);
  });

  test('empty/invalid token and invalid quizId', () => {
    const response1 = requestAdminQuizTransfer(' ', (quizId1 + 100), email1);
    expect(response1.object).toStrictEqual(ERROR);
    expect(response1.status).toStrictEqual(UNAUTHORIZED);

    const response2 = requestAdminQuizTransfer(invalidToken, (quizId1 + 100), email2);
    expect(response2.object).toStrictEqual(ERROR);
    expect(response2.status).toStrictEqual(UNAUTHORIZED);
  });

  // ======================================= FORBIDDEN = 403 ERROR =======================================
  test('valid token but user specified by token not an owner of quizId', () => {
    // another user's email
    const response1 = requestAdminQuizTransfer(token2, quizId1, email1);
    expect(response1.object).toStrictEqual(ERROR);
    expect(response1.status).toStrictEqual(FORBIDDEN);

    // their own email
    const response2 = requestAdminQuizTransfer(token2, quizId1, email2);
    expect(response2.object).toStrictEqual(ERROR);
    expect(response2.status).toStrictEqual(FORBIDDEN);
    // empty email
    const response3 = requestAdminQuizTransfer(token2, quizId1, ' ');
    expect(response3.object).toStrictEqual(ERROR);
    expect(response3.status).toStrictEqual(FORBIDDEN);
  });

  // ====================================== BAD_REQUEST = 400 ERROR ======================================
  test('token valid but invalid quizId', () => {
    // another user's email
    const response1 = requestAdminQuizTransfer(token2, (quizId1 + 100), email1);
    expect(response1.object).toStrictEqual(ERROR);
    expect(response1.status).toStrictEqual(FORBIDDEN);

    // their own email
    const response2 = requestAdminQuizTransfer(token2, (quizId1 + 100), email2);
    expect(response2.object).toStrictEqual(ERROR);
    expect(response2.status).toStrictEqual(FORBIDDEN);
    // empty email
    const response3 = requestAdminQuizTransfer(token2, (quizId1 + 100), ' ');
    expect(response3.object).toStrictEqual(ERROR);
    expect(response3.status).toStrictEqual(FORBIDDEN);
  });

  test('provided email does not correspond to a registered user', () => {
    const response = requestAdminQuizTransfer(token1, quizId1, invalidEmail);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(BAD_REQUEST);
  });

  test('email provided is email of the token user (transferring to themselves)', () => {
    const response = requestAdminQuizTransfer(token1, quizId1, email1);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(BAD_REQUEST);
  });

  test('target user already has quiz with that name', () => {
    // create quiz with same name for second user
    const quizId2: number = requestAdminQuizCreate(token2, 'more quizzes', 'a good description').object.quizId;
    const response1 = requestAdminQuizTransfer(token1, quizId1, email2);
    expect(response1.object).toStrictEqual(ERROR);
    expect(response1.status).toStrictEqual(BAD_REQUEST);

    const response2 = requestAdminQuizTransfer(token2, quizId2, email1);
    expect(response2.object).toStrictEqual(ERROR);
    expect(response2.status).toStrictEqual(BAD_REQUEST);
  });

  // ============================================= SUCCESS =============================================
  test('successfully transferred quiz: check return', () => {
    // transfer quizId1 from token1 to token2
    const response1 = requestAdminQuizTransfer(token1, quizId1, email2);
    expect(response1.object).toStrictEqual({});
    expect(response1.status).toStrictEqual(OK);

    // transfer quizId1 back from token2 to token1
    requestAdminQuizCreate(token1, 'another name', 'a better description');
    const response2 = requestAdminQuizTransfer(token2, quizId1, email1);
    expect(response2.object).toStrictEqual({});
    expect(response2.status).toStrictEqual(OK);
  });

  // Test case for timestamp update
  test('successful update timestamp', () => {
    sleepSync(1005);

    const result = requestAdminQuizTransfer(token1, quizId1, email2);
    expect(result.object).toStrictEqual({});
    expect(result.status).toStrictEqual(OK);
    const response1 = requestAdminQuizInfo(token1, quizId1);
    expect(response1.object).toStrictEqual(ERROR);
    expect(response1.status).toStrictEqual(FORBIDDEN);
    const response2 = requestAdminQuizInfo(token2, quizId1);
    expect(response2.status).toStrictEqual(OK);
    expect(response2).not.toStrictEqual(response1);
    expect(response2.object).toStrictEqual({
      quizId: quizId1,
      name: 'more quizzes',
      timeCreated: expect.any(Number),
      timeLastEdited: expect.any(Number),
      description: 'a good description',
      numQuestions: 0,
      duration: 0,
      questions: []
    });
    expect(Number(response2.object.timeLastEdited) - Number(response2.object.timeCreated)).toBeGreaterThan(0);
  });
});

/// ///////////////////////////////////////////////////////////////////////////////////////
/// /////////////////////////////ADMIN QUIZ REMOVE RESTORE/////////////////////////////////
/// ///////////////////////////////////////////////////////////////////////////////////////
// ADMINQUIZREMOVERESTORE TEST WRAPPER

describe('function testing: adminQuizRemoveRestore', () => {
  let token1: string;
  let token2: string;
  let quizId1: number;

  // ===================================== UNAUTHORIZED = 401 ERROR =====================================
  test('quiz id and token both invalid: no users + no quizzes', () => {
    const response = requestAdminQuizRemoveRestore('randomtoken', 12345);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(UNAUTHORIZED);
  });

  beforeEach(() => {
    requestClear();
    token1 = requestAdminAuthRegister('emma.lisa@gmail.com', 'verysafe123', 'Jason', 'Yuval').object.token;
    token2 = requestAdminAuthRegister('jaja.yuyu@yahoo.com', 'comp1531suckshaha', 'Vally', 'Sonny').object.token;
    quizId1 = requestAdminQuizCreate(token1, 'more quizzes', 'a good description').object.quizId;
  });

  test('token is empty, quizId valid', () => {
    const response = requestAdminQuizRemoveRestore('', quizId1);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(UNAUTHORIZED);
  });

  test('token is invalid, quizId valid', () => {
    const invalidToken: string = token1 + token2;

    const response = requestAdminQuizRemoveRestore(invalidToken, quizId1);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(UNAUTHORIZED);
  });

  // ======================================= FORBIDDEN = 403 ERROR =======================================
  test('valid token but user is not an owner of this quiz', () => {
    const quizId2: number = requestAdminQuizCreate(token2, 'different name', 'another good description').object.quizId;
    requestAdminQuizRemove(token1, quizId1);

    const response1 = requestAdminQuizRemoveRestore(token2, quizId1);
    expect(response1.object).toStrictEqual(ERROR);
    expect(response1.status).toStrictEqual(FORBIDDEN);

    requestAdminQuizRemove(token2, quizId2);
    const response2 = requestAdminQuizRemoveRestore(token1, quizId2);
    expect(response2.object).toStrictEqual(ERROR);
    expect(response2.status).toStrictEqual(FORBIDDEN);
  });

  // ====================================== BAD_REQUEST = 400 ERROR ======================================
  test('quiz id does not refer to a valid / existing quiz', () => {
    const quizId2: number = requestAdminQuizCreate(token2, 'different name', 'another good description').object.quizId;

    const invalidQuizId: number = quizId1 + quizId2;
    const response = requestAdminQuizRemoveRestore(token1, invalidQuizId);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(FORBIDDEN);
  });

  test('quiz name of the restored quiz is already used by another active quiz owned by the user', () => {
    requestAdminQuizRemove(token1, quizId1);
    // create a quiz with same name as quizId1
    requestAdminQuizCreate(token1, 'more quizzes', 'a good description');
    const response = requestAdminQuizRemoveRestore(token1, quizId1);

    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(BAD_REQUEST);
  });

  test('quiz id refers to a quiz that is not currently in the trash', () => {
    requestAdminQuizRemoveRestore(token1, quizId1);
    const response = requestAdminQuizRemoveRestore(token1, quizId1);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(BAD_REQUEST);
  });

  // ============================================= SUCCESS =============================================
  test('check function return type for success', () => {
    requestAdminQuizRemove(token1, quizId1);

    const response1 = requestAdminQuizRemoveRestore(token1, quizId1);
    expect(response1.object).toStrictEqual({});
    expect(response1.status).toStrictEqual(OK);

    const quizId2: number = requestAdminQuizCreate(token2, 'different name', 'another good description').object.quizId;
    requestAdminQuizRemove(token2, quizId2);

    const response2 = requestAdminQuizRemoveRestore(token2, quizId2);
    expect(response2.object).toStrictEqual({});
    expect(response2.status).toStrictEqual(OK);
  });

  // Test case for timestamp update
  test('successful update timestamp', () => {
    requestAdminQuizRemove(token1, quizId1);
    sleepSync(1005);

    const response1 = requestAdminQuizRemoveRestore(token1, quizId1);
    expect(response1.object).toStrictEqual({});
    expect(response1.status).toStrictEqual(OK);
    const response = requestAdminQuizInfo(token1, quizId1).object;
    expect(response).toStrictEqual({
      quizId: quizId1,
      name: 'more quizzes',
      timeCreated: expect.any(Number),
      timeLastEdited: expect.any(Number),
      description: 'a good description',
      numQuestions: 0,
      duration: 0,
      questions: []
    });
    expect(Number(response.timeLastEdited) - Number(response.timeCreated)).toBeGreaterThan(0);
  });
});

import {
  requestClear, requestAdminAuthRegister, requestAdminQuizListV2, requestAdminQuizCreateV2, requestAdminQuizRemoveV2, requestAdminTrashEmptyV2,
  requestAdminQuizViewTrashV2, requestAdminQuizInfo, requestAdminQuizDescriptionUpdateV2, requestAdminQuizNameUpdateV2,
  requestAdminQuizRemoveRestoreV2, requestAdminQuizTransferV2, requestAdminQuizInfoV2, requestAdminQuizThumbnailUpdate,
  requestAdminQuizCreateSession, requestAdminQuizCreateQuestionV2, requestAdminQuizSessionUpdate
} from './testfunction';

import {
  AdminQuizInfoReturnV2, CreateQuestionInput
} from './interface';

const ERROR = { error: expect.any(String) };

const OK = 200;
const BAD_REQUEST = 400;
const UNAUTHORIZED = 401;
const FORBIDDEN = 403;

beforeEach(() => {
  requestClear();
});

/// ///////////////////////////////////////////////////////////////////////////////////////
/// ///////////////////////////////// ADMIN QUIZ CREATEV2 ///////////////////////////////////
/// ///////////////////////////////////////////////////////////////////////////////////////
describe('function testing: adminQuizCreateV2', () => {
  let token = '0';

  // Test for invalid token input with no users.
  test('invalid token input: no users', () => {
    const response = requestAdminQuizCreateV2('12563', 'Lisa quiz', 'quiz about me');
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
    const response = requestAdminQuizCreateV2((token + 100), 'more quizzes', 'description');
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(UNAUTHORIZED);
  });

  // Test for valid token input with the existence of one user.
  test('valid token input: existence of one user', () => {
    const response = requestAdminQuizCreateV2(token, 'weekly quiz', 'the quizzes never end');
    expect(response.object).toStrictEqual({ quizId: expect.any(Number) });
    expect(response.status).toStrictEqual(OK);
  });

  // Test for invalid quiz name.
  test('invalid quiz name', () => {
    const response = requestAdminQuizCreateV2(token, '!@#$%^-=[];', 'when will the quizzes end');
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
    const response = requestAdminQuizCreateV2(token, name, 'free me of the quizzes');
    expect(response.object).toStrictEqual({ quizId: expect.any(Number) });
    expect(response.status).toStrictEqual(OK);
  });

  // Test for invalid length of quiz name using parameterized tests.
  test.each([
    { name: 'q' },
    { name: 'qwertyuiopasdfghjklzxcvbnmolikujyhtg' },
  ])('invalid length of quiz name', ({ name }) => {
    const response = requestAdminQuizCreateV2(token, name, 'another day another quiz');
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(BAD_REQUEST);
  });

  // Test for valid length of quiz name using parameterized tests.
  test.each([
    { name: 'Qui' },
    { name: 'bestquiznameyay' },
    { name: 'averyverylongquiznamethatgoes1' },
  ])('valid length of quiz name', ({ name }) => {
    const response = requestAdminQuizCreateV2(token, name, 'another test another quiz');
    expect(response.object).toStrictEqual({ quizId: expect.any(Number) });
    expect(response.status).toStrictEqual(OK);
  });

  // Test for a name that is already used for another quiz.
  test('name already used for another quiz', () => {
    requestAdminQuizCreateV2(token, 'bestquizname', 'im nearly finished quizzes');

    const response = requestAdminQuizCreateV2(token, 'bestquizname', 'am i nearly finished quizzes');
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(BAD_REQUEST);
  });

  // Test for a description that has more than 100 characters.
  test('description more than 100 characters', () => {
    const description = 'how many characters does someone need to type out to reach more than a hundred, rather it is a true testament of my patience and ability to count';

    const response = requestAdminQuizCreateV2(token, 'goodname', description);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(BAD_REQUEST);
  });

  // Test for description lengths between 0-100 characters using parameterized tests.
  test.each([
    { description: '' },
    { description: 'manymanycharactershow many characters is too many characters - when can the characters stop one day ' },
  ])('description is between 0-100 characters long', ({ description }) => {
    const response = requestAdminQuizCreateV2(token, 'good name', description);
    expect(response.object).toStrictEqual({ quizId: expect.any(Number) });
    expect(response.status).toStrictEqual(OK);
  });
});

// /// ///////////////////////////////////////////////////////////////////////////////////////
// /// //////////////////////////ADMIN QUIZ DESCRIPTION UPDATEV2////////////////////////////////
// /// ///////////////////////////////////////////////////////////////////////////////////////

describe('function testing: adminQuizDescriptionUpdateV2', () => {
  beforeEach(() => {
    requestClear();
  });

  test('invalid AuthUserId input: no users', () => {
    const response = requestAdminQuizDescriptionUpdateV2(562088, '456325', 'quiz about who');
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(UNAUTHORIZED);
  });

  let quizId: number;
  let token: string;

  beforeEach(() => {
    requestClear();
    token = requestAdminAuthRegister('timothee@hotmail.com', 'octopus13', 'Beth', 'Laus').object.token;
    quizId = requestAdminQuizCreateV2(token, 'good quiz', 'the best quiz').object.quizId;
  });

  test('invalid token input: existence of one user', () => {
    const response = requestAdminQuizDescriptionUpdateV2(quizId, (token + 100), 'not so good quiz');
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(UNAUTHORIZED);
  });

  test('invalid quiz input: user does not own this quiz', () => {
    const token2 = requestAdminAuthRegister('sukhesh@gmail.com', 'ostrich12', 'Mary', 'Smith').object.token;
    const response = requestAdminQuizDescriptionUpdateV2(quizId, token2, 'and her name was...');
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(FORBIDDEN);
  });

  test('invalid quiz input: existence of one user', () => {
    const response = requestAdminQuizDescriptionUpdateV2((quizId + 100), token, 'and her name was...');
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(FORBIDDEN);
  });

  test('invalid description: more than 100 characters', () => {
    const newDescription = 'there was a great war waged between the australians and the emus, and despite the long and treacherous battle';
    const response = requestAdminQuizDescriptionUpdateV2(quizId, token, newDescription);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(BAD_REQUEST);
  });

  test('valid AuthUserID input: existence of one user', () => {
    const response = requestAdminQuizDescriptionUpdateV2(quizId, token, 'not so good quiz');
    expect(response.object).toStrictEqual({});
    expect(response.status).toStrictEqual(OK);
  });

  test.each([
    { newDescription: '' },
    { newDescription: 'one dayyy we will leave this life behinddd so live a lifee that you remmmemebvererrr my father told ' },
  ])('description is between 0-100 characters long', ({ newDescription }) => {
    const response = requestAdminQuizDescriptionUpdateV2(quizId, token, newDescription);
    expect(response.object).toStrictEqual({});
    expect(response.status).toStrictEqual(OK);
  });
});

/// ////////////////////////////////////////////////////////////////////////////////////
/// ////////////////////////////// ADMIN QUIZ REMOVE V2 ////////////////////////////////
/// ////////////////////////////////////////////////////////////////////////////////////

describe('adminQuizRemove error check', () => {
  let token1: string;
  let quizId1: number;

  beforeEach(() => {
    requestClear();
    token1 = requestAdminAuthRegister('validemail@gmail.com', '123abc!@#', 'Jake', 'Renzella').object.token;
    quizId1 = requestAdminQuizCreateV2(token1, 'Jake', "I'm pretty handsome").object.quizId;
  });

  // Test for the error when the token is empty.
  test('1. error: Token is empty', () => {
    const response = requestAdminQuizRemoveV2('', quizId1);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(UNAUTHORIZED);
  });

  // Test for the error when the token is invalid.
  test('2. error: Token is invalid', () => {
    const response = requestAdminQuizRemoveV2('invalid', quizId1);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(UNAUTHORIZED);
  });

  // Test for the error when a valid token is provided, but the user is not the owner of the quiz.
  test('3. error: Valid token but user is not an owner of the quiz', () => {
    const token2 = requestAdminAuthRegister('valid@gmail.com', '123abc!@#', 'jun', 'Renzella').object.token;
    requestAdminQuizCreateV2(token2, 'jun', "I'm pretty handsome");
    const response = requestAdminQuizRemoveV2(token2, quizId1);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(FORBIDDEN);
  });

  test('4. error: Quiz has active sessions', () => {
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
    requestAdminQuizCreateQuestionV2(quizId1, token1, question);
    const sessionId = requestAdminQuizCreateSession(quizId1, 4, token1).object.sessionId;
    requestAdminQuizSessionUpdate(token1, quizId1, sessionId, 'NEXT_QUESTION');
    const response = requestAdminQuizRemoveV2(token1, quizId1);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(BAD_REQUEST);
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
    quizId1 = requestAdminQuizCreateV2(token1, 'Jake', "I'm pretty handsome").object.quizId;
    token2 = requestAdminAuthRegister('validemail2@gmail.com', '123abc!@#', 'Jason', 'Renzella').object.token;
    quizId2 = requestAdminQuizCreateV2(token1, 'Jason', "I'm pretty ").object.quizId;
  });

  // Test for valid parameters with only one data in the datastore.
  test('1. Valid parameters with only one data in datastore', () => {
    const response = requestAdminQuizRemoveV2(token1, quizId1);
    expect(response.object).toStrictEqual({});
    expect(response.status).toBe(OK);

    const Info = requestAdminQuizInfoV2(token1, quizId1);

    expect(Info.object).toStrictEqual({
      quizId: quizId1,
      name: 'Jake',
      timeCreated: expect.any(Number),
      timeLastEdited: expect.any(Number),
      description: "I'm pretty handsome",
      numQuestions: 0,
      thumbnailUrl: expect.any(String),
      questions: [],
      duration: 0
    });
    expect(Info.status).toStrictEqual(OK);
  });

  // Test for checking if the quiz is removed from the quiz list.
  test('2.Check if removed in quiz list', () => {
    const beforeList = requestAdminQuizListV2(token1);

    const response = requestAdminQuizRemoveV2(token1, quizId1);
    expect(response.object).toStrictEqual({});
    expect(response.status).toBe(OK);

    const afterList = requestAdminQuizListV2(token1);
    expect(afterList).not.toStrictEqual(beforeList);
  });

  // Test to ensure that other user's quizzes remain unaffected.
  test('3. Ensure other user quizzes remain unaffected', () => {
    const initialInfoUser2 = requestAdminQuizInfoV2(token2, quizId2);
    requestAdminQuizRemoveV2(token1, quizId1);
    const afterInfoUser2 = requestAdminQuizInfoV2(token2, quizId2);
    expect(initialInfoUser2).toStrictEqual(afterInfoUser2);
  });

  // Test to check if the timeLastEdit is updated correctly.
  test('4. Check the timeLastEdit validity', () => {
    const response1 = requestAdminQuizInfoV2(token1, quizId1);

    requestAdminQuizRemoveV2(token1, quizId1);
    requestAdminQuizRemoveRestoreV2(token1, quizId1);
    const response2 = requestAdminQuizInfoV2(token1, quizId1);
    expect(response2.object.timeLastEdited).toBeGreaterThanOrEqual(response1.object.timeLastEdited);
    expect(response2.status).toStrictEqual(OK);
  });

  // Test to ensure that the quiz is in the trash after deletion.
  test('5. Ensure quiz is in the trash after deletion', () => {
    requestAdminQuizRemoveV2(token1, quizId1);
    const response = requestAdminQuizViewTrashV2(token1);
    expect(response.object.quizzes).toHaveLength(1);
    expect(response.status).toBe(OK);
  });

  test('5.  Quiz has END sessions', () => {
    const sessionId = requestAdminQuizCreateSession(quizId1, 4, token1).object.sessionId;
    requestAdminQuizSessionUpdate(token1, quizId1, sessionId, 'END');
    const response = requestAdminQuizRemoveV2(token1, quizId1);
    expect(response.object).toStrictEqual({});
    expect(response.status).toStrictEqual(OK);
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
    quizId1 = requestAdminQuizCreateV2(token1, 'Jake', "I'm pretty handsome").object.quizId;
    quizId2 = requestAdminQuizCreateV2(token1, 'JakeQuiz2', "Jake's second quiz").object.quizId;
  });

  // Test for restoring a quiz from the trash.
  test('1. success: Restore quiz from trash', () => {
    requestAdminQuizRemoveV2(token1, quizId1);
    requestAdminQuizRemoveRestoreV2(token1, quizId1);
    const restoredQuizInfo = requestAdminQuizInfoV2(token1, quizId1);
    expect(restoredQuizInfo.object).toStrictEqual({
      quizId: quizId1,
      name: 'Jake',
      description: "I'm pretty handsome",
      timeCreated: expect.any(Number),
      timeLastEdited: expect.any(Number),
      numQuestions: 0,
      thumbnailUrl: expect.any(String),
      questions: [],
      duration: expect.any(Number),
    });
  });

  // Test for validating quizzes in the trash before and after permanent deletion.
  test('2. success: Validate quizzes in trash before and after permanent deletion', () => {
    requestAdminQuizRemoveV2(token1, quizId1);
    requestAdminQuizRemoveV2(token1, quizId2);
    const trashResponse1 = requestAdminQuizViewTrashV2(token1);

    expect(trashResponse1.object).toStrictEqual({
      quizzes: [
        { quizId: quizId1, name: 'Jake' },
        { quizId: quizId2, name: 'JakeQuiz2' }
      ]
    });
    requestAdminTrashEmptyV2(token1, [quizId1, quizId2]);
    const trashResponse2 = requestAdminQuizViewTrashV2(token1);
    expect(trashResponse2.object).toStrictEqual({ quizzes: [] });
  });

  // Test for validating properties of a restored quiz.
  test('3. success: Validate properties of restored quiz', () => {
    requestAdminQuizRemoveV2(token1, quizId1);
    requestAdminQuizRemoveRestoreV2(token1, quizId1);
    const restoredQuizInfo = requestAdminQuizInfoV2(token1, quizId1);
    expect(restoredQuizInfo.object.name).toStrictEqual('Jake');
    expect(restoredQuizInfo.object.description).toStrictEqual("I'm pretty handsome");
  });

  // Test for moving multiple quizzes to the trash.
  test('4. success: Multiple quizzes moved to trash', () => {
    requestAdminQuizRemoveV2(token1, quizId1);
    requestAdminQuizRemoveV2(token1, quizId2);
    const trashResponse = requestAdminQuizViewTrashV2(token1);
    expect(trashResponse.object).toStrictEqual({
      quizzes: [
        { quizId: quizId1, name: 'Jake' },
        { quizId: quizId2, name: 'JakeQuiz2' }
      ]
    });
  });

  // Test for restoring one quiz and checking the other remains in the trash.
  test('5. success: Restore one quiz and check the other in trash', () => {
    requestAdminQuizRemoveV2(token1, quizId1);
    requestAdminQuizRemoveV2(token1, quizId2);
    requestAdminQuizRemoveRestoreV2(token1, quizId1);
    const trashResponse = requestAdminQuizViewTrashV2(token1);
    expect(trashResponse.object).toStrictEqual({ quizzes: [{ quizId: quizId2, name: 'JakeQuiz2' }] });
  });

  // Test for permanently deleting a quiz and checking the other remains in the trash.
  test('6. success: Permanently delete a quiz and check the other in the trash', () => {
    requestAdminQuizRemoveV2(token1, quizId1);
    requestAdminQuizRemoveV2(token1, quizId2);
    requestAdminTrashEmptyV2(token1, [quizId1]);
    const trashResponse = requestAdminQuizViewTrashV2(token1);
    expect(trashResponse.object).toStrictEqual({ quizzes: [{ quizId: quizId2, name: 'JakeQuiz2' }] });
  });

  // Test for validating quiz details in the trash before and after restoration.
  test('7. success: Validate quiz details in trash before and after restoration', () => {
    requestAdminQuizRemoveV2(token1, quizId1);
    const beforeRestore = requestAdminQuizViewTrashV2(token1);
    expect(beforeRestore.object).toStrictEqual({ quizzes: [{ quizId: quizId1, name: 'Jake' }] });
    requestAdminQuizRemoveRestoreV2(token1, quizId1);
    const afterRestore = requestAdminQuizViewTrashV2(token1);
    expect(afterRestore.object).toStrictEqual({ quizzes: [] });
  });

  // Test to ensure that a quiz is not in the trash after creation.
  test('8. success: Ensure quiz is not in the trash after creation', () => {
    const trashResponse = requestAdminQuizViewTrashV2(token1);
    expect(trashResponse.object).toStrictEqual({ quizzes: [] });
  });

  // Test to validate that the trash remains unaffected if a quiz removal request is invalid.
  test('9. Fail: Validate trash remains unaffected if quiz removal request is invalid', () => {
    requestAdminQuizRemoveV2('invalid', quizId1);
    const trashResponse = requestAdminQuizViewTrashV2(token1);
    expect(trashResponse.object).toStrictEqual({ quizzes: [] });
  });

  // Test to ensure that the trash is empty after clearing all quizzes.
  test('10. success: Ensure trash is empty after clearing all quizzes', () => {
    requestAdminTrashEmptyV2(token1, [quizId1, quizId2]);
    const trashResponse = requestAdminQuizViewTrashV2(token1);
    expect(trashResponse.object).toStrictEqual({ quizzes: [] });
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
    quizId1 = requestAdminQuizCreateV2(token1, 'JakeQuiz1', "Jake's first quiz").object.quizId;
    quizId2 = requestAdminQuizCreateV2(token1, 'JakeQuiz2', "Jake's second quiz").object.quizId;
    quizId3 = requestAdminQuizCreateV2(token2, 'JohnQuiz', "John's quiz").object.quizId;
  });

  // Test for moving multiple quizzes from different users to the trash.
  test('1. success: Multiple quizzes from different users in trash', () => {
    requestAdminQuizRemoveV2(token1, quizId1);
    requestAdminQuizRemoveV2(token2, quizId3);
    const trashResponse = requestAdminQuizViewTrashV2(token1);
    expect(trashResponse.object).toStrictEqual({
      quizzes: [
        { quizId: quizId1, name: 'JakeQuiz1' }
      ]
    });
    expect(trashResponse.status).toBe(OK);
  });

  // Test for restoring a quiz by a user.
  test('2. success: Restore quiz by user', () => {
    requestAdminQuizRemoveV2(token1, quizId1);
    requestAdminQuizRemoveRestoreV2(token1, quizId1);
    const restoredQuizInfo = requestAdminQuizInfoV2(token1, quizId1);
    expect(restoredQuizInfo.object).toStrictEqual({
      quizId: quizId1,
      name: 'JakeQuiz1',
      description: "Jake's first quiz",
      timeCreated: expect.any(Number),
      timeLastEdited: expect.any(Number),
      numQuestions: 0,
      thumbnailUrl: expect.any(String),
      questions: [],
      duration: expect.any(Number),
    });
    expect(restoredQuizInfo.status).toBe(OK);
  });

  // Test for clearing the trash using multiple tokens.
  test('3. success: Clear trash using multiple tokens', () => {
    requestAdminQuizRemoveV2(token1, quizId1);
    requestAdminQuizRemoveV2(token1, quizId2);
    requestAdminQuizRemoveV2(token2, quizId3);
    requestAdminTrashEmptyV2(token1, [quizId1]);
    requestAdminTrashEmptyV2(token2, [quizId3]);
    const trashResponse = requestAdminQuizViewTrashV2(token1);
    expect(trashResponse.object).toStrictEqual({
      quizzes: [
        { quizId: quizId2, name: 'JakeQuiz2' }
      ]
    });
    expect(trashResponse.status).toBe(OK);
  });

  // Test for attempting to restore a permanently deleted quiz.
  test('4. Fail: Trying to restore a permanently deleted quiz', () => {
    requestAdminQuizRemoveV2(token1, quizId2);
    requestAdminTrashEmptyV2(token1, [quizId2]);
    const response = requestAdminQuizRemoveRestoreV2(token1, quizId2);
    expect(response.status).toBe(FORBIDDEN);
    expect(response.object).toStrictEqual(ERROR);
  });

  // Test for ensuring no changes in the trash after an unsuccessful remove request.
  test('5. success: Ensure no changes in trash after an unsuccessful remove request', () => {
    const initialTrash = requestAdminQuizViewTrashV2(token1);
    expect(initialTrash.status).toBe(OK);
    requestAdminQuizRemoveV2('invalidToken', quizId2);
    const finalTrash = requestAdminQuizViewTrashV2(token1);
    expect(initialTrash).toStrictEqual(finalTrash);
    expect(finalTrash.status).toBe(OK);
  });

  // Test for ensuring no changes in the trash after an unsuccessful restore request.
  test('6. success: Ensure no changes in trash after an unsuccessful restore request', () => {
    requestAdminQuizRemoveV2(token1, quizId2);
    const initialTrash = requestAdminQuizViewTrashV2(token1);
    expect(initialTrash.status).toBe(OK);
    requestAdminQuizRemoveRestoreV2('invalidToken', quizId2);
    const finalTrash = requestAdminQuizViewTrashV2(token1);
    expect(initialTrash).toStrictEqual(finalTrash);
    expect(finalTrash.status).toBe(OK);
  });

  // Test for checking the trash after deleting all quizzes from users.
  test('7. success: Check trash after deleting all quizzes from user', () => {
    requestAdminQuizRemoveV2(token1, quizId1);
    requestAdminQuizRemoveV2(token1, quizId2);
    requestAdminQuizRemoveV2(token2, quizId3);
    const trashResponse1 = requestAdminQuizViewTrashV2(token1);
    expect(trashResponse1.object).toStrictEqual({
      quizzes: [
        { quizId: quizId1, name: 'JakeQuiz1' },
        { quizId: quizId2, name: 'JakeQuiz2' },
      ]
    });
    expect(trashResponse1.status).toBe(OK);

    const trashResponse2 = requestAdminQuizViewTrashV2(token2);
    expect(trashResponse2.object).toStrictEqual({
      quizzes: [
        { quizId: quizId3, name: 'JohnQuiz' },
      ]
    });
    expect(trashResponse2.status).toBe(OK);
  });
});

/// ///////////////////////////////////////////////////////////////////////////////////////
/// //////////////////////////////ADMIN QUIZ VIEW TRASH V2/////////////////////////////////
/// ///////////////////////////////////////////////////////////////////////////////////////

// adminQuizTrash endpoint tests
describe('adminQuizTrash endpoint tests', () => {
  let token1: string;
  let quizId1: number;
  let token2: string;

  beforeEach(() => {
    requestClear();
    token1 = requestAdminAuthRegister('validemail@gmail.com', '123abc!@#', 'Jake', 'Renzella').object.token;
    quizId1 = requestAdminQuizCreateV2(token1, 'Jake', "I'm pretty handsome").object.quizId;
    token2 = requestAdminAuthRegister('validemail2@gmail.com', '456def!@#', 'John', 'Doe').object.token;

    requestAdminQuizRemoveV2(token1, quizId1);
  });

  // Test for successfully viewing quizzes in the trash for the logged-in user.
  test('1. success: View quizzes in trash for the logged-in user', () => {
    const response = requestAdminQuizViewTrashV2(token1);
    expect(response.object).toStrictEqual({
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
    const response = requestAdminQuizViewTrashV2(token2);
    expect(response.object).toStrictEqual({
      quizzes: []
    });
    expect(response.status).toBe(OK);
  });

  // Test for having multiple quizzes in the trash for a user.
  test('3. success: Multiple quizzes in trash for a user', () => {
    // Move another quiz of Jake to the trash
    requestAdminQuizRemoveV2(token1, requestAdminQuizCreateV2(token1, 'Another Jake Quiz', 'Another description').object.quizId);

    const response = requestAdminQuizViewTrashV2(token1);
    expect(response.object.quizzes).toHaveLength(2);
    expect(response.status).toBe(OK);
  });

  // Test for ensuring that quizzes in the trash remain untouched when new quizzes are added.
  test('4. success: Quizzes in trash remain untouched when new quizzes are added', () => {
    requestAdminQuizCreateV2(token1, 'New Quiz', 'Fresh description');

    const response = requestAdminQuizViewTrashV2(token1);
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
    quizId1 = requestAdminQuizCreateV2(token1, 'Jake', "I'm pretty handsome").object.quizId;
    requestAdminQuizRemoveV2(token1, quizId1);
  });

  // Test case for when the token is empty
  test('1. error: Token is empty', () => {
    const response = requestAdminQuizViewTrashV2('');
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toBe(UNAUTHORIZED);
  });

  // Test case for when the token is invalid
  test('2. error: Token is invalid', () => {
    const response = requestAdminQuizViewTrashV2('userToken');
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
    // Clear the request
    requestClear();

    // Register an admin and a user, then create and remove quizzes to place them in the trash
    adminToken = requestAdminAuthRegister('adminemail@gmail.com', '123abc!@#', 'Admin', 'AdminLastName').object.token;
    userToken = requestAdminAuthRegister('useremail@gmail.com', '456def!@#', 'John', 'Doe').object.token;

    // Create and remove an admin's quiz to place it in the trash
    quizId1 = requestAdminQuizCreateV2(adminToken, 'Admin', "Admin's Quiz").object.quizId;
    requestAdminQuizRemoveV2(adminToken, quizId1);

    // Create and remove a user's quiz to place it in the trash
    quizId2 = requestAdminQuizCreateV2(userToken, 'John', "John's Quiz").object.quizId;
    requestAdminQuizRemoveV2(userToken, quizId2);
  });

  // Test case for when an admin can view trashed quizzes
  test('1. Admin can view trashed quizzes', () => {
    const response = requestAdminQuizViewTrashV2(adminToken);
    const expectedQuizzes = [
      {
        name: 'Admin',
        quizId: quizId1
      }
    ];
    expect(response.object.quizzes).toStrictEqual(expect.arrayContaining(expectedQuizzes));
    expect(response.status).toBe(OK);
  });

  // Test case for when a user can view their own trashed quizzes
  test('2. User can view their own trashed quizzes', () => {
    const response = requestAdminQuizViewTrashV2(userToken);
    const expectedQuizzes = [
      {
        name: 'John',
        quizId: quizId2
      }
    ];
    expect(response.object.quizzes).toStrictEqual(expect.arrayContaining(expectedQuizzes));
    expect(response.status).toBe(OK);
  });

  // Test case for when an admin cannot view trashed quizzes of other users
  test('3. Admin cannot view trashed quizzes of other users', () => {
    const response = requestAdminQuizViewTrashV2(adminToken);
    const unexpectedQuizzes = [
      {
        quizId: quizId2,
        name: "John's Quiz"
      }
    ];
    expect(response.object.quizzes).not.toStrictEqual(expect.arrayContaining(unexpectedQuizzes));
    expect(response.status).toBe(OK);
  });

  // Test case for viewing the trash after removing and restoring a quiz
  test('view after remove and restore', () => {
    requestAdminQuizRemoveRestoreV2(adminToken, quizId1);
    const response = requestAdminQuizViewTrashV2(adminToken);
    expect(response.object).toStrictEqual({ quizzes: [] });
    expect(response.status).toStrictEqual(OK);
  });
});

/// ///////////////////////////////////////////////////////////////////////////////////////
/// //////////////////////////////ADMIN QUIZ TRASH EMPTY V2////////////////////////////////
/// ///////////////////////////////////////////////////////////////////////////////////////

describe('adminTrashEmpty error check', () => {
  let token1: string;
  let quizId1: number;
  let quizId2: number;

  beforeEach(() => {
    requestClear();
    token1 = requestAdminAuthRegister('validemail1@gmail.com', '123abc!@#', 'Alice', 'Brown').object.token;
    quizId1 = requestAdminQuizCreateV2(token1, 'Quiz1', 'First quiz').object.quizId;
    quizId2 = requestAdminQuizCreateV2(token1, 'Quiz2', 'Second quiz').object.quizId;
    requestAdminQuizRemoveV2(token1, quizId1);
    requestAdminQuizRemoveV2(token1, quizId2);
  });

  test('1.error: Token is empty', () => {
    const response = requestAdminTrashEmptyV2('', [quizId1, quizId2]);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(UNAUTHORIZED);
  });

  test('2.error: Token is invalid', () => {
    const response = requestAdminTrashEmptyV2('invalid', [quizId1, quizId2]);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(UNAUTHORIZED);
  });

  test('3. Invalid Token with special characters', () => {
    const response = requestAdminTrashEmptyV2('invalid$token#special', [quizId1, quizId2]);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toBe(UNAUTHORIZED);
  });

  test('4. Valid token but no quizIds provided', () => {
    const response = requestAdminTrashEmptyV2(token1, []);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toBe(FORBIDDEN);
  });

  test('5. Valid token but all quizIds are invalid', () => {
    const response = requestAdminTrashEmptyV2(token1, [quizId1 + 100, quizId2 + 100]);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toBe(FORBIDDEN);
  });

  test('6. Valid token but some quizIds are invalid', () => {
    const response = requestAdminTrashEmptyV2(token1, [quizId1, quizId2 + 100]);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toBe(FORBIDDEN);
  });

  test('7. Valid token and quizIds but one of the quizzes is not owned by the user', () => {
    const token2 = requestAdminAuthRegister('validemail2@gmail.com', '123abc!@#', 'Bob', 'Smith').object.token;
    const quizId3 = requestAdminQuizCreateV2(token2, 'Quiz3', 'Third quiz').object.quizId;
    requestAdminQuizRemoveV2(token2, quizId3);

    const response = requestAdminTrashEmptyV2(token1, [quizId1, quizId3]);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toBe(FORBIDDEN);
  });

  test('8. Valid parameters but all quizzes already permanently deleted', () => {
    requestAdminTrashEmptyV2(token1, [quizId1, quizId2]); // Permanently delete both quizzes
    const response = requestAdminTrashEmptyV2(token1, [quizId1, quizId2]); // Try to delete them again
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toBe(FORBIDDEN);
  });

  test('9. Valid parameters however quizId is not currently in trash', () => {
    const activeQuiz = requestAdminQuizCreateV2(token1, 'quiz', 'good quiz').object.quizId;

    const response = requestAdminTrashEmptyV2(token1, [quizId1, activeQuiz]);
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
    quizId1 = requestAdminQuizCreateV2(token1, 'Quiz1', 'First quiz').object.quizId;
    quizId2 = requestAdminQuizCreateV2(token1, 'Quiz2', 'Second quiz').object.quizId;
    quizId3 = requestAdminQuizCreateV2(token1, 'Quiz3', 'Third quiz').object.quizId;

    requestAdminQuizRemoveV2(token1, quizId1);
    requestAdminQuizRemoveV2(token1, quizId2);
    requestAdminQuizRemoveV2(token1, quizId3);
  });

  test('1. Valid parameters with a single quiz in trash', () => {
    const response = requestAdminTrashEmptyV2(token1, [quizId1]);
    expect(response.object).toEqual({});
    expect(response.status).toBe(OK);
  });

  test('2. Valid parameters with multiple quizzes in trash', () => {
    const response = requestAdminTrashEmptyV2(token1, [quizId1, quizId2, quizId3]);
    expect(response.object).toEqual({});
    expect(response.status).toBe(OK);
  });

  test('3. Valid parameters, delete quizzes one by one', () => {
    let response = requestAdminTrashEmptyV2(token1, [quizId1]);
    expect(response.object).toEqual({});
    expect(response.status).toBe(OK);

    response = requestAdminTrashEmptyV2(token1, [quizId2]);
    expect(response.object).toEqual({});
    expect(response.status).toBe(OK);

    response = requestAdminTrashEmptyV2(token1, [quizId3]);
    expect(response.object).toEqual({});
    expect(response.status).toBe(OK);
  });

  test('4. Valid parameters, delete a quiz and then attempt to delete it again with another quiz', () => {
    let response = requestAdminTrashEmptyV2(token1, [quizId1]);
    expect(response.object).toEqual({});
    expect(response.status).toBe(OK);

    response = requestAdminTrashEmptyV2(token1, [quizId1, quizId2]);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toBe(FORBIDDEN); // The first quiz is already deleted, so it's an invalid ID now.
  });
});

describe('use adminQuizViewTrash to test', () => {
  let token1: string;
  let quizId1: number;
  let quizId2: number;

  beforeEach(() => {
    requestClear();
    token1 = requestAdminAuthRegister('validemail1@gmail.com', '123abc!@#', 'Alice', 'Brown').object.token;
    quizId1 = requestAdminQuizCreateV2(token1, 'Quiz1', 'First quiz').object.quizId;
    quizId2 = requestAdminQuizCreateV2(token1, 'Quiz2', 'Second quiz').object.quizId;

    requestAdminQuizRemoveV2(token1, quizId1);
    requestAdminQuizRemoveV2(token1, quizId2);
  });

  test('1. Valid Token with quizzes in trash', () => {
    const response = requestAdminQuizViewTrashV2(token1);
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
    requestAdminTrashEmptyV2(token1, [quizId1, quizId2]);

    const response = requestAdminQuizViewTrashV2(token1);
    expect(response).toEqual({
      object: {
        quizzes: []
      },
      status: 200
    });
  });
});

/// ///////////////////////////////////////////////////////////////////////////////////////
/// ////////////////////////////// ADMIN QUIZ LIST V2 /////////////////////////////////////
/// ///////////////////////////////////////////////////////////////////////////////////////

describe('adminQuizList error check', () => {
  let validToken: string;

  beforeEach(() => {
    requestClear();
    validToken = requestAdminAuthRegister('validemail@gmail.com', '123abc!@#', 'Jake', 'Renzella').object.token;
  });

  // Test case for an invalid token greater than registered one
  test('error: Token is not registered', () => {
    const response = requestAdminQuizListV2(validToken + 100);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(UNAUTHORIZED);
  });

  // Test case for an invalid token less than registered one
  test('error: Token is not registered', () => {
    const response = requestAdminQuizListV2(validToken + (-100));
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(UNAUTHORIZED);
  });

  // Test case for an invalid token that is non-integer
  test('error: Token is a non-integer', () => {
    const response = requestAdminQuizListV2('abcd123');
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(UNAUTHORIZED);
  });

  // Test case for an empty authUserId
  test('error: Token is empty', () => {
    const response = requestAdminQuizListV2('');
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
    const response = requestAdminQuizListV2(validToken);
    const quizzes = response.object.quizzes;
    expect(quizzes).toHaveLength(0);
    expect(response.status).toStrictEqual(OK);
  });

  beforeEach(() => {
    validToken = requestAdminAuthRegister('validemail@gmail.com', '123abcdefg', 'Jake', 'Renzella').object.token;
  });

  // Test case for when user has one quiz
  test('user has one quiz', () => {
    const createResponse = requestAdminQuizCreateV2(validToken, 'My Quiz', 'Quiz Description');
    const quizId = createResponse.object.quizId;
    const listResponse = requestAdminQuizListV2(validToken);
    const quizzes = listResponse.object.quizzes;
    expect(quizzes).toHaveLength(1);
    expect(quizzes[0].name).toBe('My Quiz');
    expect(quizzes[0].quizId).toBe(quizId);
    expect(listResponse.status).toStrictEqual(OK);
  });

  // Test case for when user has multiple quizzes
  test('user has multiple quizzes', () => {
    const quiz1CreateResponse = requestAdminQuizCreateV2(validToken, 'Quiz 1', 'Description 1');
    const quiz1Id = quiz1CreateResponse.object.quizId;
    const quiz2CreateResponse = requestAdminQuizCreateV2(validToken, 'Quiz 2', 'Description 2');
    const quiz2Id = quiz2CreateResponse.object.quizId;
    const listResponse = requestAdminQuizListV2(validToken);
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
    const quizId: number = requestAdminQuizCreateV2(validToken, 'good quiz', 'free me').object.quizId;
    const listResponse = requestAdminQuizListV2(validToken);
    const quizzes = listResponse.object.quizzes;
    expect(quizzes).toHaveLength(1);
    expect(quizzes[0].name).toBe('good quiz');
    expect(quizzes[0].quizId).toBe(quizId);
    expect(listResponse.status).toStrictEqual(OK);
    requestAdminQuizRemoveV2(validToken, quizId);

    const listResponse2 = requestAdminQuizListV2(validToken);
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
    quizId = requestAdminQuizCreateV2(validToken, 'Quiz 1', 'Quiz Description').object.quizId;
  });

  // Test case for when token is empty
  test('error: Token is empty', () => {
    const response = requestAdminQuizNameUpdateV2('', quizId, 'New Quiz Name');
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(UNAUTHORIZED);
  });

  // Test case for when AuthUserId is not a valid user
  test('error: Token is not associated with a valid user', () => {
    const response = requestAdminQuizNameUpdateV2((validToken + 100), quizId, 'New Quiz Name');
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(UNAUTHORIZED);
  });

  // Test case for when QuizId is not a valid user
  test('error: Quiz ID does not refer to a valid quiz', () => {
    const response = requestAdminQuizNameUpdateV2(validToken, (quizId + 100), 'New Quiz Name');
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(FORBIDDEN);
  });

  // Test case for when Quiz ID does not refer to a quiz that this user owns
  test('error: Quiz ID does not refer to a quiz that this user owns', () => {
    const otherValidToken = requestAdminAuthRegister('anotheremail@gmail.com', '123bcd!@#', 'John', 'Doe').object.token;
    const otherQuizId = requestAdminQuizCreateV2(otherValidToken, 'Other Quiz', 'Other Description').object.quizId;
    const response = requestAdminQuizNameUpdateV2(validToken, otherQuizId, 'New Quiz Name');
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(FORBIDDEN);
  });

  // Test case for when Name contains invalid characters
  test('error: Name contains invalid characters', () => {
    const INVALID_NAME = 'Invalid Name @#$';
    const response = requestAdminQuizNameUpdateV2(validToken, quizId, INVALID_NAME);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(BAD_REQUEST);
  });

  // Test case for when Name is too short
  test('error: Name is too short', () => {
    const SHORT_NAME = 'B';
    const response = requestAdminQuizNameUpdateV2(validToken, quizId, SHORT_NAME);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(BAD_REQUEST);
  });

  // Test case for when Name is too long
  test('error: Name is too long', () => {
    const LONG_NAME = 'B'.repeat(31);
    const response = requestAdminQuizNameUpdateV2(validToken, quizId, LONG_NAME);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(BAD_REQUEST);
  });

  // Test case for when Name is already used by the user for another quiz
  test('error: Name is already used by the user for another quiz', () => {
    requestAdminQuizCreateV2(validToken, 'Duplicate Name', 'Duplicate Description');
    const response = requestAdminQuizNameUpdateV2(validToken, quizId, 'Duplicate Name');
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
    quizId = requestAdminQuizCreateV2(validToken, 'Quiz 1', 'Quiz Description').object.quizId;
  });

  // Test case for a successful name update
  test('successful name update', () => {
    const newName = 'New Quiz Name';
    const result = requestAdminQuizNameUpdateV2(validToken, quizId, newName);
    expect(result.object).toStrictEqual({});
    expect(result.status).toStrictEqual(OK);
    const updatedQuizDetails = requestAdminQuizInfo(validToken, quizId);
    expect(updatedQuizDetails.object.name).toBe(newName);
  });

  // Test case for a successful name update with a different valid name
  test('successful name update with a different valid name', () => {
    const newName = 'Updated Quiz Name';
    const result = requestAdminQuizNameUpdateV2(validToken, quizId, newName);
    expect(result.object).toStrictEqual({});
    expect(result.status).toStrictEqual(OK);
    const updatedQuizDetails = requestAdminQuizInfo(validToken, quizId);
    expect(updatedQuizDetails.object.name).toBe(newName);
  });

  // Test case for a successful name update to the minimum allowed length
  test('successful name update to minimum allowed length', () => {
    const newName = 'ABC'; // Minimum length is 3
    const result = requestAdminQuizNameUpdateV2(validToken, quizId, newName);
    expect(result.object).toStrictEqual({});
    expect(result.status).toStrictEqual(OK);
    const updatedQuizDetails = requestAdminQuizInfo(validToken, quizId);
    expect(updatedQuizDetails.object.name).toBe(newName);
  });

  // Test case for a successful name update to the maximum allowed length
  test('successful name update to maximum allowed length', () => {
    const newName = 'A'.repeat(30);
    const result = requestAdminQuizNameUpdateV2(validToken, quizId, newName);
    expect(result.object).toStrictEqual({});
    expect(result.status).toStrictEqual(OK);
    const updatedQuizDetails = requestAdminQuizInfo(validToken, quizId);
    expect(updatedQuizDetails.object.name).toBe(newName);
  });
});

/// ///////////////////////////////////////////////////////////////////////////////////////
/// /////////////////////////////////ADMIN QUIZ INFO V2////////////////////////////////////
/// ///////////////////////////////////////////////////////////////////////////////////////

// ADMINQUIZINFOV2 FUNCTION TESTING
// relies on adminAuthRegister and adminQuizCreate
describe('adminQuizInfoV2 - function testing', () => {
  beforeEach(() => {
    requestClear();
  });

  // TESTS ERROR OUTPUT
  // 1  -   no users and no quizzes
  test('invalid TOKEN, invalid QUIZID: no users or quizzes', () => {
    const response = requestAdminQuizInfoV2('123', 123);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(UNAUTHORIZED);
  });

  // 2 -  existence of one user but invalid quiz id
  // valid user and quiz but incorrect quiz input
  test('valid TOKEN, invalid QUIZID input', () => {
    const token: string = requestAdminAuthRegister('emma@yahoo.com', 'emmalisa123', 'emma', 'lisa').object.token;
    const quizId: number = requestAdminQuizCreateV2(token, 'tahook123', 'painful group assignment').object.quizId;

    const response = requestAdminQuizInfoV2(token, quizId + 100);

    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(FORBIDDEN);
  });

  // 3 -  existence of multiple valid users but invalid quiz id
  // valid users and quiz but incorrect quiz input
  test('multiple valid TOKENS, invalid QUIZID input', () => {
    const token1: string = requestAdminAuthRegister('emma23@yahoo.com', 'emmalisa123', 'emma', 'lisa').object.token;
    requestAdminAuthRegister('abcd1@yahoo.com', 'abcddcba123', 'fnfnfnfnfn', 'lnlnlnlnln');
    const quizId: number = requestAdminQuizCreateV2(token1, 'tahook123', 'painful group assignment').object.quizId;

    const response = requestAdminQuizInfoV2(token1, quizId + 100);

    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(FORBIDDEN);
  });

  // 4 -  existence of one user and valid quiz id, but invalid user ID and quiz ID inputted
  // valid user and quiz but incorrect inputs for both
  test('invalid TOKEN, invalid QUIZID input', () => {
    const token: string = requestAdminAuthRegister('emma2@yahoo.com', 'emmalisa123', 'emma', 'lisa').object.token;
    const quizId: number = requestAdminQuizCreateV2(token, 'tahook123', 'painful group assignment').object.quizId;

    const response = requestAdminQuizInfoV2(token + '100', quizId + 100);

    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(UNAUTHORIZED);
  });

  // 5 -  existence of one user and valid quiz id, but invalid user ID inputted
  // valid user and quiz but incorrect user input
  test('invalid TOKEN, valid QUIZID input', () => {
    const token: string = requestAdminAuthRegister('emma@yahoo.com', 'emmalisa123', 'emma', 'lisa').object.token;
    const quizId: number = requestAdminQuizCreateV2(token, 'tahook123', 'painful group assignment').object.quizId;

    const response = requestAdminQuizInfoV2(token + '100', quizId);

    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(UNAUTHORIZED);
  });

  // 6 -  existence of multiple valid users but invalid quiz id
  // valid users and quizzes but inputted someone else's quiz
  test('multiple valid TOKENS, invalid QUIZID input - not owned', () => {
    const token1: string = requestAdminAuthRegister('emma@yahoo.com', 'emmalisa123', 'emma', 'lisa').object.token;
    const token2: string = requestAdminAuthRegister('abcd@yahoo.com', 'abcddcba321', 'fnfnfnfnfn', 'lnlnlnln').object.token;
    requestAdminQuizCreateV2(token1, 'tahook123', 'painful group assignment');
    const quizId: number = requestAdminQuizCreateV2(token2, 'tahook321', 'collusion haha').object.quizId;

    const response = requestAdminQuizInfoV2(token1, quizId);

    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(FORBIDDEN);
  });

  // TESTING CORRECT OUTPUT
  // 7 -  existence of one user and valid quiz id
  test('valid TOKEN, valid QUIZID input: one user', () => {
    const token: string = requestAdminAuthRegister('emma@yahoo.com', 'emmalisa123', 'emma', 'lisa').object.token;
    const quizId: number = requestAdminQuizCreateV2(token, 'tahook123', 'painful group assignment').object.quizId;

    const response = requestAdminQuizInfoV2(token, quizId);

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
        thumbnailUrl: expect.any(String),
      }
    );
    expect(response.status).toStrictEqual(OK);
  });

  // 8 -  existence of multiple users  and valid quiz id
  test('valid TOKEN, valid QUIZID input: multiple users', () => {
    const token1: string = requestAdminAuthRegister('emma@yahoo.com', 'emmalisa123', 'emma', 'lisa').object.token;
    const quizId: number = requestAdminQuizCreateV2(token1, 'tahook123', 'painful group assignment').object.quizId;

    const token2: string = requestAdminAuthRegister('abcd@yahoo.com', 'abcddcba321', 'fnfnfnfnfn', 'lnlnlnlnln').object.token;
    requestAdminQuizCreateV2(token2, 'tahook321', 'collusion haha');

    const response = requestAdminQuizInfoV2(token1, quizId);

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
        thumbnailUrl: expect.any(String),
      }
    );
    expect(response.status).toStrictEqual(OK);
  });
});

describe('further complex tests with adminQuizInfo', () => {
  let token: string;
  let quizId: number;
  let quizObject: AdminQuizInfoReturnV2;

  beforeEach(() => {
    requestClear();
    token = requestAdminAuthRegister('panicking@gmail.com', 'ihatePanik2', 'name', 'last').object.token;
    quizId = requestAdminQuizCreateV2(token, 'help me', 'i cant help').object.quizId;
    quizObject = {
      quizId,
      name: 'help me',
      timeCreated: expect.any(Number),
      timeLastEdited: expect.any(Number),
      description: 'i cant help',
      numQuestions: 0,
      questions: [],
      duration: expect.any(Number),
      thumbnailUrl: expect.any(String),
    };
    const response = requestAdminQuizInfoV2(token, quizId);
    expect(response.object).toStrictEqual(quizObject);
    expect(response.status).toStrictEqual(OK);
  });

  test('quiz description updated', () => {
    requestAdminQuizDescriptionUpdateV2(quizId, token, 'new descriptioj');
    quizObject.description = 'new descriptioj';

    const response2 = requestAdminQuizInfoV2(token, quizId);
    expect(response2.object).toStrictEqual(quizObject);
    expect(response2.status).toStrictEqual(OK);
  });

  test('quiz transferred to another user', () => {
    const token2 = requestAdminAuthRegister('goodemail@gmail.com', 'PasshhjW132', 'name', 'bad').object.token;
    requestAdminQuizTransferV2(token, quizId, 'goodemail@gmail.com');

    const response2 = requestAdminQuizInfoV2(token, quizId);
    expect(response2.object).toStrictEqual(ERROR);
    expect(response2.status).toStrictEqual(FORBIDDEN);

    const response3 = requestAdminQuizInfoV2(token2, quizId);
    expect(response3.object).toStrictEqual(quizObject);
    expect(response3.status).toStrictEqual(OK);
  });
});

/// ///////////////////////////////////////////////////////////////////////////////////////
/// ////////////////////////////////ADMIN QUIZ TRANSFER V2/////////////////////////////////
/// ///////////////////////////////////////////////////////////////////////////////////////

// ADMINQUIZTRANSFERV2 TEST SUITE
describe('adminQuizTransferV2 testing', () => {
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

    quizId1 = requestAdminQuizCreateV2(token1, 'more quizzes', 'a good description').object.quizId;
  });

  // ===================================== UNAUTHORIZED = 401 ERROR =====================================
  test('empty token and empty/invalid email', () => {
    const response1 = requestAdminQuizTransferV2(' ', quizId1, ' ');
    expect(response1.object).toStrictEqual(ERROR);
    expect(response1.status).toStrictEqual(UNAUTHORIZED);

    const response2 = requestAdminQuizTransferV2(' ', quizId1, invalidEmail);
    expect(response2.object).toStrictEqual(ERROR);
    expect(response2.status).toStrictEqual(UNAUTHORIZED);
  });

  test('invalid token and empty/invalid email', () => {
    const response1 = requestAdminQuizTransferV2(invalidToken, quizId1, ' ');
    expect(response1.object).toStrictEqual(ERROR);
    expect(response1.status).toStrictEqual(UNAUTHORIZED);

    const response2 = requestAdminQuizTransferV2(invalidToken, quizId1, invalidEmail);
    expect(response2.object).toStrictEqual(ERROR);
    expect(response2.status).toStrictEqual(UNAUTHORIZED);
  });

  test('empty/invalid token and invalid quizId', () => {
    const response1 = requestAdminQuizTransferV2(' ', (quizId1 + 100), email1);
    expect(response1.object).toStrictEqual(ERROR);
    expect(response1.status).toStrictEqual(UNAUTHORIZED);

    const response2 = requestAdminQuizTransferV2(invalidToken, (quizId1 + 100), email2);
    expect(response2.object).toStrictEqual(ERROR);
    expect(response2.status).toStrictEqual(UNAUTHORIZED);
  });

  // ======================================= FORBIDDEN = 403 ERROR =======================================
  test('valid token but user specified by token not an owner of quizId', () => {
    // another user's email
    const response1 = requestAdminQuizTransferV2(token2, quizId1, email1);
    expect(response1.object).toStrictEqual(ERROR);
    expect(response1.status).toStrictEqual(FORBIDDEN);

    // their own email
    const response2 = requestAdminQuizTransferV2(token2, quizId1, email2);
    expect(response2.object).toStrictEqual(ERROR);
    expect(response2.status).toStrictEqual(FORBIDDEN);
    // empty email
    const response3 = requestAdminQuizTransferV2(token2, quizId1, ' ');
    expect(response3.object).toStrictEqual(ERROR);
    expect(response3.status).toStrictEqual(FORBIDDEN);
  });

  // ====================================== BAD_REQUEST = 400 ERROR ======================================
  test('token valid but invalid quizId', () => {
    // another user's email
    const response1 = requestAdminQuizTransferV2(token2, (quizId1 + 100), email1);
    expect(response1.object).toStrictEqual(ERROR);
    expect(response1.status).toStrictEqual(FORBIDDEN);

    // their own email
    const response2 = requestAdminQuizTransferV2(token2, (quizId1 + 100), email2);
    expect(response2.object).toStrictEqual(ERROR);
    expect(response2.status).toStrictEqual(FORBIDDEN);
    // empty email
    const response3 = requestAdminQuizTransferV2(token2, (quizId1 + 100), ' ');
    expect(response3.object).toStrictEqual(ERROR);
    expect(response3.status).toStrictEqual(FORBIDDEN);
  });

  test('provided email does not correspond to a registered user', () => {
    const response = requestAdminQuizTransferV2(token1, quizId1, invalidEmail);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(BAD_REQUEST);
  });

  test('email provided is email of the token user (transferring to themselves)', () => {
    const response = requestAdminQuizTransferV2(token1, quizId1, email1);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(BAD_REQUEST);
  });

  test('target user already has quiz with that name', () => {
    // create quiz with same name for second user
    const quizId2: number = requestAdminQuizCreateV2(token2, 'more quizzes', 'a good description').object.quizId;
    const response1 = requestAdminQuizTransferV2(token1, quizId1, email2);
    expect(response1.object).toStrictEqual(ERROR);
    expect(response1.status).toStrictEqual(BAD_REQUEST);

    const response2 = requestAdminQuizTransferV2(token2, quizId2, email1);
    expect(response2.object).toStrictEqual(ERROR);
    expect(response2.status).toStrictEqual(BAD_REQUEST);
  });

  test('session not at end', () => {
    const questionInput = {
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
      ],
      thumbnailUrl: 'https://www.doglogic.com.au/dawgs/wp-content/uploads/2015/11/puppy-training-school-sydney.jpg'
    };
    requestAdminQuizCreateQuestionV2(quizId1, token1, questionInput);
    requestAdminQuizCreateSession(quizId1, 2, token1);
    const response1 = requestAdminQuizTransferV2(token1, quizId1, email2);
    expect(response1.object).toStrictEqual(ERROR);
    expect(response1.status).toStrictEqual(BAD_REQUEST);
  });

  // ============================================= SUCCESS =============================================
  test('successfully transferred quiz: check return', () => {
    // transfer quizId1 from token1 to token2
    const response1 = requestAdminQuizTransferV2(token1, quizId1, email2);
    expect(response1.object).toStrictEqual({});
    expect(response1.status).toStrictEqual(OK);

    // transfer quizId1 back from token2 to token1
    requestAdminQuizCreateV2(token1, 'another name', 'a better description');
    const response2 = requestAdminQuizTransferV2(token2, quizId1, email1);
    expect(response2.object).toStrictEqual({});
    expect(response2.status).toStrictEqual(OK);
  });
});

/// ///////////////////////////////////////////////////////////////////////////////////////
/// ////////////////////////////ADMIN QUIZ REMOVE RESTORE V2///////////////////////////////
/// ///////////////////////////////////////////////////////////////////////////////////////
// ADMINQUIZREMOVERESTORE TEST WRAPPER

describe('function testing: adminQuizRemoveRestoreV2', () => {
  let token1: string;
  let token2: string;
  let quizId1: number;

  // ===================================== UNAUTHORIZED = 401 ERROR =====================================
  test('quiz id and token both invalid: no users + no quizzes', () => {
    const response = requestAdminQuizRemoveRestoreV2('randomtoken', 12345);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(UNAUTHORIZED);
  });

  beforeEach(() => {
    requestClear();
    token1 = requestAdminAuthRegister('emma.lisa@gmail.com', 'verysafe123', 'Jason', 'Yuval').object.token;
    token2 = requestAdminAuthRegister('jaja.yuyu@yahoo.com', 'comp1531suckshaha', 'Vally', 'Sonny').object.token;
    quizId1 = requestAdminQuizCreateV2(token1, 'more quizzes', 'a good description').object.quizId;
  });

  test('token is empty, quizId valid', () => {
    const response = requestAdminQuizRemoveRestoreV2('', quizId1);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(UNAUTHORIZED);
  });

  test('token is invalid, quizId valid', () => {
    const invalidToken: string = token1 + token2;

    const response = requestAdminQuizRemoveRestoreV2(invalidToken, quizId1);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(UNAUTHORIZED);
  });

  // ======================================= FORBIDDEN = 403 ERROR =======================================
  test('valid token but user is not an owner of this quiz', () => {
    const quizId2: number = requestAdminQuizCreateV2(token2, 'different name', 'another good description').object.quizId;
    requestAdminQuizRemoveV2(token1, quizId1);

    const response1 = requestAdminQuizRemoveRestoreV2(token2, quizId1);
    expect(response1.object).toStrictEqual(ERROR);
    expect(response1.status).toStrictEqual(FORBIDDEN);

    requestAdminQuizRemoveV2(token2, quizId2);
    const response2 = requestAdminQuizRemoveRestoreV2(token1, quizId2);
    expect(response2.object).toStrictEqual(ERROR);
    expect(response2.status).toStrictEqual(FORBIDDEN);
  });

  // ====================================== BAD_REQUEST = 400 ERROR ======================================
  test('quiz id does not refer to a valid / existing quiz', () => {
    const quizId2: number = requestAdminQuizCreateV2(token2, 'different name', 'another good description').object.quizId;

    const invalidQuizId: number = quizId1 + quizId2;
    const response = requestAdminQuizRemoveRestoreV2(token1, invalidQuizId);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(FORBIDDEN);
  });

  test('quiz name of the restored quiz is already used by another active quiz owned by the user', () => {
    requestAdminQuizRemoveV2(token1, quizId1);
    // create a quiz with same name as quizId1
    requestAdminQuizCreateV2(token1, 'more quizzes', 'a good description');
    const response = requestAdminQuizRemoveRestoreV2(token1, quizId1);

    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(BAD_REQUEST);
  });

  test('quiz id refers to a quiz that is not currently in the trash', () => {
    requestAdminQuizRemoveRestoreV2(token1, quizId1);
    const response = requestAdminQuizRemoveRestoreV2(token1, quizId1);
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(BAD_REQUEST);
  });

  // ============================================= SUCCESS =============================================
  test('check function return type for success', () => {
    requestAdminQuizRemoveV2(token1, quizId1);

    const response1 = requestAdminQuizRemoveRestoreV2(token1, quizId1);
    expect(response1.object).toStrictEqual({});
    expect(response1.status).toStrictEqual(OK);

    const quizId2: number = requestAdminQuizCreateV2(token2, 'different name', 'another good description').object.quizId;
    requestAdminQuizRemoveV2(token2, quizId2);

    const response2 = requestAdminQuizRemoveRestoreV2(token2, quizId2);
    expect(response2.object).toStrictEqual({});
    expect(response2.status).toStrictEqual(OK);
  });
});

/// ///////////////////////////////////////////////////////////////////////////////////////
/// //////////////////////////// ADMIN QUIZ THUMBNAIL UPDATE //////////////////////////////
/// ///////////////////////////////////////////////////////////////////////////////////////

describe('adminQuizThumbnailUpdate error check', () => {
  let validToken: string;
  let quizId: number;

  beforeEach(() => {
    requestClear();
    validToken = requestAdminAuthRegister('validemail@gmail.com', '123abc!@#', 'Jake', 'Renzella').object.token;
    quizId = requestAdminQuizCreateV2(validToken, 'Quiz 1', 'Quiz Description').object.quizId;
  });

  // Test case for when token is empty
  test('error: Token is empty', () => {
    const response = requestAdminQuizThumbnailUpdate('', quizId, 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bc/Juvenile_Ragdoll.jpg/220px-Juvenile_Ragdoll.jpg');
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(UNAUTHORIZED);
  });

  // Test case for when token is not associated with a valid user
  test('error: Token is not associated with a valid user', () => {
    const response = requestAdminQuizThumbnailUpdate((validToken + 100), quizId, 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bc/Juvenile_Ragdoll.jpg/220px-Juvenile_Ragdoll.jpg');
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(UNAUTHORIZED);
  });

  // Test case for when quiz ID does not refer to a valid quiz
  test('error: Quiz ID does not refer to a valid quiz', () => {
    const response = requestAdminQuizThumbnailUpdate(validToken, (quizId + 100), 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bc/Juvenile_Ragdoll.jpg/220px-Juvenile_Ragdoll.jpg');
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(FORBIDDEN);
  });

  // Test case for when quiz ID does not refer to a quiz that this user owns
  test('error: Quiz ID does not refer to a quiz that this user owns', () => {
    const otherValidToken = requestAdminAuthRegister('anotheremail@gmail.com', '123bcd!@#', 'John', 'Doe').object.token;
    const otherQuizId = requestAdminQuizCreateV2(otherValidToken, 'Other Quiz', 'Other Description').object.quizId;
    const response = requestAdminQuizThumbnailUpdate(validToken, otherQuizId, 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bc/Juvenile_Ragdoll.jpg/220px-Juvenile_Ragdoll.jpg');
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(FORBIDDEN);
  });

  // Test case for when imgUrl is not a JPG or PNG image
  test('error: Invalid imgUrl type', () => {
    const response = requestAdminQuizThumbnailUpdate(validToken, quizId, 'https://www.youtube.com/watch?v=A4P2017v1AI');
    expect(response.object).toStrictEqual(ERROR);
    expect(response.status).toStrictEqual(BAD_REQUEST);
  });
});

describe('adminQuizThumbnailUpdate valid check', () => {
  let validToken: string;
  let quizId: number;

  beforeEach(() => {
    requestClear();
    validToken = requestAdminAuthRegister('validemail@gmail.com', '123abc!@#', 'Jake', 'Renzella').object.token;
    quizId = requestAdminQuizCreateV2(validToken, 'Quiz 1', 'Quiz Description').object.quizId;
  });

  // Test case for a successful thumbnail update
  test('successful thumbnail update', () => {
    const newImgUrl = 'https://www.doglogic.com.au/dawgs/wp-content/uploads/2015/11/puppy-training-school-sydney.jpg';
    const result = requestAdminQuizThumbnailUpdate(validToken, quizId, newImgUrl);
    expect(result.object).toStrictEqual({});
    expect(result.status).toStrictEqual(OK);
    const updatedQuizDetails = requestAdminQuizInfoV2(validToken, quizId);
    expect(updatedQuizDetails.object.thumbnailUrl).toBe(newImgUrl);
  });

  // Test case for a successful thumbnail update with a different valid imgUrl
  test('successful thumbnail update with a different valid imgUrl', () => {
    const newImgUrl = 'http://toohak.fly.dev/images/quiz-1251-question-738_uuid-74b75712-5747-4b7b-bd59-c1213dbf1fdf.jpg';
    const result = requestAdminQuizThumbnailUpdate(validToken, quizId, newImgUrl);
    expect(result.object).toStrictEqual({});
    expect(result.status).toStrictEqual(OK);
    const updatedQuizDetails = requestAdminQuizInfoV2(validToken, quizId);
    expect(updatedQuizDetails.object.thumbnailUrl).toBe(newImgUrl);
  });
});

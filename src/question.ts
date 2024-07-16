// Functions with adminQuizCreateQuestion, adminQuizDeleteQuestion,
// adminQuizQuestionMove, adminQuizQuestionUpdate,
// adminQuizDuplicateQuestion
//
// By group AERO
// From 27/10/23

import { getData, setData } from './dataStore';
import {
  QUESTION_ANSWER_DUPLICATE_ERROR, QUESTION_ANSWER_INVALID,
  QUESTION_ANSWER_LENGTH_ERROR, QUESTION_DURATION_ERROR, QUESTION_LENGTH_ERROR,
  QUESTION_NOT_EXIST_ERROR, QUESTION_NO_CORRECT_ANSWER_ERROR, QUESTION_POINTS_ERROR,
  QUIZ_DURATION_EXCEED_ERROR, SESSION_NOT_END_ERROR, THUMBNAIL_INVALID_ERROR, forbiddenCheck,
  questionAnswersDuplicatesCheck, questionAnswersLengthCheck, questionAnswersValidCheck,
  questionDurationCheck, questionFindCheck, questionLengthCheck, questionPointCheck, questionCorrectAnswerCheck,
  quizFindCheck, quizTotalDurationCheck, randomColour, thumbnailValidCheck, tokenCheck
} from './support';
import {
  CreateQuestionInput, CreateQuestionReturn, EmptyObjectReturn,
  DuplicateQuestionReturn, Question, SingleErrorObject, SessionState
} from './interface';

/** function that creates a question for user under a specified quiz
 *
 * @param {integer} quizId - unqiue identifier for quiz
 * @param {CreateQuestionInput} questionInput - object with details for question creation
 * @returns {SingleErrorObject | CreateQuestionReturn} - returns questionId if success if not returns error
 */
export function adminQuizCreateQuestion(quizId: number, questionInput: CreateQuestionInput): SingleErrorObject | CreateQuestionReturn {
  const data = getData();
  const quiz = quizFindCheck(quizId);

  if (!questionLengthCheck(questionInput.question)) {
    // if question string is not between 5-50 characters
    return QUESTION_LENGTH_ERROR;
  } else if (!questionAnswersLengthCheck(questionInput.answers)) {
    // if number of answers is not between 2-6 answers
    return QUESTION_ANSWER_LENGTH_ERROR;
  } else if (!questionDurationCheck(questionInput.duration)) {
    // question duration is negative
    return QUESTION_DURATION_ERROR;
  } else if (!quizTotalDurationCheck(quiz.duration, questionInput.duration)) {
    // if quiz total duration exceeds three minutes
    return QUIZ_DURATION_EXCEED_ERROR;
  } else if (!questionPointCheck(questionInput.points)) {
    // if points allocated are not between 1-10
    return QUESTION_POINTS_ERROR;
  } else if (!questionAnswersValidCheck(questionInput)) {
    // if answer string is not between 1-30
    return QUESTION_ANSWER_INVALID;
  } else if (!questionAnswersDuplicatesCheck(questionInput)) {
    // if there are duplicate answers within the question
    return QUESTION_ANSWER_DUPLICATE_ERROR;
  } else if (!questionCorrectAnswerCheck(questionInput)) {
    // if there are no correct answers
    return QUESTION_NO_CORRECT_ANSWER_ERROR;
  }

  // increment questionId
  data.recentQuestionId += 1;

  // increment time last edited - unix
  quiz.timeLastEdited = Math.floor(Date.now() / 1000);

  // need to find the index of quiz to find the duration
  const quizIndex = data.quizzes.findIndex((quiz) => quiz.quizId === quizId);

  // increase duration of quiz due to addition of question
  data.quizzes[quizIndex].duration += questionInput.duration;

  // adding more keys to answer array - includes answerId and colour now
  const answers = questionInput.answers.map((answer) => ({ answerId: data.recentAnswerId++, ...answer, colour: randomColour() }));

  // initialise new question as an object
  const newQuestion: Question = {
    quizId,
    questionId: data.recentQuestionId,
    question: questionInput.question,
    duration: questionInput.duration,
    timeCreated: quiz.timeLastEdited,
    timeLastEdited: quiz.timeLastEdited,
    points: questionInput.points,
    answers,
  };

  // pushes on to the end of the appropriate quiz array
  data.quizzes[quizIndex].questions.push(newQuestion);
  data.quizzes[quizIndex].numQuestions++;

  // new data is set
  setData(data);

  return { questionId: newQuestion.questionId };
}

/**
 * Adds a new question to a quiz. Validates question details, including length, answer options,
 * duration, and thumbnail. Updates the quiz's duration and question count, then saves the updated data.
 * Returns the ID of the newly created question or an error object if validation fails.
 *
 * @param {number} quizId - ID of the quiz to which the question is added.
 * @param {CreateQuestionInput} questionInput - Object containing details of the question to be added.
 * @returns {SingleErrorObject | CreateQuestionReturn} - The ID of the new question or an error object.
 */
export function adminQuizCreateQuestionV2(quizId: number, questionInput: CreateQuestionInput): SingleErrorObject | CreateQuestionReturn {
  const data = getData();
  const quiz = quizFindCheck(quizId);

  if (!questionLengthCheck(questionInput.question)) {
    // if question string is not between 5-50 characters
    return QUESTION_LENGTH_ERROR;
  } else if (!questionAnswersLengthCheck(questionInput.answers)) {
    // if number of answers is not between 2-6 answers
    return QUESTION_ANSWER_LENGTH_ERROR;
  } else if (!questionDurationCheck(questionInput.duration)) {
    // question duration is negative
    return QUESTION_DURATION_ERROR;
  } else if (!quizTotalDurationCheck(quiz.duration, questionInput.duration)) {
    // if quiz total duration exceeds three minutes
    return QUIZ_DURATION_EXCEED_ERROR;
  } else if (!questionPointCheck(questionInput.points)) {
    // if points allocated are not between 1-10
    return QUESTION_POINTS_ERROR;
  } else if (!questionAnswersValidCheck(questionInput)) {
    // if answer string is not between 1-30
    return QUESTION_ANSWER_INVALID;
  } else if (!questionAnswersDuplicatesCheck(questionInput)) {
    // if there are duplicate answers within the question
    return QUESTION_ANSWER_DUPLICATE_ERROR;
  } else if (!questionCorrectAnswerCheck(questionInput)) {
    // if there are no correct answers
    return QUESTION_NO_CORRECT_ANSWER_ERROR;
    // if thumbnail not valid
  } else if (!thumbnailValidCheck(questionInput.thumbnailUrl)) {
    return THUMBNAIL_INVALID_ERROR;
  }

  // increment questionId
  data.recentQuestionId += 1;

  // increment time last edited - unix
  quiz.timeLastEdited = Math.floor(Date.now() / 1000);

  // need to find the index of quiz to find the duration
  const quizIndex = data.quizzes.findIndex((quiz) => quiz.quizId === quizId);

  // increase duration of quiz due to addition of question
  data.quizzes[quizIndex].duration += questionInput.duration;

  // adding more keys to answer array - includes answerId and colour now
  const answers = questionInput.answers.map((answer) => ({ answerId: data.recentAnswerId++, ...answer, colour: randomColour() }));

  // initialise new question as an object
  const newQuestion: Question = {
    quizId,
    questionId: data.recentQuestionId,
    question: questionInput.question,
    duration: questionInput.duration,
    timeCreated: quiz.timeLastEdited,
    timeLastEdited: quiz.timeLastEdited,
    points: questionInput.points,
    answers,
    thumbnailUrl: questionInput.thumbnailUrl,
  };

  // pushes on to the end of the appropriate quiz array
  data.quizzes[quizIndex].questions.push(newQuestion);
  data.quizzes[quizIndex].numQuestions++;

  // new data is set
  setData(data);

  return { questionId: newQuestion.questionId };
}

/** function that deletes specified question from a quiz for user
 *
 * @param {integer} quizId - unique identifier for quiz
 * @param {integer} questionId - unique identifier for question within quiz
 * @returns {SingleErrorObject | EmptyObjectReturn} returns empty object in success, error in failure
 */
export function adminQuizDeleteQuestion(quizId: number, questionId: number): SingleErrorObject | EmptyObjectReturn {
  const data = getData();
  const quiz = quizFindCheck(quizId);
  const question = questionFindCheck(quizId, questionId);

  if (!question) {
    // if question cannot be found - return error
    return QUESTION_NOT_EXIST_ERROR;
  }

  const session = data.sessions.filter(s => s.info.metadata.quizId === quizId);
  if (session && session.some(s => s.info.state !== SessionState.END)) {
    return SESSION_NOT_END_ERROR;
  }

  // remove question from quizzes array
  quiz.questionsTrash.push(question);
  // resort questions, excluding the removed question
  quiz.questions = quiz.questions.filter(q => q !== question);
  // update the time of last edited for quiz
  quiz.timeLastEdited = Math.floor(Date.now() / 1000);
  quiz.numQuestions--;
  quiz.duration -= question.duration;

  setData(data);
  return {};
}

/** function that moves question within quiz to new position
 *
 * @param {string} token - unqiue string identifier for user to protect userId
 * @param {integer} quizId - unique identifier for quiz
 * @param {integer} questionId - unique identifier for question within quiz
 * @param {integer} newPosition - new index for question to be moved to
 * @returns {EmptyObjectReturn | SingleErrorObject} returns empty object in success, error in failure
 */
export function adminQuizQuestionMove(token: string, quizId: number, questionId: number, newPosition: number): EmptyObjectReturn | SingleErrorObject {
  const data = getData();

  const user = tokenCheck(token);
  const quizOwn = forbiddenCheck(quizId, user);
  const quizQuestion = questionFindCheck(quizId, questionId);

  // error check that the quiz specified exists
  if (!quizQuestion) {
    return QUESTION_NOT_EXIST_ERROR;
  }

  // error check that the newPosition is not negative
  if (newPosition < 0) {
    return { error: ' newPosition is negative ' };
  }

  // error check that the newPosition is not greater than n-1
  const totalQuestions: number = quizOwn.questions.length;
  if (newPosition > (totalQuestions - 1)) {
    return { error: ' newPosition is not a valid/possible position ' };
  }

  // error check that the newPosition is not the same as current position
  // find Index of the question to be moved
  const questionCurrentPosition = quizOwn.questions.findIndex((question) => question.questionId === questionId);
  if (questionCurrentPosition === newPosition) {
    return { error: ' newPosition is the same as the current position ' };
  }

  const targetQuestion: Question = quizOwn.questions.find(q => q.questionId === questionId);
  quizOwn.timeLastEdited = Math.floor(Date.now() / 1000);
  quizQuestion.timeLastEdited = Math.floor(Date.now() / 1000);

  // delete the question and return the question element
  //  SPLICE METHOD
  //  splice(start, deleteCount, item1, item2,..., itemN)
  quizOwn.questions.splice(questionCurrentPosition, 1);

  // add the question back at the new index
  quizOwn.questions.splice(newPosition, 0, targetQuestion);

  setData(data);

  return {};
}

/** function that updates the details of specified question within quiz
 *
 * @param {integer} quizId - unique identifier for quiz
 * @param {integer} questionId - unique identifier for question within quiz
 * @param {CreateQuestionInput} questionBody - input of details to change question details
 * @returns {EmptyObjectReturn | SingleErrorObject} returns empty object in success, error string if failure
 */
export function adminQuizQuestionUpdate(quizId: number, questionId: number, questionBody: CreateQuestionInput): EmptyObjectReturn | SingleErrorObject {
  const data = getData();
  const quiz = quizFindCheck(quizId);
  const question = questionFindCheck(quizId, questionId);
  const durationWithoutThisQuestion = quiz.questions.reduce((sum, question) => {
    if (question.questionId !== questionId) {
      return sum + question.duration;
    }
    return sum;
  }, 0);

  if (!question) {
    // if question does not exist
    return QUESTION_NOT_EXIST_ERROR;
  } else if (!questionLengthCheck(questionBody.question)) {
    // if string is not between 5-50 characters
    return QUESTION_LENGTH_ERROR;
  } else if (!questionAnswersLengthCheck(questionBody.answers)) {
    // if there are not between 2-6 answers in question
    return QUESTION_ANSWER_LENGTH_ERROR;
  } else if (!questionDurationCheck(questionBody.duration)) {
    // question duration is negative
    return QUESTION_DURATION_ERROR;
  } else if (!quizTotalDurationCheck(durationWithoutThisQuestion, questionBody.duration)) {
    // if quiz total duration exceeds three minutes
    return QUIZ_DURATION_EXCEED_ERROR;
  } else if (!questionPointCheck(questionBody.points)) {
    // if points not between 1-10
    return QUESTION_POINTS_ERROR;
  } else if (!questionAnswersValidCheck(questionBody)) {
    // if answer string is not between 1-30
    return QUESTION_ANSWER_INVALID;
  } else if (!questionAnswersDuplicatesCheck(questionBody)) {
    // if there are duplicate answers within the question
    return QUESTION_ANSWER_DUPLICATE_ERROR;
  } else if (!questionCorrectAnswerCheck(questionBody)) {
    // if there are no correct answers
    return QUESTION_NO_CORRECT_ANSWER_ERROR;
  }

  question.question = questionBody.question;
  question.duration = questionBody.duration;
  question.points = questionBody.points;
  question.answers = questionBody.answers.map((answer) => ({ answerId: data.recentAnswerId++, ...answer, colour: randomColour() }));
  question.timeLastEdited = Math.floor(Date.now() / 1000);
  quiz.timeLastEdited = Math.floor(Date.now() / 1000);
  quiz.duration = durationWithoutThisQuestion + question.duration;

  setData(data);
  return {};
}

/** function that duplicates question immediately after source question in quiz
 *
 * @param {integer} quizId - unique identifier for quiz
 * @param {integer} questionId - unique identifier for question within quiz
 * @returns {SingleErrorObject | DuplicateQuestionReturn} returns new questionId if success, error msg if failure
 */
export function adminQuizDuplicateQuestion(quizId: number, questionId: number): SingleErrorObject | DuplicateQuestionReturn {
  const data = getData();
  const quiz = quizFindCheck(quizId);
  const sourceQuestion = questionFindCheck(quizId, questionId);

  if (!sourceQuestion) {
    // if question cannot be found return error
    return QUESTION_NOT_EXIST_ERROR;
  }

  // Create a duplicate question
  data.recentQuestionId += 1;
  const duplicateQuestion = { ...sourceQuestion };
  duplicateQuestion.questionId = data.recentQuestionId;
  duplicateQuestion.timeLastEdited = Math.floor(Date.now() / 1000);

  // Find the index of the source question
  const sourceQuestionIndex = quiz.questions.findIndex((question) => question.questionId === questionId);
  quiz.questions.splice(sourceQuestionIndex + 1, 0, duplicateQuestion);
  quiz.numQuestions++;
  quiz.duration += sourceQuestion.duration;
  quiz.timeLastEdited = Math.floor(Date.now() / 1000);

  setData(data);

  return { newQuestionId: duplicateQuestion.questionId };
}

/** function that updates the details of specified question within quiz
 *
 * @param {integer} quizId - unique identifier for quiz
 * @param {integer} questionId - unique identifier for question within quiz
 * @param {CreateQuestionInput} questionBody - input of details to change question details
 * @returns {EmptyObjectReturn | SingleErrorObject} returns empty object in success, error string if failure
 */
export function adminQuizQuestionUpdateV2(quizId: number, questionId: number, questionBody: CreateQuestionInput): EmptyObjectReturn | SingleErrorObject {
  const data = getData();
  const quiz = quizFindCheck(quizId);
  const question = questionFindCheck(quizId, questionId);
  const durationWithoutThisQuestion = quiz.questions.reduce((sum, question) => {
    if (question.questionId !== questionId) {
      return sum + question.duration;
    }
    return sum;
  }, 0);

  if (!question) {
    // if question does not exist
    return QUESTION_NOT_EXIST_ERROR;
  } else if (!questionLengthCheck(questionBody.question)) {
    // if string is not between 5-50 characters
    return QUESTION_LENGTH_ERROR;
  } else if (!questionAnswersLengthCheck(questionBody.answers)) {
    // if there are not between 2-6 answers in question
    return QUESTION_ANSWER_LENGTH_ERROR;
  } else if (!questionDurationCheck(questionBody.duration)) {
    // question duration is negative
    return QUESTION_DURATION_ERROR;
  } else if (!quizTotalDurationCheck(durationWithoutThisQuestion, questionBody.duration)) {
    // if quiz total duration exceeds three minutes
    return QUIZ_DURATION_EXCEED_ERROR;
  } else if (!questionPointCheck(questionBody.points)) {
    // if points not between 1-10
    return QUESTION_POINTS_ERROR;
  } else if (!questionAnswersValidCheck(questionBody)) {
    // if answer string is not between 1-30
    return QUESTION_ANSWER_INVALID;
  } else if (!questionAnswersDuplicatesCheck(questionBody)) {
    // if there are duplicate answers within the question
    return QUESTION_ANSWER_DUPLICATE_ERROR;
  } else if (!questionCorrectAnswerCheck(questionBody)) {
    // if there are no correct answers
    return QUESTION_NO_CORRECT_ANSWER_ERROR;
  } else if (!thumbnailValidCheck(questionBody.thumbnailUrl)) {
    return THUMBNAIL_INVALID_ERROR;
  }

  question.question = questionBody.question;
  question.duration = questionBody.duration;
  question.points = questionBody.points;
  question.answers = questionBody.answers.map((answer) => ({ answerId: data.recentAnswerId++, ...answer, colour: randomColour() }));
  question.timeLastEdited = Math.floor(Date.now() / 1000);
  question.thumbnailUrl = questionBody.thumbnailUrl;
  quiz.timeLastEdited = Math.floor(Date.now() / 1000);
  quiz.duration = durationWithoutThisQuestion + question.duration;

  setData(data);
  return {};
}

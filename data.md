```javascript

let data = {
  users: [
    {
      authUserId: 1,
      nameFirst: 'Lisa',
      nameLast: 'Lin',
      email: 'z5481396@ad.unsw.edu.au',
      password: 'Astr0ngPa55word',
      numSuccessfulLogins: 0,
      numFailedPasswordsSinceLastLogin: 0,
      usedPassword: ['An0therPa55word'],
      token: ['averyverylongsamp1ef0rthet0kenweusebecause1t1sramd0ms0id0ntknow']
    }
  ],
  quizzes: [
    {
      authUserId: 1,
      quizId: 1,
      name: 'sample quiz',
      timeCreated: 12,
      timeLastEdited: 2,
      description: 'sample quiz description',
      questions: [
        {
          quizId: 1,
          questionId: 1,
          question: 'i hate this?',
          duration: 0.2,
          timeCreated: 1609459200000,
          timeLastEdited: 1609545600000,
          points: 5,
          thumbnailUrl: 'https://www.doglogic.com.au/dawgs/wp-content/uploads/2015/11/puppy-training-school-sydney.jpg',
          answers: [
            {
              answerId: 1,
              answer: 'lisas good at math',
              correct: false,
              colour: red
            },
          ]
        },
      ],
      duration: 2.2,
      thumbnailUrl: 'https://www.example.com/thumbnail.jpg'
    },
  ],sessions: [
    {
      sessionId: 1,
      autoStartNum: 4,
      timeCreated: 1609459200000,
      messages: [
        {
          messageBody: 'I win',
          playerId: 1,
          playerName: 'A',
          timeSent: 1610000000000
        },
        {
          messageBody: 'No! You won\'t',
          playerId: 2,
          playerName: 'BB',
          timeSent: 1610000050000
        },
        {
          messageBody: 'Crazzzzzy!',
          playerId: 4,
          playerName: 'DDDD',
          timeSent: 1610000100000
        }
      ],
      info: {
        state: SessionState.FINAL_RESULTS,
        atQuestion: 0,
        players: [{ playerId: 1, name: 'A' }],
        metadata: {
          quizId: 1,
          name: 'Bulling',
          timeCreated: 1609459200000,
          timeLastEdited: 1609545600000,
          description: 'Dont Do it',
          numQuestions: 2,
          questions: [
        {
          quizId: 1,
          questionId: 1,
          question: 'i hate this?',
          duration: 0.2,
          timeCreated: 1609459200000,
          timeLastEdited: 1609545600000,
          points: 5,
          thumbnailUrl: 'https://www.doglogic.com.au/dawgs/wp-content/uploads/2015/11/puppy-training-school-sydney.jpg',
          answers: [
            {
              answerId: 1,
              answer: 'lisas good at math',
              correct: false
              colour: red
            }
          ]
        },
      ],
          duration: 2.2,
          thumbnailUrl: 'https://www.example.com/thumbnail.jpg'
        }
      },
      playerAnswer: [
      {
        playerId: 1,
        questionId: 1,
        answerIds: [1]
      },
      {
        playerId: 2,
        questionId: 1,
        answerIds: [2]
      },
    ]
    },
  ],
  recentUserId: 2,
  recentQuizId: 2,
  recentSessionId: 2
};

```
[Optional] short description: updated dataStore according to iter2 function implementation 

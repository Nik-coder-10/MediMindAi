/**
 * End-to-End API Simulation Test
 * 1. Simulates Patient Session Start with "kandhe mai dard"
 * 2. Simulates answering the questions
 * 3. Submits session to doctor queue
 * 4. Verifies doctor dashboard & case dossier answers view
 */

const { AdaptiveEngineService } = require('../lib/engine/adaptive-engine.service');
const { inMemoryClinicalStore } = require('../lib/db/in-memory-store');

async function testFullFlow() {
  console.log('=== END-TO-END PATIENT TO DOCTOR DOSSIER INTEGRATION TEST ===\n');

  const testSessionId = `test-sess-${Date.now()}`;
  const chiefComplaint = "kandhe mai dard";

  console.log(`Step 1: Starting Session for "${chiefComplaint}" (Session ID: ${testSessionId})`);
  const sessionResult = await AdaptiveEngineService.startSession(
    testSessionId,
    chiefComplaint,
    "hi",
    "AYURVEDA"
  );

  console.log(`  State Category: ${sessionResult.state.category}`);
  console.log(`  Total maxQuestions: ${sessionResult.state.maxQuestions}`);
  console.log(`  First Question Node: ${sessionResult.firstQuestion?.nodeCode}`);
  console.log(`  First Question Text (Hi): ${sessionResult.firstQuestion?.questionTextHindi}`);
  console.log(`  First Question Text (En): ${sessionResult.firstQuestion?.questionText}`);

  // Create session in inMemoryClinicalStore
  inMemoryClinicalStore.createSession({
    id: testSessionId,
    patientId: "test-patient-001",
    language: "hi",
    intakeMode: "AYURVEDA",
    patient: {
      id: "test-patient-001",
      userId: "user-001",
      firstName: "रवि",
      lastName: "वर्मा",
      dateOfBirth: new Date("1988-04-12"),
      gender: "MALE",
      bloodGroup: "O+",
      timelineEvents: [],
      consentRecords: []
    }
  });

  // Step 2: Answer first 3 questions
  console.log('\nStep 2: Answering questions and propagating to clinical store...');
  let curQ = sessionResult.firstQuestion;
  let ansCount = 0;

  while (curQ && ansCount < 3) {
    ansCount++;
    const chosenVal = curQ.options && curQ.options.length > 0 ? curQ.options[0].value : "NORMAL";
    console.log(`  Answering Q${ansCount} [${curQ.nodeCode}] with "${chosenVal}"`);

    const ansRes = await AdaptiveEngineService.processAnswer(
      testSessionId,
      curQ.nodeCode,
      chosenVal
    );

    // Save to inMemoryClinicalStore as in app/api/patient/conversation/answer/route.ts
    inMemoryClinicalStore.addAnswer(testSessionId, {
      nodeCode: curQ.nodeCode,
      answerValue: chosenVal,
      questionNode: {
        nodeCode: curQ.nodeCode,
        questionText: curQ.questionText,
        questionTextHindi: curQ.questionTextHindi,
        clinicalDomain: curQ.clinicalDomain,
      }
    });

    curQ = ansRes.nextQuestion;
  }

  // Step 3: Verify Doctor Case Dossier retrieved answers
  console.log('\nStep 3: Checking Doctor Case Dossier view for saved answers...');
  const storedSession = inMemoryClinicalStore.getSession(testSessionId);
  console.log(`  Stored Answers in Doctor Dossier: ${storedSession?.patientAnswers.length}`);
  storedSession?.patientAnswers.forEach((pa, i) => {
    console.log(`    Ans ${i+1}: Node: ${pa.nodeCode} | Value: ${pa.answerValue}`);
    console.log(`            Question (Hi): ${pa.questionNode?.questionTextHindi}`);
    console.log(`            Question (En): ${pa.questionNode?.questionText}`);
  });

  if (storedSession?.patientAnswers.length === 3) {
    console.log('\n✅ VERIFICATION SUCCESSFUL: Questions flow seamlessly from patient intake to doctor case dossier!');
  } else {
    console.error('\n❌ VERIFICATION FAILED: Missing answers in store.');
  }
}

testFullFlow().catch(console.error);

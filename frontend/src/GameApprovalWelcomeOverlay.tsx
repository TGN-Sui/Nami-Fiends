import { useState, type ReactElement } from 'react';

import {
  advanceGameApprovalWelcomeStep,
  completeGameApprovalWelcome,
  updateGameApprovalQuestionnaireAnswer,
  useGameApprovalWelcomeState,
} from './game-approval-welcome-store.js';
import {
  GAME_STUDIO_QUESTIONNAIRE_QUESTIONS,
  isGameStudioQuestionnaireComplete,
} from './game-studio-questionnaire.js';
import { markGameSubmissionQuestionnaireComplete } from './game-submission-ticket-store.js';
import {
  markGameOwnerQuestionnaireComplete,
  readGameOwnerSession,
} from './game-owner-session-store.js';

export function GameApprovalWelcomeOverlay(): ReactElement | null {
  const welcome = useGameApprovalWelcomeState();
  const session = readGameOwnerSession();
  const [notice, setNotice] = useState<string | null>(null);

  if (!welcome || !session || welcome.step === 'completed') {
    return null;
  }

  const questionnaireComplete = isGameStudioQuestionnaireComplete(welcome.questionnaireAnswers);

  function handleAdvance(): void {
    setNotice(null);
    advanceGameApprovalWelcomeStep();
  }

  function handleFinishQuestionnaire(): void {
    if (!questionnaireComplete) {
      setNotice('Answer every questionnaire item to implement your badge system.');
      return;
    }

    markGameSubmissionQuestionnaireComplete(session!.ticketId, welcome!.questionnaireAnswers);
    markGameOwnerQuestionnaireComplete();
    completeGameApprovalWelcome();
    setNotice(null);
  }

  return (
    <div
      aria-labelledby="game-approval-welcome-title"
      className="game-approval-welcome-backdrop"
      role="dialog"
    >
      <article className="panel game-approval-welcome-popup">
        {welcome.step === 'approved' ? (
          <>
            <p className="game-approval-welcome-eyebrow">Nami Officials</p>
            <h2 className="game-approval-welcome-title" id="game-approval-welcome-title">
              APPROVED!
            </h2>
            <p>
              {session.gameTitle} is fully approved. Your studio can now enter the complete Nami
              experience.
            </p>
            <button className="primary-action" onClick={handleAdvance} type="button">
              Continue
            </button>
          </>
        ) : null}

        {welcome.step === 'one-more-step' ? (
          <>
            <p className="game-approval-welcome-eyebrow">Almost there</p>
            <h2 id="game-approval-welcome-title">One more step</h2>
            <p>
              Your channel is approved, but Nami still needs your studio questionnaire before badge
              rules go live on your game profile.
            </p>
            <button className="primary-action" onClick={handleAdvance} type="button">
              I understand
            </button>
          </>
        ) : null}

        {welcome.step === 'questionnaire-prompt' ? (
          <>
            <p className="game-approval-welcome-eyebrow">Badge system</p>
            <h2 id="game-approval-welcome-title">Implement your badge system</h2>
            <p>
              Start the studio questionnaire now so Nami can configure your official badge rollout
              for {session.gameTitle}.
            </p>
            <button className="primary-action" onClick={handleAdvance} type="button">
              Start questionnaire
            </button>
          </>
        ) : null}

        {welcome.step === 'questionnaire' ? (
          <>
            <p className="game-approval-welcome-eyebrow">Studio questionnaire</p>
            <h2 id="game-approval-welcome-title">Badge implementation</h2>
            <p className="protocol-hint">
              These answers configure how your approved game channel issues badges to players.
            </p>

            {GAME_STUDIO_QUESTIONNAIRE_QUESTIONS.map((question) => (
              <fieldset className="onboarding-quiz-question" key={question.id}>
                <legend>{question.prompt}</legend>
                <div className="onboarding-quiz-options">
                  {question.options.map((option) => (
                    <label className="onboarding-quiz-option" key={option.id}>
                      <input
                        checked={welcome.questionnaireAnswers[question.id] === option.id}
                        name={'approval-' + question.id}
                        onChange={() =>
                          updateGameApprovalQuestionnaireAnswer(question.id, option.id)
                        }
                        type="radio"
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            ))}

            {notice ? <p className="onboarding-field-error">{notice}</p> : null}

            <button
              className="primary-action"
              disabled={!questionnaireComplete}
              onClick={handleFinishQuestionnaire}
              type="button"
            >
              Finish and enter Nami
            </button>
          </>
        ) : null}
      </article>
    </div>
  );
}
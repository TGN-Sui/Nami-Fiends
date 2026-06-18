import { useMemo, useState, type ReactElement } from 'react';

import {
  pendingApprovalsInThread,
  useApprovalRequests,
  type ApprovalRequest,
} from './approval-requests-store.js';
import { respondToGuildCreationProposal } from './guild-creation-store.js';
import { useSelfMember } from './member-avatar-store.js';
import { respondToSquadInviteApproval } from './squad-roster-store.js';

type ApprovalRequestActionsProps = {
  counterpartyMemberId: string;
  onResolved?: (message: string) => void;
};

function canSelfApprove(request: ApprovalRequest, selfMemberId: string): boolean {
  return request.status === 'pending' && request.approverMemberId === selfMemberId;
}

export function ApprovalRequestActions(props: ApprovalRequestActionsProps): ReactElement | null {
  const selfMember = useSelfMember();
  useApprovalRequests();
  const [notice, setNotice] = useState('');

  const pendingRequests = useMemo(
    () => pendingApprovalsInThread(selfMember.id, props.counterpartyMemberId),
    [props.counterpartyMemberId, selfMember.id]
  );

  if (pendingRequests.length === 0) {
    return notice ? <p className="protocol-hint">{notice}</p> : null;
  }

  function resolveDecision(
    request: ApprovalRequest,
    decision: 'approved' | 'declined',
    actingMemberId: string
  ): void {
    if (request.kind === 'squad-invite') {
      const result = respondToSquadInviteApproval(request.referenceId, decision);

      if (!result.ok) {
        setNotice(result.reason);
        return;
      }

      const message =
        decision === 'approved'
          ? 'Squad invite approved. Adventurer benefits unlocked and roster slot consumed.'
          : 'Squad invite declined.';
      setNotice(message);
      props.onResolved?.(message);
      return;
    }

    if (request.kind === 'guild-cofounder') {
      const result = respondToGuildCreationProposal(request.referenceId, actingMemberId, decision);

      if (!result.ok) {
        setNotice(result.reason);
        return;
      }

      const message =
        result.proposal.status === 'finalized'
          ? 'Guild co-founder approvals complete. ' + result.proposal.proposedName + ' is now live.'
          : result.proposal.status === 'declined'
            ? 'Guild creation ended. The creator can try again with new co-founders.'
            : decision === 'approved'
              ? 'Co-founder approval recorded.'
              : 'Guild creation proposal declined.';
      setNotice(message);
      props.onResolved?.(message);
    }
  }

  function handleDecision(request: ApprovalRequest, decision: 'approved' | 'declined'): void {
    resolveDecision(request, decision, selfMember.id);
  }

  function simulateDecision(request: ApprovalRequest, decision: 'approved' | 'declined'): void {
    resolveDecision(request, decision, request.approverMemberId);
  }

  return (
    <div className="approval-request-stack">
      {pendingRequests.map((request) => (
        <article className="panel approval-request-card" key={request.id}>
          <div className="profile-panel-heading">
            <h2>{request.title}</h2>
            <p>{request.body}</p>
          </div>

          {canSelfApprove(request, selfMember.id) ? (
            <div className="guild-hierarchy-actions">
              <button
                className="primary-action"
                onClick={() => handleDecision(request, 'approved')}
                type="button"
              >
                Approve
              </button>
              <button
                className="secondary-action"
                onClick={() => handleDecision(request, 'declined')}
                type="button"
              >
                Decline
              </button>
            </div>
          ) : request.senderMemberId === selfMember.id &&
            request.approverMemberId === props.counterpartyMemberId ? (
            <div className="guild-hierarchy-actions">
              <p className="protocol-hint">Waiting for {request.approverName} to open this message and approve.</p>
              <button
                className="secondary-action"
                onClick={() => simulateDecision(request, 'approved')}
                type="button"
              >
                Simulate {request.approverName} approves (demo)
              </button>
            </div>
          ) : (
            <p className="protocol-hint">Waiting for {request.approverName} to respond.</p>
          )}
        </article>
      ))}

      {notice ? <p className="protocol-hint">{notice}</p> : null}
    </div>
  );
}
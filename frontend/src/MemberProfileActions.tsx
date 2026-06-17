import { useSignAndExecuteTransaction, useSuiClient, useCurrentAccount } from '@mysten/dapp-kit';
import { useEffect, useMemo, useState, type ReactElement } from 'react';

import { isMemberVerified } from './member-access.js';
import { guildMaxMembers, guildMemberCount } from './nami-affiliations.js';
import {
  canInviteMemberToAnyGuild,
  invitableGuildsForTarget,
  sendGuildInvite,
  useGuildInvites,
} from './guild-invites-store.js';
import { recordGoonPurchase, recordGoonTip, totalTipsReceived } from './goon-tips-store.js';
import {
  formatGoonCoinTypeLabel,
  goonAmountToBaseUnits,
  NAMI_GOON_SYMBOL,
  readConfiguredGoonCoinType,
} from './goon-token.js';
import { buildGoonTransferTransaction, resolveGoonCoinType } from './goon-wallet-payment.js';
import { fetchPaymentConfig, isPaymentApiAvailable } from './membership-payments-api.js';
import { useSelfMember } from './member-avatar-store.js';
import { isSelfMember } from './surface-preferences.js';
import { type NamiMember } from './uiMockData.js';
import { useProtocolOwner } from './wallet.js';

type MemberProfileActionsProps = {
  member: NamiMember;
  onNavigateGuilds?: () => void;
};

export function MemberProfileActions(props: MemberProfileActionsProps): ReactElement | null {
  const { source } = useProtocolOwner();
  const selfMember = useSelfMember();
  const walletAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();

  const showBuy = source === 'wallet';
  const showTip = !isSelfMember(props.member.id) && source === 'wallet' && isMemberVerified(selfMember);
  const guildInvites = useGuildInvites();
  const [inviteGuildId, setInviteGuildId] = useState('');
  const [inviteStatus, setInviteStatus] = useState<string | null>(null);
  const [goonAmount, setGoonAmount] = useState('25');
  const [goonStatus, setGoonStatus] = useState<string | null>(null);
  const [goonBalance, setGoonBalance] = useState<string | null>(null);
  const [goonCoinType, setGoonCoinType] = useState(readConfiguredGoonCoinType());
  const [tipTreasuryAddress, setTipTreasuryAddress] = useState<string | null>(null);
  const [goonLoading, setGoonLoading] = useState(false);
  const [activePanel, setActivePanel] = useState<'invite' | 'buy' | 'tip' | null>(null);

  const invitableGuilds = useMemo(
    () => invitableGuildsForTarget(props.member.id),
    [props.member.id, guildInvites]
  );

  const showInvite = !isSelfMember(props.member.id) && canInviteMemberToAnyGuild(props.member);
  const tipsTotal = totalTipsReceived(props.member.id);

  useEffect(() => {
    if (!isPaymentApiAvailable()) {
      return;
    }

    void fetchPaymentConfig()
      .then((config) => {
        setGoonCoinType(resolveGoonCoinType(config.goonCoinType));
        setTipTreasuryAddress(config.treasuryAddress);
      })
      .catch(() => {
        setGoonCoinType(readConfiguredGoonCoinType());
      });
  }, []);

  useEffect(() => {
    if (!walletAccount?.address || activePanel !== 'buy') {
      return;
    }

    void suiClient
      .getBalance({
        owner: walletAccount.address,
        coinType: goonCoinType,
      })
      .then((balance) => {
        const whole = Number(balance.totalBalance) / 10 ** 9;
        setGoonBalance(whole.toLocaleString(undefined, { maximumFractionDigits: 4 }));
      })
      .catch(() => setGoonBalance(null));
  }, [activePanel, goonCoinType, suiClient, walletAccount?.address]);

  if (!showInvite && !showBuy && !showTip) {
    return null;
  }

  function sendInvite(): void {
    const guild = invitableGuilds.find((entry) => entry.id === inviteGuildId);

    if (!guild) {
      setInviteStatus('Pick a guild to invite ' + props.member.name + ' into.');
      return;
    }

    const result = sendGuildInvite(props.member, guild);

    if (!result.ok) {
      setInviteStatus(result.reason);
      return;
    }

    setInviteStatus('Invite sent to ' + props.member.name + ' for ' + guild.name + '.');
    setActivePanel(null);
  }

  async function buyGoon(): Promise<void> {
    const amount = Number(goonAmount);

    if (!walletAccount?.address) {
      setGoonStatus('Connect your Sui wallet to buy ' + NAMI_GOON_SYMBOL + '.');
      return;
    }

    setGoonLoading(true);
    setGoonStatus(null);

    try {
      const balance = await suiClient.getBalance({
        owner: walletAccount.address,
        coinType: goonCoinType,
      });
      const whole = Number(balance.totalBalance) / 10 ** 9;

      const result = recordGoonPurchase(amount);

      if (!result.ok) {
        setGoonStatus(result.reason);
        return;
      }

      setGoonBalance(whole.toLocaleString(undefined, { maximumFractionDigits: 4 }));
      setGoonStatus(
        'Buying ' +
          NAMI_GOON_SYMBOL +
          ' uses token ' +
          goonCoinType +
          '. Wallet balance: ' +
          whole.toLocaleString(undefined, { maximumFractionDigits: 4 }) +
          ' ' +
          NAMI_GOON_SYMBOL +
          '. Swap on Sui using this coin type to top up.'
      );
      setActivePanel(null);
    } catch (error) {
      setGoonStatus(error instanceof Error ? error.message : 'Could not read ' + NAMI_GOON_SYMBOL + ' balance.');
    } finally {
      setGoonLoading(false);
    }
  }

  async function tipGoon(): Promise<void> {
    const amount = Number(goonAmount);

    if (!walletAccount?.address) {
      setGoonStatus('Connect your Sui wallet to tip ' + NAMI_GOON_SYMBOL + '.');
      return;
    }

    if (!tipTreasuryAddress) {
      setGoonStatus('Tip routing is not configured. Set NAMI_PAYMENT_TREASURY_ADDRESS on the server.');
      return;
    }

    setGoonLoading(true);
    setGoonStatus(null);

    try {
      const coins = await suiClient.getCoins({
        owner: walletAccount.address,
        coinType: goonCoinType,
      });
      const amountBaseUnits = goonAmountToBaseUnits(amount);
      const spendable = coins.data.find((coin) => BigInt(coin.balance) >= BigInt(amountBaseUnits));

      if (!spendable) {
        setGoonStatus('Not enough ' + NAMI_GOON_SYMBOL + ' in your wallet for this tip.');
        return;
      }

      const tx = buildGoonTransferTransaction({
        recipientAddress: tipTreasuryAddress,
        amountGoon: amount,
        payerCoinObjectId: spendable.coinObjectId,
        coinType: goonCoinType,
      });

      const result = await signAndExecute({ transaction: tx });
      const recordResult = recordGoonTip(props.member, amount);

      if (!recordResult.ok) {
        setGoonStatus(recordResult.reason);
        return;
      }

      setGoonStatus(
        'Tipped ' +
          amount.toLocaleString() +
          ' ' +
          NAMI_GOON_SYMBOL +
          ' to ' +
          props.member.name +
          ' (tx ' +
          result.digest.slice(0, 10) +
          '…).'
      );
      setActivePanel(null);
    } catch (error) {
      setGoonStatus(error instanceof Error ? error.message : 'Wallet tip failed.');
    } finally {
      setGoonLoading(false);
    }
  }

  return (
    <div className="member-profile-social-actions">
      <div className="member-profile-social-action-row">
        {showInvite ? (
          <button
            className={'nami-surface-button' + (activePanel === 'invite' ? ' is-active-surface-button' : '')}
            onClick={() => {
              setInviteStatus(null);
              setActivePanel(activePanel === 'invite' ? null : 'invite');
              setInviteGuildId(invitableGuilds[0]?.id ?? '');
            }}
            type="button"
          >
            Invite to Guild
          </button>
        ) : null}

        {showBuy ? (
          <button
            className={'nami-surface-button' + (activePanel === 'buy' ? ' is-active-surface-button' : '')}
            onClick={() => {
              setGoonStatus(null);
              setActivePanel(activePanel === 'buy' ? null : 'buy');
            }}
            type="button"
          >
            Buy {NAMI_GOON_SYMBOL}
          </button>
        ) : null}

        {showTip ? (
          <button
            className={
              'nami-surface-button is-primary-surface-button' +
              (activePanel === 'tip' ? ' is-active-surface-button' : '')
            }
            onClick={() => {
              setGoonStatus(null);
              setActivePanel(activePanel === 'tip' ? null : 'tip');
            }}
            type="button"
          >
            Tip {NAMI_GOON_SYMBOL}
          </button>
        ) : null}
      </div>

      {tipsTotal > 0 ? (
        <p className="member-profile-goon-total">
          {props.member.name} has received {tipsTotal.toLocaleString()} {NAMI_GOON_SYMBOL} in tips.
        </p>
      ) : null}

      {activePanel === 'invite' ? (
        <div className="member-profile-action-panel">
          <p>Guild owners and members can invite others. Slots follow membership tier limits.</p>
          <label className="member-profile-action-field">
            <span>Guild</span>
            <select
              onChange={(event) => setInviteGuildId(event.target.value)}
              value={inviteGuildId || invitableGuilds[0]?.id || ''}
            >
              {invitableGuilds.map((guild) => (
                <option key={guild.id} value={guild.id}>
                  {guild.name} ({guildMemberCount(guild.id)}/{guildMaxMembers(guild)})
                </option>
              ))}
            </select>
          </label>
          <div className="member-profile-action-panel-actions">
            <button className="primary-action" onClick={sendInvite} type="button">
              Send invite
            </button>
            {props.onNavigateGuilds ? (
              <button className="secondary-action" onClick={props.onNavigateGuilds} type="button">
                My Guilds
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {activePanel === 'buy' || activePanel === 'tip' ? (
        <div className="member-profile-action-panel">
          <p>
            {activePanel === 'buy'
              ? 'Buy ' +
                NAMI_GOON_SYMBOL +
                ' on Sui using the canonical token type below. Your wallet balance refreshes when you continue.'
              : 'Send ' +
                NAMI_GOON_SYMBOL +
                ' from your connected, verified wallet to ' +
                props.member.name +
                '.'}
          </p>
          <div className="member-profile-goon-token-row">
            <span>Token</span>
            <code title={goonCoinType}>{formatGoonCoinTypeLabel(goonCoinType)}</code>
          </div>
          {goonBalance !== null && activePanel === 'buy' ? (
            <p className="member-profile-goon-balance">
              Wallet balance: <strong>{goonBalance}</strong> {NAMI_GOON_SYMBOL}
            </p>
          ) : null}
          <label className="member-profile-action-field">
            <span>Amount ({NAMI_GOON_SYMBOL})</span>
            <input
              aria-label={activePanel === 'buy' ? 'GOON purchase amount' : 'GOON tip amount'}
              min="1"
              onChange={(event) => setGoonAmount(event.target.value)}
              type="number"
              value={goonAmount}
            />
          </label>
          <div className="member-profile-action-panel-actions">
            <button
              className="primary-action"
              disabled={goonLoading}
              onClick={() => void (activePanel === 'buy' ? buyGoon() : tipGoon())}
              type="button"
            >
              {goonLoading
                ? 'Waiting for wallet…'
                : activePanel === 'buy'
                  ? 'Check balance & buy'
                  : 'Send tip'}
            </button>
          </div>
        </div>
      ) : null}

      {inviteStatus ? <p className="member-profile-action-status">{inviteStatus}</p> : null}
      {goonStatus ? <p className="member-profile-action-status">{goonStatus}</p> : null}
    </div>
  );
}
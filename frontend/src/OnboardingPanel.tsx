import {
  useMemo,
  useState,
  type ReactElement
} from 'react';

import {
  ONBOARDING_STEPS,
  getOnboardingMethodLabel,
  type OnboardingMethod
} from './onboarding.js';

interface OnboardingPanelProps {
  packageId: string;
  network: string;
  isPackageConfigured: boolean;
}

export function OnboardingPanel(
  props: OnboardingPanelProps
): ReactElement {
  const [method, setMethod] = useState<OnboardingMethod>('demo');

  const methodLabel = useMemo(() => {
    return getOnboardingMethodLabel(method);
  }, [method]);

  return (
    <section className="onboarding-panel">
      <div className="onboarding-copy">
        <p className="eyebrow">Onboarding</p>
        <h2>Enter Nami through wallet, zkLogin, or demo mode.</h2>
        <p>
          This is the MVP onboarding surface. Full transaction wiring comes
          after the presentable MVP checkpoint and Break-the-System suite.
        </p>
      </div>

      <div className="onboarding-card">
        <div className="method-toggle" aria-label="Onboarding method">
          <button
            className={method === 'wallet' ? 'active' : ''}
            type="button"
            onClick={() => setMethod('wallet')}
          >
            Wallet
          </button>

          <button
            className={method === 'zklogin' ? 'active' : ''}
            type="button"
            onClick={() => setMethod('zklogin')}
          >
            zkLogin
          </button>

          <button
            className={method === 'demo' ? 'active' : ''}
            type="button"
            onClick={() => setMethod('demo')}
          >
            Demo
          </button>
        </div>

        <div className="onboarding-status">
          <div>
            <span>Selected method</span>
            <strong>{methodLabel}</strong>
          </div>

          <div>
            <span>Network</span>
            <strong>{props.network}</strong>
          </div>

          <div>
            <span>Package</span>
            <strong>
              {props.isPackageConfigured ? 'Configured' : 'Missing'}
            </strong>
          </div>
        </div>

        <div className="onboarding-package">
          <span>Package ID</span>
          <code>
            {props.packageId.trim() === ''
              ? 'Not configured'
              : props.packageId}
          </code>
        </div>

        <div className="onboarding-steps">
          {ONBOARDING_STEPS.map((step) => (
            <div className="onboarding-step" key={step.label}>
              <span className={`step-dot step-${step.status}`} />
              <div>
                <strong>{step.label}</strong>
                <p>{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
import { type ReactElement, type ReactNode } from 'react';

type ProfilePassportCarouselProps = {
  passportView: ReactNode;
  badgeBookView: ReactNode;
  activeSlide: 'passport' | 'badges';
  passportLayout?: 'vertical' | 'horizontal';
  sideRail?: ReactNode;
};

export function ProfilePassportCarousel(props: ProfilePassportCarouselProps): ReactElement {
  return (
    <section
      className={
        'profile-passport-carousel' +
        (props.passportLayout === 'horizontal' ? ' is-horizontal-passport-layout' : '') +
        (props.activeSlide === 'badges' ? ' is-badge-book-layout' : '')
      }
    >
      <div className="profile-passport-carousel-layout">
        <div className="profile-passport-carousel-viewport">
          {props.activeSlide === 'passport' ? (
            <div className="profile-passport-carousel-slide is-active-profile-slide" role="tabpanel">
              {props.passportView}
            </div>
          ) : (
            <div className="profile-passport-carousel-slide is-active-profile-slide" role="tabpanel">
              {props.badgeBookView}
            </div>
          )}
        </div>

        {props.sideRail ? (
          <aside className="profile-passport-carousel-rail">
            <div className="profile-passport-carousel-side-rail">{props.sideRail}</div>
          </aside>
        ) : null}
      </div>
    </section>
  );
}
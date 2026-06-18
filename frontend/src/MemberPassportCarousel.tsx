import { useMemo, useState, type ReactElement } from 'react';

import { TcgFoilPassportCard } from './TcgFoilPassportCard.js';
import type { ConductSignal, NamiMember } from './uiMockData.js';

type MemberPassportCarouselProps = {
  members: NamiMember[];
  pageSize?: number;
  onOpenMember: (member: NamiMember) => void;
  resolveSignal?: (member: NamiMember) => ConductSignal;
};

export function MemberPassportCarousel(props: MemberPassportCarouselProps): ReactElement {
  const pageSize = props.pageSize ?? 3;
  const [pageIndex, setPageIndex] = useState(0);

  const pageCount = Math.max(1, Math.ceil(props.members.length / pageSize));
  const safePageIndex = Math.min(pageIndex, pageCount - 1);

  const visibleMembers = useMemo(() => {
    const start = safePageIndex * pageSize;

    return props.members.slice(start, start + pageSize);
  }, [props.members, pageSize, safePageIndex]);

  function goToPreviousPage(): void {
    setPageIndex((current) => Math.max(0, current - 1));
  }

  function goToNextPage(): void {
    setPageIndex((current) => Math.min(pageCount - 1, current + 1));
  }

  return (
    <section aria-label="Member passports" className="member-passport-carousel">
      <div className="member-passport-carousel-head">
        <div>
          <h2>Members</h2>
          <p>
            {props.members.length} passport{props.members.length === 1 ? '' : 's'} in this space
          </p>
        </div>

        {pageCount > 1 ? (
          <div className="member-passport-carousel-controls">
            <button
              aria-label="Previous member passports"
              className="nami-surface-button member-passport-carousel-nav"
              disabled={safePageIndex === 0}
              onClick={goToPreviousPage}
              type="button"
            >
              Prev
            </button>
            <span className="member-passport-carousel-count">
              {safePageIndex + 1} / {pageCount}
            </span>
            <button
              aria-label="Next member passports"
              className="nami-surface-button member-passport-carousel-nav"
              disabled={safePageIndex >= pageCount - 1}
              onClick={goToNextPage}
              type="button"
            >
              Next
            </button>
          </div>
        ) : null}
      </div>

      <div className="member-passport-carousel-track">
        {visibleMembers.map((member) => (
          <div className="member-passport-carousel-slot" key={member.id}>
            <TcgFoilPassportCard
              layout="vertical"
              member={member}
              onOpenPassport={() => props.onOpenMember(member)}
              signal={props.resolveSignal ? props.resolveSignal(member) : member.signal}
            />
            <button
              className="secondary-action member-passport-carousel-profile-button"
              onClick={() => props.onOpenMember(member)}
              type="button"
            >
              View {member.name}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
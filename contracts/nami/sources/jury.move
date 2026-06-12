module nami::jury {

    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};

    use nami::appeals;
    use nami::conduct;
    use nami::errors;
    use nami::membership;
    use nami::passport;

    // =========================================================
    // JURY CASE STATUS
    // =========================================================
    const STATUS_OPEN: u8 = 1;
    const STATUS_CLOSED: u8 = 2;

    // =========================================================
    // JURY VOTE / RECOMMENDATION TYPES
    // Matches appeal resolution-style statuses.
    // =========================================================
    const RESULT_APPROVED: u8 = 2;
    const RESULT_DENIED: u8 = 3;
    const RESULT_MODIFIED: u8 = 4;

    // =========================================================
    // JURY ELIGIBILITY TIERS
    // =========================================================
    const PRO: u8 = 2;
    const ELITE: u8 = 3;

    // =========================================================
    // JURY CASE OBJECT
    // =========================================================
    public struct JuryCase has key {
        id: UID,

        appeal_id: address,
        appellant: address,
        passport_id: address,

        required_votes: u64,

        approve_votes: u64,
        deny_votes: u64,
        modify_votes: u64,

        status: u8,

        /// 0 means no final recommendation yet.
        final_recommendation: u8,

        created_at_ms: u64,
        closed_at_ms: u64,
    }

    // =========================================================
    // JURY VOTE RECEIPT
    // =========================================================
    public struct JuryVoteReceipt has key {
        id: UID,

        jury_case_id: address,
        appeal_id: address,
        juror_passport_id: address,

        vote: u8,

        created_at_ms: u64,
    }

    // =========================================================
    // EVENTS
    // =========================================================
    public struct JuryCaseOpened has copy, drop {
        jury_case_id: address,
        appeal_id: address,
        appellant: address,
        passport_id: address,
        required_votes: u64,
    }

    public struct JuryVoteSubmitted has copy, drop {
        jury_case_id: address,
        appeal_id: address,
        vote: u8,
    }

    public struct JuryCaseClosed has copy, drop {
        jury_case_id: address,
        appeal_id: address,
        final_recommendation: u8,
        approve_votes: u64,
        deny_votes: u64,
        modify_votes: u64,
    }

    // =========================================================
    // HELPERS
    // =========================================================
    fun is_valid_vote(vote: u8): bool {
        vote == RESULT_APPROVED ||
        vote == RESULT_DENIED ||
        vote == RESULT_MODIFIED
    }

    fun total_votes(case_obj: &JuryCase): u64 {
        case_obj.approve_votes +
        case_obj.deny_votes +
        case_obj.modify_votes
    }

    fun compute_recommendation(case_obj: &JuryCase): u8 {
        if (
            case_obj.approve_votes >= case_obj.deny_votes &&
            case_obj.approve_votes >= case_obj.modify_votes
        ) {
            RESULT_APPROVED
        } else if (case_obj.deny_votes >= case_obj.modify_votes) {
            RESULT_DENIED
        } else {
            RESULT_MODIFIED
        }
    }

    // =========================================================
    // JUROR ELIGIBILITY
    // Pro or Elite only.
    // Active Black Passport is blocked through effective tier.
    // =========================================================
    public fun is_eligible_juror(
        juror_passport: &passport::Passport,
        juror_conduct: &conduct::ConductStatus,
        ctx: &TxContext
    ): bool {
        let tier = membership::get_effective_tier_with_conduct(
            juror_passport,
            juror_conduct,
            ctx
        );

        tier == PRO || tier == ELITE
    }

    // =========================================================
    // OPEN JURY CASE
    // Package-only until admin / appeal routing is finalized.
    // =========================================================
    public(package) fun open_jury_case(
        appeal: &appeals::AppealCase,
        required_votes: u64,
        ctx: &mut TxContext
    ) {
        assert!(
            appeals::is_open(appeal),
            errors::appeal_already_resolved()
        );

        assert!(
            required_votes > 0,
            errors::invalid_required_votes()
        );

        let case_obj = JuryCase {
            id: object::new(ctx),

            appeal_id: appeals::get_id(appeal),
            appellant: appeals::get_appellant(appeal),
            passport_id: appeals::get_passport_id(appeal),

            required_votes,

            approve_votes: 0,
            deny_votes: 0,
            modify_votes: 0,

            status: STATUS_OPEN,
            final_recommendation: 0,

            created_at_ms: tx_context::epoch_timestamp_ms(ctx),
            closed_at_ms: 0,
        };

        let jury_case_id = object::uid_to_address(&case_obj.id);

        sui::event::emit(JuryCaseOpened {
            jury_case_id,
            appeal_id: case_obj.appeal_id,
            appellant: case_obj.appellant,
            passport_id: case_obj.passport_id,
            required_votes,
        });

        transfer::transfer(case_obj, tx_context::sender(ctx));
    }

    // =========================================================
    // SUBMIT VOTE
    // Public juror action.
    // Requires Pro or Elite effective tier.
    // =========================================================
    public fun submit_vote(
        case_obj: &mut JuryCase,
        juror_passport: &passport::Passport,
        juror_conduct: &conduct::ConductStatus,
        vote: u8,
        ctx: &mut TxContext
    ) {
        assert!(
            case_obj.status == STATUS_OPEN,
            errors::jury_case_closed()
        );

        assert!(
            is_valid_vote(vote),
            errors::invalid_jury_vote()
        );

        assert!(
            is_eligible_juror(juror_passport, juror_conduct, ctx),
            errors::juror_ineligible()
        );

        if (vote == RESULT_APPROVED) {
            case_obj.approve_votes = case_obj.approve_votes + 1;
        } else if (vote == RESULT_DENIED) {
            case_obj.deny_votes = case_obj.deny_votes + 1;
        } else {
            case_obj.modify_votes = case_obj.modify_votes + 1;
        };

        let receipt = JuryVoteReceipt {
            id: object::new(ctx),
            jury_case_id: object::uid_to_address(&case_obj.id),
            appeal_id: case_obj.appeal_id,
            juror_passport_id: passport::get_id(juror_passport),
            vote,
            created_at_ms: tx_context::epoch_timestamp_ms(ctx),
        };

        sui::event::emit(JuryVoteSubmitted {
            jury_case_id: object::uid_to_address(&case_obj.id),
            appeal_id: case_obj.appeal_id,
            vote,
        });

        transfer::transfer(receipt, tx_context::sender(ctx));
    }

    // =========================================================
    // CLOSE JURY CASE
    // Package-only until admin authority is wired.
    // =========================================================
    public(package) fun close_jury_case(
        case_obj: &mut JuryCase,
        ctx: &TxContext
    ) {
        assert!(
            case_obj.status == STATUS_OPEN,
            errors::jury_case_closed()
        );

        assert!(
            total_votes(case_obj) >= case_obj.required_votes,
            errors::jury_not_ready()
        );

        let recommendation = compute_recommendation(case_obj);

        case_obj.status = STATUS_CLOSED;
        case_obj.final_recommendation = recommendation;
        case_obj.closed_at_ms = tx_context::epoch_timestamp_ms(ctx);

        sui::event::emit(JuryCaseClosed {
            jury_case_id: object::uid_to_address(&case_obj.id),
            appeal_id: case_obj.appeal_id,
            final_recommendation: recommendation,
            approve_votes: case_obj.approve_votes,
            deny_votes: case_obj.deny_votes,
            modify_votes: case_obj.modify_votes,
        });
    }

    // =========================================================
    // GETTERS
    // =========================================================
    public fun get_id(case_obj: &JuryCase): address {
        object::uid_to_address(&case_obj.id)
    }

    public fun get_appeal_id(case_obj: &JuryCase): address {
        case_obj.appeal_id
    }

    public fun get_appellant(case_obj: &JuryCase): address {
        case_obj.appellant
    }

    public fun get_passport_id(case_obj: &JuryCase): address {
        case_obj.passport_id
    }

    public fun get_required_votes(case_obj: &JuryCase): u64 {
        case_obj.required_votes
    }

    public fun get_approve_votes(case_obj: &JuryCase): u64 {
        case_obj.approve_votes
    }

    public fun get_deny_votes(case_obj: &JuryCase): u64 {
        case_obj.deny_votes
    }

    public fun get_modify_votes(case_obj: &JuryCase): u64 {
        case_obj.modify_votes
    }

    public fun get_final_recommendation(case_obj: &JuryCase): u8 {
        case_obj.final_recommendation
    }

    public fun is_open(case_obj: &JuryCase): bool {
        case_obj.status == STATUS_OPEN
    }

    public fun is_closed(case_obj: &JuryCase): bool {
        case_obj.status == STATUS_CLOSED
    }

    public fun get_vote_receipt_vote(receipt: &JuryVoteReceipt): u8 {
        receipt.vote
    }

    public fun get_vote_receipt_jury_case_id(receipt: &JuryVoteReceipt): address {
        receipt.jury_case_id
    }
}
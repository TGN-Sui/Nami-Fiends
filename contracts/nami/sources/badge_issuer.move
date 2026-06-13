module nami::badge_issuer {

    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};

    use nami::badge;
    use nami::errors;
    use nami::passport;

    // =========================================================
    // ISSUER TYPES
    // =========================================================
    const ISSUER_NAMI_OFFICIAL: u8 = 1;
    const ISSUER_VERIFIED_DEVELOPER: u8 = 2;
    const ISSUER_VERIFIED_CHANNEL: u8 = 3;
    const ISSUER_APPROVED_GUILD: u8 = 4;
    const ISSUER_EVENT_ORGANIZER: u8 = 5;
    const ISSUER_PARTNER_COMMUNITY: u8 = 6;

    // =========================================================
    // BADGE TYPES
    // =========================================================
    const BASIC_BADGE: u8 = 1;
    const EVENT_BADGE: u8 = 2;
    const COMPLETION_BADGE: u8 = 3;

    // =========================================================
    // BADGE ISSUER CAPABILITY
    // =========================================================
    public struct BadgeIssuerCap has key {
        id: UID,

        owner: address,

        /// Channel, developer, guild, event, or protocol issuer address.
        issuer_id: address,

        issuer_type: u8,

        can_issue_basic: bool,
        can_issue_event: bool,
        can_issue_completion: bool,

        created_at_ms: u64,
    }

    // =========================================================
    // EVENTS
    // =========================================================
    public struct BadgeIssuerCreated has copy, drop {
        owner: address,
        issuer_id: address,
        issuer_type: u8,
        can_issue_basic: bool,
        can_issue_event: bool,
        can_issue_completion: bool,
    }

    public struct BadgeIssuedByIssuer has copy, drop {
        issuer_id: address,
        issuer_type: u8,
        recipient: address,
        badge_type: u8,
    }

    // =========================================================
    // HELPERS
    // =========================================================
    fun is_supported_issuer_type(issuer_type: u8): bool {
        issuer_type == ISSUER_NAMI_OFFICIAL ||
        issuer_type == ISSUER_VERIFIED_DEVELOPER ||
        issuer_type == ISSUER_VERIFIED_CHANNEL ||
        issuer_type == ISSUER_APPROVED_GUILD ||
        issuer_type == ISSUER_EVENT_ORGANIZER ||
        issuer_type == ISSUER_PARTNER_COMMUNITY
    }

    fun can_issue_badge_type(
        issuer_cap: &BadgeIssuerCap,
        badge_type: u8
    ): bool {
        if (badge_type == BASIC_BADGE) {
            issuer_cap.can_issue_basic
        } else if (badge_type == EVENT_BADGE) {
            issuer_cap.can_issue_event
        } else if (badge_type == COMPLETION_BADGE) {
            issuer_cap.can_issue_completion
        } else {
            false
        }
    }

    // =========================================================
    // CREATE ISSUER CAP
    // Package-only until admin/governance approval exists.
    // =========================================================
    public(package) fun create_issuer_cap(
        owner: address,
        issuer_id: address,
        issuer_type: u8,
        can_issue_basic: bool,
        can_issue_event: bool,
        can_issue_completion: bool,
        ctx: &mut TxContext
    ) {
        assert!(
            is_supported_issuer_type(issuer_type),
            errors::invalid_issuer_type()
        );

        let cap = BadgeIssuerCap {
            id: object::new(ctx),
            owner,
            issuer_id,
            issuer_type,
            can_issue_basic,
            can_issue_event,
            can_issue_completion,
            created_at_ms: tx_context::epoch_timestamp_ms(ctx),
        };

        sui::event::emit(BadgeIssuerCreated {
            owner,
            issuer_id,
            issuer_type,
            can_issue_basic,
            can_issue_event,
            can_issue_completion,
        });

        transfer::transfer(cap, owner);
    }

    // =========================================================
    // ISSUE BADGE
    // Public, but protected by BadgeIssuerCap ownership.
    // =========================================================
    public fun issue_badge(
        issuer_cap: &BadgeIssuerCap,
        passport_obj: &mut passport::Passport,
        recipient: address,
        badge_type: u8,
        source: vector<u8>,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);

        assert!(
            sender == issuer_cap.owner,
            errors::badge_issuer_unauthorized()
        );

        assert!(
            can_issue_badge_type(issuer_cap, badge_type),
            errors::badge_issuer_permission_denied()
        );

        badge::mint_badge(
            passport_obj,
            recipient,
            badge_type,
            source,
            ctx
        );

        sui::event::emit(BadgeIssuedByIssuer {
            issuer_id: issuer_cap.issuer_id,
            issuer_type: issuer_cap.issuer_type,
            recipient,
            badge_type,
        });
    }

    // =========================================================
    // GETTERS
    // =========================================================
    public fun get_issuer_owner(issuer_cap: &BadgeIssuerCap): address {
        issuer_cap.owner
    }

    public fun get_issuer_id(issuer_cap: &BadgeIssuerCap): address {
        issuer_cap.issuer_id
    }

    public fun get_issuer_type(issuer_cap: &BadgeIssuerCap): u8 {
        issuer_cap.issuer_type
    }

    public fun can_issue_basic(issuer_cap: &BadgeIssuerCap): bool {
        issuer_cap.can_issue_basic
    }

    public fun can_issue_event(issuer_cap: &BadgeIssuerCap): bool {
        issuer_cap.can_issue_event
    }

    public fun can_issue_completion(issuer_cap: &BadgeIssuerCap): bool {
        issuer_cap.can_issue_completion
    }
}
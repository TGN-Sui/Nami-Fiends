module nami::badge {

    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};

    use nami::errors;
    use nami::passport;

    // =========================================================
    // BADGE TYPES
    // =========================================================
    const BASIC_BADGE: u8 = 1;
    const EVENT_BADGE: u8 = 2;
    const COMPLETION_BADGE: u8 = 3;

    // =========================================================
    // BADGE OBJECT
    // =========================================================
    public struct Badge has key {
        id: UID,

        owner: address,

        badge_type: u8,

        points: u64,

        /// Future metadata hook:
        /// game id, channel id, event id, issuer id, etc.
        source: vector<u8>,
    }

    // =========================================================
    // EVENTS
    // =========================================================
    public struct BadgeMinted has copy, drop {
        owner: address,
        badge_type: u8,
        points: u64,
    }

    // =========================================================
    // POINT RESOLUTION
    // =========================================================
    fun resolve_badge_points(badge_type: u8): u64 {
        if (badge_type == BASIC_BADGE) {
            1
        } else if (badge_type == EVENT_BADGE) {
            2
        } else if (badge_type == COMPLETION_BADGE) {
            3
        } else {
            abort errors::invalid_badge_type()
        }
    }

    // =========================================================
    // INTERNAL BADGE CREATION
    // =========================================================
    fun create_badge(
        owner: address,
        badge_type: u8,
        source: vector<u8>,
        ctx: &mut TxContext
    ): Badge {
        let points = resolve_badge_points(badge_type);

        Badge {
            id: object::new(ctx),
            owner,
            badge_type,
            points,
            source,
        }
    }

    // =========================================================
    // MINT BADGE + UPDATE PASSPORT
    // Package-only until official badge issuer authority exists.
    // =========================================================
    public(package) fun mint_badge(
        passport_obj: &mut passport::Passport,
        owner: address,
        badge_type: u8,
        source: vector<u8>,
        ctx: &mut TxContext
    ) {
        let badge = create_badge(owner, badge_type, source, ctx);

        passport::apply_badge_points(
            passport_obj,
            badge.points
        );

        sui::event::emit(BadgeMinted {
            owner,
            badge_type,
            points: badge.points,
        });

        transfer::transfer(badge, owner);
    }
}
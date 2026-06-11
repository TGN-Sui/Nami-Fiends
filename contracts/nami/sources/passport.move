module nami::passport {

    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};

    use nami::errors;

    // =========================================================
    // REPUTATION SYSTEM
    // =========================================================
    const NEWBIE: u8 = 0;
    const GAMESTER: u8 = 1;
    const GOBLIN: u8 = 2;
    const GOONIE: u8 = 3;
    const FIEND: u8 = 4;

    // =========================================================
    // MEMBERSHIP / ACCESS SYSTEM
    // =========================================================
    const NPC: u8 = 0;
    const ADVENTURER: u8 = 1;
    const PRO: u8 = 2;
    const ELITE: u8 = 3;

    // =========================================================
    // PASSPORT OBJECT
    // =========================================================
    public struct Passport has key {
        id: UID,

        identity_id: address,

        /// Progression
        xp: u64,
        level: u64,

        /// Reputation scoring
        badge_points: u64,
        reputation: u8,

        /// Onboarding gamer archetype
        archetype: u8,

        /// Access tier.
        /// NPC is default.
        /// Tier must only change through controlled functions.
        tier: u8,

        /// Future discovery/influence hook
        boost_score: u64,

        created_at_ms: u64,
    }

    // =========================================================
    // EVENTS
    // =========================================================
    public struct PassportCreated has copy, drop {
        passport_id: address,
        identity_id: address,
    }

    public struct XPAdded has copy, drop {
        passport_id: address,
        amount: u64,
        total_xp: u64,
        level: u64,
    }

    public struct BadgePointsAdded has copy, drop {
        passport_id: address,
        amount: u64,
        total: u64,
        reputation: u8,
    }

    public struct TierUpgraded has copy, drop {
        passport_id: address,
        old_tier: u8,
        new_tier: u8,
    }

    // =========================================================
    // CREATE PASSPORT
    // =========================================================
    public fun create_passport(
        identity_id: address,
        archetype: u8,
        ctx: &mut TxContext
    ): Passport {
        Passport {
            id: object::new(ctx),

            identity_id,

            xp: 0,
            level: 1,

            badge_points: 0,
            reputation: NEWBIE,

            archetype,

            // Everyone starts as NPC until verified / upgraded.
            tier: NPC,

            boost_score: 0,

            created_at_ms: tx_context::epoch_timestamp_ms(ctx),
        }
    }

    // =========================================================
    // INIT PASSPORT
    // =========================================================
    public fun init_passport(
        identity_id: address,
        archetype: u8,
        ctx: &mut TxContext
    ) {
        let passport = create_passport(identity_id, archetype, ctx);
        let passport_id = object::uid_to_address(&passport.id);

        sui::event::emit(PassportCreated {
            passport_id,
            identity_id,
        });

        transfer::transfer(passport, tx_context::sender(ctx));
    }

    // =========================================================
    // XP SYSTEM
    // Package-only until an authorized XP issuer exists.
    // =========================================================
    public(package) fun add_xp(
        passport: &mut Passport,
        amount: u64
    ) {
        passport.xp = passport.xp + amount;
        passport.level = passport.xp / 100 + 1;

        update_reputation_from_progress(passport);

        sui::event::emit(XPAdded {
            passport_id: object::uid_to_address(&passport.id),
            amount,
            total_xp: passport.xp,
            level: passport.level,
        });
    }

    // =========================================================
    // BADGE POINT SYSTEM
    // Package-only so arbitrary users cannot self-award reputation.
    // =========================================================
    public(package) fun apply_badge_points(
        passport: &mut Passport,
        points: u64
    ) {
        passport.badge_points = passport.badge_points + points;

        update_reputation_from_progress(passport);

        sui::event::emit(BadgePointsAdded {
            passport_id: object::uid_to_address(&passport.id),
            amount: points,
            total: passport.badge_points,
            reputation: passport.reputation,
        });
    }

    // =========================================================
    // REPUTATION LOGIC
    // Reputation is earned from progression and badge quality.
    // Membership tier does not affect reputation.
    // =========================================================
    fun update_reputation_from_progress(passport: &mut Passport) {
        if (passport.badge_points > 600 || passport.level >= 100) {
            passport.reputation = FIEND;
        } else if (passport.badge_points > 300 || passport.level >= 70) {
            passport.reputation = GOONIE;
        } else if (passport.badge_points > 150 || passport.level >= 45) {
            passport.reputation = GOBLIN;
        } else if (passport.badge_points > 50 || passport.level >= 15) {
            passport.reputation = GAMESTER;
        } else {
            passport.reputation = NEWBIE;
        };
    }

    // =========================================================
    // SAFE TIER UPGRADE SYSTEM
    // Package-only until verification / membership authority modules exist.
    // Valid path:
    // NPC -> ADVENTURER -> PRO -> ELITE
    // =========================================================
    fun can_upgrade(current: u8, target: u8): bool {
        if (current == NPC && target == ADVENTURER) {
            true
        } else if (current == ADVENTURER && target == PRO) {
            true
        } else if (current == PRO && target == ELITE) {
            true
        } else {
            false
        }
    }

    public(package) fun verify_to_adventurer(
        passport: &mut Passport
    ) {
        let old = passport.tier;

        assert!(
            can_upgrade(old, ADVENTURER),
            errors::invalid_tier_transition()
        );

        passport.tier = ADVENTURER;

        sui::event::emit(TierUpgraded {
            passport_id: object::uid_to_address(&passport.id),
            old_tier: old,
            new_tier: ADVENTURER,
        });
    }

    public(package) fun upgrade_to_pro(
        passport: &mut Passport
    ) {
        let old = passport.tier;

        assert!(
            can_upgrade(old, PRO),
            errors::invalid_tier_transition()
        );

        passport.tier = PRO;

        sui::event::emit(TierUpgraded {
            passport_id: object::uid_to_address(&passport.id),
            old_tier: old,
            new_tier: PRO,
        });
    }

    public(package) fun upgrade_to_elite(
        passport: &mut Passport
    ) {
        let old = passport.tier;

        assert!(
            can_upgrade(old, ELITE),
            errors::invalid_tier_transition()
        );

        passport.tier = ELITE;

        sui::event::emit(TierUpgraded {
            passport_id: object::uid_to_address(&passport.id),
            old_tier: old,
            new_tier: ELITE,
        });
    }

    // =========================================================
    // GETTERS
    // =========================================================
    public fun get_tier(passport: &Passport): u8 {
        passport.tier
    }

    public fun get_level(passport: &Passport): u64 {
        passport.level
    }

    public fun get_reputation(passport: &Passport): u8 {
        passport.reputation
    }

    public fun get_badge_points(passport: &Passport): u64 {
        passport.badge_points
    }

    public fun get_xp(passport: &Passport): u64 {
        passport.xp
    }
}
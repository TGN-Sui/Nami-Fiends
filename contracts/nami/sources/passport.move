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
    // LEVEL SYSTEM
    // =========================================================
    const MAX_LEVEL: u64 = 100;

    // =========================================================
    // PASSPORT OBJECT
    // Soulbound: `key` only (no `store`). Minted once via package transfer,
    // then cannot be public_transfer'd to another wallet.
    // =========================================================
    public struct Passport has key {
        id: UID,

        identity_id: address,

        /// Total XP earned during the current season.
        xp: u64,

        /// Current level.
        level: u64,

        /// XP progress toward next level.
        level_progress: u64,

        /// Badge quality score.
        badge_points: u64,

        /// Reputation rank.
        reputation: u8,

        /// Onboarding gamer archetype.
        archetype: u8,

        /// Access tier.
        /// NPC is default.
        /// Tier must only change through controlled functions.
        tier: u8,

        /// Future discovery/influence hook.
        boost_score: u64,

        /// Points earned after reaching Level 100.
        /// These will later feed Prestige titles.
        prestige_points: u64,

        /// Paid membership expiration for Pro / Elite.
        /// 0 means no expiration timestamp is enforced.
        tier_expires_at_ms: u64,

        /// Prevents duplicate MembershipExpired events for the same cycle.
        membership_expiry_notified: bool,

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
        level_progress: u64,
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

    public struct MembershipRenewed has copy, drop {
        passport_id: address,
        tier: u8,
        expires_at_ms: u64,
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
            level_progress: 0,

            badge_points: 0,
            reputation: NEWBIE,

            archetype,

            // Everyone starts as NPC until verified / upgraded.
            tier: NPC,

            boost_score: 0,
            prestige_points: 0,

            tier_expires_at_ms: 0,
            membership_expiry_notified: false,

            created_at_ms: tx_context::epoch_timestamp_ms(ctx),
        }
    }

    /// Minimal on-chain anchor for enter_nami.
    /// XP, tier, reputation, and conduct are tracked off-chain for frictionless UX.
    public(package) fun create_onboarding_anchor(
        identity_id: address,
        archetype: u8,
        ctx: &mut TxContext
    ): Passport {
        Passport {
            id: object::new(ctx),
            identity_id,
            archetype,
            xp: 0,
            level: 0,
            level_progress: 0,
            badge_points: 0,
            reputation: NEWBIE,
            tier: NPC,
            boost_score: 0,
            prestige_points: 0,
            tier_expires_at_ms: 0,
            membership_expiry_notified: false,
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
        emit_passport_created(
            object::uid_to_address(&passport.id),
            identity_id
        );

        transfer::transfer(passport, tx_context::sender(ctx));
    }

    public(package) fun emit_passport_created(
        passport_id: address,
        identity_id: address
    ) {
        sui::event::emit(PassportCreated {
            passport_id,
            identity_id,
        });
    }

    /// One-time soulbind delivery to the minting wallet.
    public(package) fun transfer_to_owner(passport: Passport, owner: address) {
        transfer::transfer(passport, owner);
    }

    // =========================================================
    // LEVEL CURVE
    // =========================================================
    fun xp_required_for_next_level(level: u64): u64 {
        if (level < 10) {
            // Level 1-9: 5-7 XP
            5 + level / 4
        } else if (level < 30) {
            // Level 10-29: 7-11 XP
            7 + (level - 10) / 4
        } else if (level < 60) {
            // Level 30-59: 12-17 XP
            12 + (level - 30) / 5
        } else if (level < 90) {
            // Level 60-89: 18-25 XP
            18 + (level - 60) / 4
        } else {
            // Level 90-99: 26-35 XP
            26 + (level - 90)
        }
    }

    // =========================================================
    // XP SYSTEM
    // Package-only until an authorized XP issuer exists.
    // Badge points currently also grant XP.
    // =========================================================
    public(package) fun add_xp(
        passport: &mut Passport,
        amount: u64
    ) {
        apply_xp(passport, amount);

        sui::event::emit(XPAdded {
            passport_id: object::uid_to_address(&passport.id),
            amount,
            total_xp: passport.xp,
            level: passport.level,
            level_progress: passport.level_progress,
        });
    }

    fun apply_xp(
        passport: &mut Passport,
        amount: u64
    ) {
        passport.xp = passport.xp + amount;

        if (passport.level >= MAX_LEVEL) {
            passport.prestige_points = passport.prestige_points + amount;
        } else {
            passport.level_progress = passport.level_progress + amount;

            while (
                passport.level < MAX_LEVEL &&
                passport.level_progress >= xp_required_for_next_level(passport.level)
            ) {
                let required = xp_required_for_next_level(passport.level);

                passport.level_progress = passport.level_progress - required;
                passport.level = passport.level + 1;
            };

            if (passport.level >= MAX_LEVEL) {
                passport.prestige_points =
                    passport.prestige_points + passport.level_progress;

                passport.level_progress = 0;
            };
        };

        update_reputation_from_progress(passport);
    }

    // =========================================================
    // BADGE POINT SYSTEM
    // Package-only so arbitrary users cannot self-award reputation.
    // Badge points also feed XP progression.
    // =========================================================
    public(package) fun apply_badge_points(
        passport: &mut Passport,
        points: u64
    ) {
        passport.badge_points = passport.badge_points + points;

        apply_xp(passport, points);

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
    //
    // These badge thresholds now roughly align with the curved
    // XP path instead of the older linear thresholds.
    // =========================================================
    fun update_reputation_from_progress(passport: &mut Passport) {
        if (passport.badge_points >= 1600 || passport.level >= 100) {
            passport.reputation = FIEND;
        } else if (passport.badge_points >= 850 || passport.level >= 70) {
            passport.reputation = GOONIE;
        } else if (passport.badge_points >= 425 || passport.level >= 45) {
            passport.reputation = GOBLIN;
        } else if (passport.badge_points >= 90 || passport.level >= 15) {
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

    fun assert_valid_membership_expiration(
        expires_at_ms: u64,
        now_ms: u64
    ) {
        assert!(
            expires_at_ms == 0 || expires_at_ms > now_ms,
            errors::invalid_membership_expiration()
        );
    }

    fun set_membership_expiration(
        passport: &mut Passport,
        expires_at_ms: u64,
        now_ms: u64
    ) {
        assert_valid_membership_expiration(expires_at_ms, now_ms);
        passport.tier_expires_at_ms = expires_at_ms;
        passport.membership_expiry_notified = false;
    }

    public(package) fun upgrade_to_pro(
        passport: &mut Passport,
        expires_at_ms: u64,
        ctx: &TxContext
    ) {
        let now_ms = tx_context::epoch_timestamp_ms(ctx);
        let old = passport.tier;

        if (old == PRO) {
            set_membership_expiration(passport, expires_at_ms, now_ms);

            sui::event::emit(MembershipRenewed {
                passport_id: object::uid_to_address(&passport.id),
                tier: PRO,
                expires_at_ms,
            });

            return
        };

        assert!(
            can_upgrade(old, PRO),
            errors::invalid_tier_transition()
        );

        passport.tier = PRO;
        set_membership_expiration(passport, expires_at_ms, now_ms);

        sui::event::emit(TierUpgraded {
            passport_id: object::uid_to_address(&passport.id),
            old_tier: old,
            new_tier: PRO,
        });
    }

    public(package) fun upgrade_to_elite(
        passport: &mut Passport,
        expires_at_ms: u64,
        ctx: &TxContext
    ) {
        let now_ms = tx_context::epoch_timestamp_ms(ctx);
        let old = passport.tier;

        if (old == ELITE) {
            set_membership_expiration(passport, expires_at_ms, now_ms);

            sui::event::emit(MembershipRenewed {
                passport_id: object::uid_to_address(&passport.id),
                tier: ELITE,
                expires_at_ms,
            });

            return
        };

        assert!(
            can_upgrade(old, ELITE),
            errors::invalid_tier_transition()
        );

        passport.tier = ELITE;
        set_membership_expiration(passport, expires_at_ms, now_ms);

        sui::event::emit(TierUpgraded {
            passport_id: object::uid_to_address(&passport.id),
            old_tier: old,
            new_tier: ELITE,
        });
    }

    public(package) fun mark_membership_expiry_notified(
        passport: &mut Passport
    ) {
        passport.membership_expiry_notified = true;
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

    public fun get_level_progress(passport: &Passport): u64 {
        passport.level_progress
    }

    public fun get_prestige_points(passport: &Passport): u64 {
        passport.prestige_points
    }

    public fun get_archetype(passport: &Passport): u8 {
        passport.archetype
    }

    public fun get_identity_id(passport: &Passport): address {
    passport.identity_id
    }
    
    public fun get_id(passport: &Passport): address {
    object::uid_to_address(&passport.id)
    }

    public fun get_tier_expires_at_ms(passport: &Passport): u64 {
        passport.tier_expires_at_ms
    }

    public fun get_membership_expiry_notified(passport: &Passport): bool {
        passport.membership_expiry_notified
    }

}
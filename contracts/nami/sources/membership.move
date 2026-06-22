module nami::membership {

    use sui::tx_context::TxContext;

    use nami::conduct;
    use nami::errors;
    use nami::passport;

    // =========================================================
    // MEMBERSHIP TIERS
    // =========================================================
    const NPC: u8 = 0;
    const ADVENTURER: u8 = 1;
    const PRO: u8 = 2;
    const ELITE: u8 = 3;

    // =========================================================
    // EVENTS
    // =========================================================
    public struct MembershipExpired has copy, drop {
        passport_id: address,
        expired_tier: u8,
        fallback_tier: u8,
        expired_at_ms: u64,
    }

    // =========================================================
    // EFFECTIVE TIER
    // =========================================================
    public fun effective_tier_at(
        passport_obj: &passport::Passport,
        now_ms: u64
    ): u8 {
        let raw_tier = passport::get_tier(passport_obj);

        if (raw_tier == PRO || raw_tier == ELITE) {
            let expires_at_ms = passport::get_tier_expires_at_ms(passport_obj);

            if (expires_at_ms > 0 && now_ms >= expires_at_ms) {
                ADVENTURER
            } else {
                raw_tier
            }
        } else {
            raw_tier
        }
    }

    // =========================================================
    // RAW TIER
    // =========================================================
    // Package and internal systems may still read raw Passport tier.
    // Front-facing access systems should prefer effective tier.
    // =========================================================
    public fun get_effective_tier(
        passport_obj: &passport::Passport,
        ctx: &TxContext
    ): u8 {
        effective_tier_at(passport_obj, tx_context::epoch_timestamp_ms(ctx))
    }

    // =========================================================
    // CONDUCT-AWARE EFFECTIVE TIER
    // =========================================================
    // If Conduct is Black and active, benefits fall back to NPC.
    //
    // Effective tier also considers membership expiration:
    // expired Pro / Elite fall back to Adventurer without deleting history.
    // =========================================================
    public fun get_effective_tier_with_conduct(
        passport_obj: &passport::Passport,
        conduct_status: &conduct::ConductStatus,
        ctx: &TxContext
    ): u8 {
        assert!(
            conduct::get_passport_id(conduct_status) == passport::get_id(passport_obj),
            errors::invalid_owner()
        );

        if (conduct::has_active_benefits(conduct_status, ctx)) {
            effective_tier_at(passport_obj, tx_context::epoch_timestamp_ms(ctx))
        } else {
            NPC
        }
    }

    // =========================================================
    // EXPIRATION NOTIFICATION
    // =========================================================
    public fun notify_membership_expired_if_due(
        passport_obj: &mut passport::Passport,
        ctx: &TxContext
    ) {
        let now_ms = tx_context::epoch_timestamp_ms(ctx);
        let raw_tier = passport::get_tier(passport_obj);
        let expires_at_ms = passport::get_tier_expires_at_ms(passport_obj);

        if (
            (raw_tier == PRO || raw_tier == ELITE) &&
            expires_at_ms > 0 &&
            now_ms >= expires_at_ms &&
            !passport::get_membership_expiry_notified(passport_obj)
        ) {
            sui::event::emit(MembershipExpired {
                passport_id: passport::get_id(passport_obj),
                expired_tier: raw_tier,
                fallback_tier: ADVENTURER,
                expired_at_ms: expires_at_ms,
            });

            passport::mark_membership_expiry_notified(passport_obj);
        }
    }

    // =========================================================
    // MEMBERSHIP AUTHORITY
    // =========================================================
    public(package) fun upgrade_to_pro(
        passport_obj: &mut passport::Passport,
        expires_at_ms: u64,
        _ctx: &mut TxContext
    ) {
        passport::upgrade_to_pro(passport_obj, expires_at_ms, _ctx);
    }

    public(package) fun upgrade_to_elite(
        passport_obj: &mut passport::Passport,
        expires_at_ms: u64,
        _ctx: &mut TxContext
    ) {
        passport::upgrade_to_elite(passport_obj, expires_at_ms, _ctx);
    }
}
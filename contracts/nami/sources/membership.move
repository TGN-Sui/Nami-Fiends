module nami::membership {

    use sui::tx_context::TxContext;

    use nami::conduct;
    use nami::errors;
    use nami::passport;

    // =========================================================
    // MEMBERSHIP TIERS
    // =========================================================
    const NPC: u8 = 0;

    // =========================================================
    // RAW TIER
    // =========================================================
    // Package and internal systems may still read raw Passport tier.
    // Front-facing access systems should prefer effective tier.
    // =========================================================
    public fun get_effective_tier(
        passport_obj: &passport::Passport
    ): u8 {
        passport::get_tier(passport_obj)
    }

    // =========================================================
    // CONDUCT-AWARE EFFECTIVE TIER
    // =========================================================
    // If Conduct is Black and active, benefits fall back to NPC.
    //
    // Future effective tier will also consider:
    // - membership expiration
    // - renewal status
    // - grace periods
    // - verification status
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
            passport::get_tier(passport_obj)
        } else {
            NPC
        }
    }

    // =========================================================
    // MEMBERSHIP AUTHORITY
    // =========================================================
    // Package-only until payment / subscription / renewal logic exists.
    // =========================================================
    public(package) fun upgrade_to_pro(
        passport_obj: &mut passport::Passport,
        _expires_at_ms: u64,
        _ctx: &mut TxContext
    ) {
        passport::upgrade_to_pro(passport_obj);
    }

    public(package) fun upgrade_to_elite(
        passport_obj: &mut passport::Passport,
        _expires_at_ms: u64,
        _ctx: &mut TxContext
    ) {
        passport::upgrade_to_elite(passport_obj);
    }
}
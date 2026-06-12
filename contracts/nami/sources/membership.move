module nami::membership {

    use sui::tx_context::TxContext;

    use nami::passport;

    // =========================================================
    // EFFECTIVE TIER
    // =========================================================
    // For now, effective tier is the Passport tier.
    //
    // Future effective tier will consider:
    // - membership expiration
    // - renewal status
    // - grace periods
    // - conduct status
    // - Black Passport restrictions
    // - verification status
    // =========================================================

    public fun get_effective_tier(
        passport_obj: &passport::Passport
    ): u8 {
        passport::get_tier(passport_obj)
    }

    // =========================================================
    // MEMBERSHIP AUTHORITY
    // =========================================================
    // Package-only for now.
    //
    // This prevents users from externally self-upgrading to Pro or Elite
    // until payment / subscription / renewal logic exists.
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
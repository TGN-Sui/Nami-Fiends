module nami::errors {

    // =========================================================
    // IDENTITY ERRORS
    // =========================================================
    const EIdentityExists: u64 = 0;
    const EIdentityNotFound: u64 = 1;
    const EInvalidOwner: u64 = 2;

    // =========================================================
    // PASSPORT ERRORS
    // =========================================================
    const EPassportNotFound: u64 = 10;
    const EPassportAlreadyExists: u64 = 11;

    // =========================================================
    // VERIFICATION ERRORS
    // =========================================================
    const ENotVerified: u64 = 20;
    const EInsufficientVerification: u64 = 21;

    // =========================================================
    // ACCESS CONTROL ERRORS
    // =========================================================
    const EUnauthorized: u64 = 30;
    const EInsufficientTier: u64 = 31;

    // =========================================================
    // GUILD ERRORS
    // =========================================================
    const EGuildNotFound: u64 = 40;
    const EGuildLimitReached: u64 = 41;

    // =========================================================
    // SQUAD ERRORS
    // =========================================================
    const ESquadLimitReached: u64 = 50;
    const ESquadUnauthorized: u64 = 51;

    // =========================================================
    // BOOST ERRORS
    // =========================================================
    const EBoostUnavailable: u64 = 60;
    const EBoostLimitReached: u64 = 61;

    // =========================================================
    // BADGE ERRORS
    // =========================================================
    const EInvalidBadgeType: u64 = 70;

    // =========================================================
    // MEMBERSHIP / TIER ERRORS
    // =========================================================
    const EInvalidTierTransition: u64 = 80;
    const ENotEligibleForTier: u64 = 81;

    // =========================================================
    // PUBLIC ERROR GETTERS
    // =========================================================

    public fun identity_exists(): u64 {
        EIdentityExists
    }

    public fun identity_not_found(): u64 {
        EIdentityNotFound
    }

    public fun invalid_owner(): u64 {
        EInvalidOwner
    }

    public fun passport_not_found(): u64 {
        EPassportNotFound
    }

    public fun passport_already_exists(): u64 {
        EPassportAlreadyExists
    }

    public fun not_verified(): u64 {
        ENotVerified
    }

    public fun insufficient_verification(): u64 {
        EInsufficientVerification
    }

    public fun unauthorized(): u64 {
        EUnauthorized
    }

    public fun insufficient_tier(): u64 {
        EInsufficientTier
    }

    public fun guild_not_found(): u64 {
        EGuildNotFound
    }

    public fun guild_limit_reached(): u64 {
        EGuildLimitReached
    }

    public fun squad_limit_reached(): u64 {
        ESquadLimitReached
    }

    public fun squad_unauthorized(): u64 {
        ESquadUnauthorized
    }

    public fun boost_unavailable(): u64 {
        EBoostUnavailable
    }

    public fun boost_limit_reached(): u64 {
        EBoostLimitReached
    }

    public fun invalid_badge_type(): u64 {
        EInvalidBadgeType
    }

    public fun invalid_tier_transition(): u64 {
        EInvalidTierTransition
    }

    public fun not_eligible_for_tier(): u64 {
        ENotEligibleForTier
    }
}
module nami::boost {

    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};

    use nami::conduct;
    use nami::errors;
    use nami::membership;
    use nami::passport;

    // =========================================================
    // MEMBERSHIP TIERS
    // =========================================================
    const ADVENTURER: u8 = 1;
    const PRO: u8 = 2;
    const ELITE: u8 = 3;

    // =========================================================
    // BOOST OBJECT
    // =========================================================
    public struct Boost has key {
        id: UID,

        owner: address,

        channel_id: address,

        /// Current model:
        /// Adventurer = 1
        /// Pro = 6
        /// Elite = 8
        power: u8,

        /// Weekly cycle identifier.
        week_id: u64,
    }

    // =========================================================
    // EVENTS
    // =========================================================
    public struct BoostUsed has copy, drop {
        owner: address,
        channel_id: address,
        power: u8,
        tier: u8,
        week_id: u64,
    }

    // =========================================================
    // BOOST POWER RESOLUTION
    // =========================================================
    fun resolve_boost_power(tier: u8): u8 {
        if (tier == ADVENTURER) {
            1
        } else if (tier == PRO) {
            6
        } else if (tier == ELITE) {
            8
        } else {
            abort errors::boost_unavailable()
        }
    }

    // =========================================================
    // INTERNAL BOOST CREATION
    // =========================================================
    fun create_boost(
        owner: address,
        tier: u8,
        channel_id: address,
        week_id: u64,
        ctx: &mut TxContext
    ): Boost {
        let power = resolve_boost_power(tier);

        Boost {
            id: object::new(ctx),
            owner,
            channel_id,
            power,
            week_id,
        }
    }

    // =========================================================
    // LEGACY / PACKAGE-ONLY BOOST
    // =========================================================
    // This remains available inside the package for tests/internal setup.
    // External usage should use conduct-aware boost below.
    // =========================================================
    public(package) fun use_boost(
        passport_obj: &passport::Passport,
        channel_id: address,
        week_id: u64,
        ctx: &mut TxContext
    ) {
        let owner = tx_context::sender(ctx);

        let tier = membership::get_effective_tier(passport_obj);

        let boost = create_boost(
            owner,
            tier,
            channel_id,
            week_id,
            ctx
        );

        sui::event::emit(BoostUsed {
            owner,
            channel_id,
            power: boost.power,
            tier,
            week_id,
        });

        transfer::transfer(boost, owner);
    }

    // =========================================================
    // CONDUCT-AWARE BOOST
    // =========================================================
    // Public safe path.
    //
    // If Conduct is Black and active, Membership returns NPC-equivalent
    // effective tier, which makes boost resolve to boost_unavailable.
    // =========================================================
    public fun use_boost_with_conduct(
        passport_obj: &passport::Passport,
        conduct_status: &conduct::ConductStatus,
        channel_id: address,
        week_id: u64,
        ctx: &mut TxContext
    ) {
        let owner = tx_context::sender(ctx);

        let tier = membership::get_effective_tier_with_conduct(
            passport_obj,
            conduct_status,
            ctx
        );

        let boost = create_boost(
            owner,
            tier,
            channel_id,
            week_id,
            ctx
        );

        sui::event::emit(BoostUsed {
            owner,
            channel_id,
            power: boost.power,
            tier,
            week_id,
        });

        transfer::transfer(boost, owner);
    }
}